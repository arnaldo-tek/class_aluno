import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createSupabaseFromRequest, createSupabaseAdmin } from '../_shared/supabase.ts'
import { pagarmeRequest, PagarmeError } from '../_shared/pagarme.ts'
import { createMovimentacaoSplits } from '../_shared/checkout.ts'

/**
 * Manually verify a PIX order status against Pagar.me API.
 * Used as fallback when the webhook didn't fire or was delayed.
 */
Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const supabase = createSupabaseFromRequest(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return errorResponse('Não autorizado', 401)

    const { order_id } = await req.json()
    if (!order_id) return errorResponse('order_id é obrigatório')

    // Fetch movimentacao to confirm it belongs to this user
    const { data: mov } = await supabase
      .from('movimentacoes')
      .select('id, status, user_id, curso_id, pacote_id, valor')
      .eq('pagarme_order_id', order_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!mov) return errorResponse('Pedido não encontrado', 404)

    // Already processed
    if (mov.status === 'paid') {
      return jsonResponse({ status: 'paid', already_enrolled: true })
    }

    // Check order status directly in Pagar.me
    const order = await pagarmeRequest<{
      id: string
      status: string
      charges?: Array<{ status: string }>
    }>(`/orders/${order_id}`)

    const isPaid =
      order.status === 'paid' ||
      order.charges?.some((c) => c.status === 'paid')

    if (!isPaid) {
      return jsonResponse({ status: order.status, already_enrolled: false })
    }

    // Process the payment — same logic as webhook handleOrderPaid
    const admin = createSupabaseAdmin()

    const { data: updated } = await admin
      .from('movimentacoes')
      .update({ status: 'paid' })
      .eq('pagarme_order_id', order_id)
      .eq('status', 'pending') // avoid double-processing
      .select('id, user_id, curso_id, pacote_id, valor')
      .maybeSingle()

    if (!updated) {
      // Another concurrent request already processed it
      return jsonResponse({ status: 'paid', already_enrolled: true })
    }

    // Create splits if not already created
    const { count } = await admin
      .from('movimentacao_splits')
      .select('id', { count: 'exact', head: true })
      .eq('movimentacao_id', updated.id)
    if (!count || count === 0) {
      const valorCents = Math.round(Number(updated.valor) * 100)
      await createMovimentacaoSplits(
        admin,
        updated.id,
        valorCents,
        updated.curso_id ?? undefined,
        updated.pacote_id ?? undefined,
      )
    }

    // Create enrollment(s)
    if (updated.curso_id) {
      await admin.from('enrollments').upsert(
        { user_id: updated.user_id, curso_id: updated.curso_id },
        { onConflict: 'user_id,curso_id' },
      )
    }

    if (updated.pacote_id) {
      const { data: cursos } = await admin
        .from('pacote_cursos')
        .select('curso_id')
        .eq('pacote_id', updated.pacote_id)

      if (cursos) {
        for (const c of cursos) {
          await admin.from('enrollments').upsert(
            { user_id: updated.user_id, curso_id: c.curso_id },
            { onConflict: 'user_id,curso_id' },
          )
        }
      }

      await admin.from('package_access').upsert(
        { user_id: updated.user_id, pacote_id: updated.pacote_id },
        { onConflict: 'pacote_id,user_id' },
      )
    }

    await admin.from('notificacoes').insert({
      user_id: updated.user_id,
      titulo: 'Pagamento confirmado',
      descricao: 'Seu pagamento foi confirmado! Acesse seus cursos.',
    })

    return jsonResponse({ status: 'paid', already_enrolled: false })
  } catch (err) {
    console.error('payment-verify-pix error:', err)
    if (err instanceof PagarmeError) {
      return jsonResponse({ error: 'Erro ao verificar pagamento', details: err.data })
    }
    return errorResponse(err.message ?? 'Erro interno', 500)
  }
})
