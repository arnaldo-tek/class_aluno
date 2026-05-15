/**
 * DEBUG: Inspect a Pagar.me subscription and compare with our DB.
 * Returns subscription split rules, recipient details, and matching DB records.
 *
 * POST /debug-subscription
 * Body: { secret: string, subscription_id?: string }
 */
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createSupabaseAdmin } from '../_shared/supabase.ts'
import { pagarmeRequest, PagarmeError } from '../_shared/pagarme.ts'
import { resolveReceiverIds } from '../_shared/checkout.ts'

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const body = await req.json()
    const secret = Deno.env.get('MAINTENANCE_SECRET')
    if (!secret || body.secret !== secret) return errorResponse('Forbidden', 403)

    const supabase = createSupabaseAdmin()

    // Get all active subscriptions if none specified
    let subscriptionIds: string[] = []
    if (body.subscription_id) {
      subscriptionIds = [body.subscription_id]
    } else {
      const { data: subs } = await supabase
        .from('package_access')
        .select('pagarme_subscription_id, cancelled_at')
        .not('pagarme_subscription_id', 'is', null)
      subscriptionIds = (subs ?? []).map((s) => s.pagarme_subscription_id as string)
    }

    const results: any[] = []

    for (const subId of subscriptionIds) {
      const result: any = { subscription_id: subId }

      // 1. Get DB info
      const { data: accessRow } = await supabase
        .from('package_access')
        .select('user_id, pacote_id, created_at, next_billing_date')
        .eq('pagarme_subscription_id', subId)
        .maybeSingle()
      result.db_access = accessRow

      // 2. Get expected receiver IDs from DB
      if (accessRow) {
        result.expected_receiver_ids = await resolveReceiverIds(
          supabase,
          undefined,
          accessRow.pacote_id,
        )
      }

      // 3. Get subscription from Pagar.me
      try {
        const sub = await pagarmeRequest<any>(`/subscriptions/${subId}`)
        result.pagarme_subscription = {
          id: sub.id,
          status: sub.status,
          payment_method: sub.payment_method,
          interval: sub.interval,
          interval_count: sub.interval_count,
          minimum_price: sub.minimum_price,
          next_billing_at: sub.next_billing_at,
          current_cycle: sub.current_cycle,
          split: sub.split, // <- key field
        }
      } catch (err) {
        result.pagarme_error = err instanceof PagarmeError ? err.data : String(err)
      }

      // 4. Get subscription invoices/charges
      try {
        const invoices = await pagarmeRequest<any>(
          `/subscriptions/${subId}/invoices?size=10`,
        )
        result.invoices = (invoices.data ?? []).map((inv: any) => ({
          id: inv.id,
          status: inv.status,
          amount: inv.amount,
          paid_at: inv.paid_at,
          created_at: inv.created_at,
          charge: inv.charge ? {
            id: inv.charge.id,
            status: inv.charge.status,
            paid_amount: inv.charge.paid_amount,
            split: inv.charge.split, // <- split actually applied
          } : null,
        }))
      } catch (err) {
        result.invoices_error = err instanceof PagarmeError ? err.data : String(err)
      }

      results.push(result)
    }

    // Pull last 45 days of charges, then GET each individually to extract split
    const since = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    const until = new Date().toISOString()
    let allCharges: any[] = []
    try {
      let page = 1
      const list: any[] = []
      while (page <= 10) {
        const q = new URLSearchParams({
          page: String(page),
          size: '50',
          created_since: since,
          created_until: until,
          status: 'paid',
        })
        const res = await pagarmeRequest<any>(`/charges?${q}`)
        const items = res.data ?? []
        list.push(...items)
        if (items.length < 50) break
        page++
      }

      // For each paid charge, GET full detail
      for (const c of list) {
        try {
          const full = await pagarmeRequest<any>(`/charges/${c.id}`)
          const splits = full.last_transaction?.split
            ?? full.split
            ?? full.last_transaction?.metadata?.split
            ?? []
          allCharges.push({
            id: full.id,
            status: full.status,
            amount: full.amount,
            paid_amount: full.paid_amount,
            payment_method: full.payment_method,
            paid_at: full.paid_at,
            created_at: full.created_at,
            order_id: full.order?.id ?? null,
            customer_name: full.customer?.name ?? null,
            split_count: Array.isArray(splits) ? splits.length : 0,
            split: Array.isArray(splits) ? splits.map((s: any) => ({
              recipient_id: s.recipient_id ?? s.recipient?.id ?? null,
              amount: s.amount,
              type: s.type,
            })) : [],
          })
        } catch (err) {
          allCharges.push({ id: c.id, error: String(err) })
        }
      }
    } catch (err) {
      allCharges = [{ error: err instanceof PagarmeError ? err.data : String(err) }]
    }

    // For unsplit charges, look up the order to see curso/pacote and resolve receivers
    const unsplitOrders = allCharges
      .filter((c: any) => c.split_count === 0 && c.order_id)
      .map((c: any) => c.order_id)
    const orderAnalysis: any[] = []
    for (const oid of unsplitOrders.slice(0, 20)) {
      try {
        const order = await pagarmeRequest<any>(`/orders/${oid}`)
        const codeRaw = order.items?.[0]?.code ?? null
        // Try as curso first, then pacote, then other tables
        let curso: any = null
        let pacote: any = null
        let foundIn: string | null = null
        let resolvedReceivers: string[] = []
        if (codeRaw) {
          const tables = ['cursos', 'pacotes', 'audiocursos', 'leis', 'mentorias', 'aulas', 'modulos']
          for (const t of tables) {
            const { data: row } = await supabase.from(t).select('*').eq('id', codeRaw).maybeSingle()
            if (row) {
              foundIn = t
              if (t === 'cursos') curso = row
              if (t === 'pacotes') pacote = row
              break
            }
          }
          // Test with the raw code as if it were a curso_id (mimics what payment-checkout does)
          resolvedReceivers = await resolveReceiverIds(supabase, codeRaw, undefined)
          if (resolvedReceivers.length === 0) {
            // Try as pacote_id
            resolvedReceivers = await resolveReceiverIds(supabase, undefined, codeRaw)
          }
        }
        // Look at what split was sent in order.charges[0].split
        const sentSplit = order.charges?.[0]?.split ?? order.charges?.[0]?.last_transaction?.split ?? []
        orderAnalysis.push({
          order_id: oid,
          amount: order.amount,
          status: order.status,
          item_code: codeRaw,
          found_in_table: foundIn,
          curso: curso ? { id: curso.id, nome: curso.nome, professor_id: curso.professor_id, deleted_at: curso.deleted_at } : null,
          pacote: pacote ? { id: pacote.id, nome: pacote.nome, deleted_at: pacote.deleted_at } : null,
          resolved_receivers_now: resolvedReceivers,
          split_sent_in_order: sentSplit,
        })
      } catch (err) {
        orderAnalysis.push({ order_id: oid, error: String(err) })
      }
    }

    // Audit: list ALL professors and their receiver_id status
    const { data: allProfs, error: profErr } = await supabase
      .from('professor_profiles')
      .select('id, user_id, pagarme_receiver_id, deleted_at')

    const profsByStatus: any = {
      sem_receiver_id: [] as any[],
      com_receiver_id: [] as any[],
      query_error: profErr?.message ?? null,
      total_rows: (allProfs ?? []).length,
    }
    for (const p of (allProfs ?? [])) {
      // Fetch profile name separately
      const { data: prof } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', p.user_id)
        .maybeSingle()
      const entry = {
        id: p.id,
        user_id: p.user_id,
        name: prof?.display_name ?? '?',
        email: prof?.email ?? '?',
        receiver_id: p.pagarme_receiver_id,
        deleted_at: p.deleted_at,
      }
      if (p.pagarme_receiver_id) profsByStatus.com_receiver_id.push(entry)
      else profsByStatus.sem_receiver_id.push(entry)
    }

    // For each prof without receiver_id, count their published cursos
    for (const prof of profsByStatus.sem_receiver_id) {
      const { count } = await supabase
        .from('cursos')
        .select('id', { count: 'exact', head: true })
        .eq('professor_id', prof.id)
        .is('deleted_at', null)
      ;(prof as any).cursos_publicados = count ?? 0
    }

    return jsonResponse({ count: results.length, results, charges_45d: allCharges, unsplit_analysis: orderAnalysis, professors_audit: profsByStatus })
  } catch (err) {
    console.error('debug-subscription error:', err)
    return errorResponse(err.message ?? 'Internal error', 500)
  }
})
