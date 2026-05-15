import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createSupabaseFromRequest, createSupabaseAdmin } from '../_shared/supabase.ts'
import { pagarmeRequest, PagarmeError } from '../_shared/pagarme.ts'
import { resolveReceiverIds, createMovimentacaoSplits } from '../_shared/checkout.ts'

const PLATFORM_RECEIVER_ID = 're_cm7m9wnhe0jnv0l9tbhvr7rky'

/** Subscriptions API only allows type 'percentage'. Platform = 25%, teachers split 75% equally. */
function buildSubscriptionSplitRules(receiverIds: string[]) {
  const unique = [...new Set(receiverIds)]
  if (unique.length === 0) return []

  const platformPct = 25
  const teachersPct = 75
  const perTeacher = Math.floor(teachersPct / unique.length)
  const remainder = teachersPct - perTeacher * unique.length

  const rules = [
    {
      amount: platformPct,
      recipient_id: PLATFORM_RECEIVER_ID,
      type: 'percentage',
      options: { charge_processing_fee: true, charge_remainder_fee: true, liable: true },
    },
    ...unique.map((rid, i) => ({
      amount: perTeacher + (i === unique.length - 1 ? remainder : 0),
      recipient_id: rid,
      type: 'percentage',
      options: { charge_processing_fee: false, charge_remainder_fee: false, liable: false },
    })),
  ]

  return rules
}

interface CreateSubscriptionBody {
  action: 'create'
  customer_id: string
  pacote_id: string
  card: {
    number: string
    holder_name: string
    exp_month: number
    exp_year: number
    cvv: string
  }
  amount: number
  interval: 'month' | 'year'
  interval_count?: number
  description?: string
}

interface CancelSubscriptionBody {
  action: 'cancel'
  pacote_id: string
}

type SubscriptionBody = CreateSubscriptionBody | CancelSubscriptionBody

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const supabase = createSupabaseFromRequest(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return jsonResponse({ error: 'Unauthorized' })

    const body: SubscriptionBody = await req.json()
    console.log('payment-subscription action:', body?.action, 'pacote_id:', (body as any)?.pacote_id)

    if (body.action === 'create') {
      if (!body.customer_id || !body.card || !body.amount || !body.pacote_id) {
        return jsonResponse({ error: 'customer_id, pacote_id, card, and amount are required' })
      }

      const admin = createSupabaseAdmin()
      const receiverIds = await resolveReceiverIds(admin, undefined, body.pacote_id)
      // Subscriptions API only allows type 'percentage' (not flat amounts like orders)
      const splitRules = buildSubscriptionSplitRules(receiverIds)

      // Ciclo curto só para testes (renovação em ~1 dia). Secret no projeto — desligar após o teste.
      const debugShort = ['1', 'true', 'yes'].includes(
        (Deno.env.get('SUBSCRIPTION_DEBUG_SHORT_CYCLE') ?? '').toLowerCase(),
      )
      const interval = debugShort ? 'day' : (body.interval || 'month')
      const intervalCount = debugShort ? 1 : (body.interval_count || 1)
      if (debugShort) {
        const maxCentsRaw = Deno.env.get('SUBSCRIPTION_DEBUG_MAX_AMOUNT_CENTS')
        const parsed = maxCentsRaw != null && maxCentsRaw !== '' ? parseInt(maxCentsRaw, 10) : NaN
        const cap = Number.isFinite(parsed) && parsed > 0 ? parsed : 300
        if (body.amount > cap) {
          return jsonResponse(
            {
              error:
                `Modo teste (cobrança diária): valor ${body.amount}¢ acima do teto ${cap}¢. Ajuste SUBSCRIPTION_DEBUG_MAX_AMOUNT_CENTS ou desligue SUBSCRIPTION_DEBUG_SHORT_CYCLE.`,
            },
            400,
          )
        }
        console.warn(
          `[payment-subscription] SUBSCRIPTION_DEBUG_SHORT_CYCLE: interval=day amount=${body.amount}¢ teto=${cap}c — unset o secret após validar`,
        )
      }

      const subscription = await pagarmeRequest<{
        id: string
        status: string
        current_period?: { end_at?: string }
        next_billing_at?: string
      }>(
        '/subscriptions',
        'POST',
        {
          customer_id: body.customer_id,
          payment_method: 'credit_card',
          // Subscriptions API: card goes at root level, not inside credit_card
          card: {
            number: body.card.number,
            holder_name: body.card.holder_name,
            exp_month: body.card.exp_month,
            exp_year: body.card.exp_year,
            cvv: body.card.cvv,
            billing_address: {
              line_1: '1, Rua Teste, Centro',
              zip_code: '01001000',
              city: 'São Paulo',
              state: 'SP',
              country: 'BR',
            },
          },
          statement_descriptor: 'SuperClasse',
          interval,
          interval_count: intervalCount,
          minimum_price: body.amount,
          items: [
            {
              description: body.description || 'Assinatura SuperClasse',
              quantity: 1,
              pricing_scheme: {
                price: body.amount,
                scheme_type: 'unit',
              },
            },
          ],
          ...(splitRules.length > 0 ? { split: { rules: splitRules } } : {}),
        },
      )

      // Calculate next billing date (1 month from now as default)
      const nextBilling = subscription.next_billing_at
        ?? subscription.current_period?.end_at
        ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      const { error: accessError } = await admin.from('package_access').upsert(
        {
          user_id: user.id,
          pacote_id: body.pacote_id,
          pagarme_subscription_id: subscription.id,
          access_expire_date: nextBilling,
          next_billing_date: nextBilling,
          cancelled_at: null,
        },
        { onConflict: 'pacote_id,user_id' },
      )
      if (accessError) {
        console.error('package_access upsert failed:', accessError)
        return jsonResponse(
          {
            error: 'Assinatura criada no Pagar.me, mas falhou ao registrar o acesso no app. Fale com o suporte.',
            details: accessError.message,
          },
          500,
        )
      }

      // Enroll in all package courses
      const { data: cursos } = await admin
        .from('pacote_cursos')
        .select('curso_id')
        .eq('pacote_id', body.pacote_id)

      if (cursos) {
        for (const c of cursos) {
          const { error: enrollError } = await admin.from('enrollments').upsert(
            { user_id: user.id, curso_id: c.curso_id },
            { onConflict: 'user_id,curso_id' },
          )
          if (enrollError) {
            console.error('enrollment upsert failed:', enrollError, c)
            return jsonResponse(
              {
                error: 'Acesso ao pacote foi registrado, mas falhou ao matricular nos cursos. Fale com o suporte.',
                details: enrollError.message,
              },
              500,
            )
          }
        }
      }

      // Create movimentacao for initial subscription charge
      const isPaid = subscription.status === 'active' || subscription.status === 'paid'
      const { data: mov } = await admin.from('movimentacoes').insert({
        pagarme_order_id: subscription.id,
        valor: body.amount / 100,
        user_id: user.id,
        pacote_id: body.pacote_id,
        status: isPaid ? 'paid' : 'pending',
      }).select('id').single()

      if (mov && isPaid) {
        await createMovimentacaoSplits(admin, mov.id, body.amount, undefined, body.pacote_id)
      }

      return jsonResponse({
        subscription_id: subscription.id,
        status: subscription.status,
        next_billing_at: nextBilling,
      })
    }

    if (body.action === 'cancel') {
      if (!body.pacote_id) {
        return jsonResponse({ error: 'pacote_id is required' })
      }

      const admin = createSupabaseAdmin()

      // Lookup subscription from package_access
      const { data: access, error: dbError } = await admin
        .from('package_access')
        .select('id, pagarme_subscription_id, access_expire_date, cancelled_at')
        .eq('user_id', user.id)
        .eq('pacote_id', body.pacote_id)
        .maybeSingle()

      console.log('cancel lookup:', { access, dbError, user_id: user.id, pacote_id: body.pacote_id })

      if (!access) {
        return jsonResponse({ error: 'Assinatura não encontrada' })
      }

      if (access.cancelled_at) {
        return jsonResponse({
          cancelled: true,
          access_until: access.access_expire_date,
          already_cancelled: true,
        })
      }

      // Só marca cancelado no Supabase depois de cancelar no Pagar.me. Se o gateway falhar e
      // gravássemos cancelled_at mesmo assim, o app mostraria "cancelado" mas a recorrência
      // continuaria cobrando.
      if (access.pagarme_subscription_id) {
        try {
          await pagarmeRequest(
            `/subscriptions/${access.pagarme_subscription_id}`,
            'DELETE',
            { cancel_pending_invoices: true },
          )
        } catch (pagarmeErr: unknown) {
          const status = pagarmeErr instanceof PagarmeError ? pagarmeErr.status : 0
          if (status === 404) {
            console.warn('Pagar.me: assinatura já removida', access.pagarme_subscription_id)
          } else {
            console.error('Pagar.me cancel failed:', pagarmeErr)
            return jsonResponse(
              {
                error:
                  'Não foi possível cancelar a cobrança recorrente no Pagar.me. Nada foi alterado aqui — tente de novo em instantes ou fale com o suporte.',
                details: pagarmeErr instanceof PagarmeError ? pagarmeErr.data : String(pagarmeErr),
              },
              502,
            )
          }
        }
      }

      await admin
        .from('package_access')
        .update({ cancelled_at: new Date().toISOString() })
        .eq('id', access.id)

      return jsonResponse({
        cancelled: true,
        access_until: access.access_expire_date,
      })
    }

    return jsonResponse({ error: `Invalid action: ${(body as any)?.action}` })
  } catch (err) {
    console.error('payment-subscription error:', err)
    if (err instanceof PagarmeError) {
      return jsonResponse({ error: 'Pagar.me error', details: err.data })
    }
    return jsonResponse({ error: err.message ?? 'Internal error' })
  }
})
