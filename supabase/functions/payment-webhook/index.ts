import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createSupabaseAdmin } from '../_shared/supabase.ts'
import { createMovimentacaoSplits } from '../_shared/checkout.ts'

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const payload = await req.json()
    const event = payload.type as string | undefined
    const data = payload.data as Record<string, any> | undefined

    if (!event || !data) {
      return errorResponse('Invalid webhook payload')
    }

    console.log(`Webhook received: ${event}`, data.id)

    const supabase = createSupabaseAdmin()

    if (event === 'order.paid' || event === 'order.payment_confirmed') {
      await handleOrderPaid(supabase, data)
    } else if (event === 'charge.paid') {
      // PIX payments arrive as charge.paid
      console.log('charge.paid payload keys:', Object.keys(data))
      console.log('charge.paid data.order:', JSON.stringify(data.order))
      console.log('charge.paid data.order_id:', data.order_id)
      const orderId = (data.order as any)?.id ?? data.order_id
      if (orderId) {
        await handleOrderPaid(supabase, { id: orderId })
      } else {
        console.warn('charge.paid: no order reference found in payload', JSON.stringify(data))
      }
    } else if (event === 'order.payment_failed') {
      await handleOrderFailed(supabase, data)
    } else if (event === 'order.canceled') {
      await handleOrderCanceled(supabase, data)
    } else if (event === 'subscription.renewed' || event === 'subscription.payment_succeeded') {
      await handleSubscriptionRenewed(supabase, data)
    } else if (event === 'subscription.canceled' || event === 'subscription.deactivated') {
      await handleSubscriptionCanceled(supabase, data)
    } else if (event === 'subscription.payment_failed') {
      await handleSubscriptionPaymentFailed(supabase, data)
    }

    return jsonResponse({ received: true })
  } catch (err) {
    console.error('payment-webhook error:', err)
    return errorResponse(err.message ?? 'Internal error', 500)
  }
})

async function handleOrderPaid(supabase: any, data: Record<string, any>) {
  const orderId = data.id as string

  const { data: mov } = await supabase
    .from('movimentacoes')
    .update({ status: 'paid' })
    .eq('pagarme_order_id', orderId)
    .select('id, user_id, curso_id, pacote_id, valor')
    .maybeSingle()

  if (!mov) {
    // Log all recent pending movimentacoes to help diagnose ID mismatch
    const { data: recent } = await supabase
      .from('movimentacoes')
      .select('pagarme_order_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    console.warn(`No movimentacao found for order ${orderId}. Recent records:`, JSON.stringify(recent))
    return
  }

  const { count } = await supabase
    .from('movimentacao_splits')
    .select('id', { count: 'exact', head: true })
    .eq('movimentacao_id', mov.id)
  if (!count || count === 0) {
    const valorCents = Math.round(Number(mov.valor) * 100)
    await createMovimentacaoSplits(supabase, mov.id, valorCents, mov.curso_id ?? undefined, mov.pacote_id ?? undefined)
  }

  if (mov.curso_id) {
    await supabase.from('enrollments').upsert(
      { user_id: mov.user_id, curso_id: mov.curso_id },
      { onConflict: 'user_id,curso_id' },
    )
  }

  if (mov.pacote_id) {
    const { data: cursos } = await supabase
      .from('pacote_cursos')
      .select('curso_id')
      .eq('pacote_id', mov.pacote_id)

    if (cursos) {
      for (const c of cursos) {
        await supabase.from('enrollments').upsert(
          { user_id: mov.user_id, curso_id: c.curso_id },
          { onConflict: 'user_id,curso_id' },
        )
      }
    }

    await supabase.from('package_access').upsert(
      { user_id: mov.user_id, pacote_id: mov.pacote_id },
      { onConflict: 'pacote_id,user_id' },
    )
  }

  await supabase.from('notificacoes').insert({
    user_id: mov.user_id,
    titulo: 'Pagamento confirmado',
    descricao: 'Seu pagamento foi confirmado! Acesse seus cursos.',
  })
}

async function handleOrderFailed(supabase: any, data: Record<string, any>) {
  const orderId = data.id as string

  const { data: mov } = await supabase
    .from('movimentacoes')
    .update({ status: 'failed' })
    .eq('pagarme_order_id', orderId)
    .select('user_id')
    .maybeSingle()

  if (mov) {
    await supabase.from('notificacoes').insert({
      user_id: mov.user_id,
      titulo: 'Pagamento recusado',
      descricao: 'Seu pagamento foi recusado. Tente novamente.',
    })
  }
}

async function handleOrderCanceled(supabase: any, data: Record<string, any>) {
  const orderId = data.id as string

  await supabase
    .from('movimentacoes')
    .update({ status: 'cancelled' })
    .eq('pagarme_order_id', orderId)
}

async function handleSubscriptionRenewed(supabase: any, data: Record<string, any>) {
  const subscriptionId = data.id as string
  const nextBilling = data.next_billing_at ?? data.current_period?.end_at

  if (!subscriptionId) return

  const updates: Record<string, any> = {}
  if (nextBilling) {
    updates.access_expire_date = nextBilling
    updates.next_billing_date = nextBilling
  }

  if (Object.keys(updates).length === 0) return

  // Only renew subscriptions that are still active (not manually cancelled by the user).
  // A race condition can cause Pagar.me to fire a renewal event after the user cancelled —
  // in that case we must not clear cancelled_at or reactivate the subscription.
  const { data: access } = await supabase
    .from('package_access')
    .update(updates)
    .eq('pagarme_subscription_id', subscriptionId)
    .is('cancelled_at', null)
    .select('user_id')
    .maybeSingle()

  if (access) {
    await supabase.from('notificacoes').insert({
      user_id: access.user_id,
      titulo: 'Assinatura renovada',
      descricao: 'Sua assinatura foi renovada com sucesso!',
    })
  }
}

async function handleSubscriptionCanceled(supabase: any, data: Record<string, any>) {
  const subscriptionId = data.id as string
  if (!subscriptionId) return

  await supabase
    .from('package_access')
    .update({ cancelled_at: new Date().toISOString() })
    .eq('pagarme_subscription_id', subscriptionId)
    .is('cancelled_at', null)
}

async function handleSubscriptionPaymentFailed(supabase: any, data: Record<string, any>) {
  const subscriptionId = data.id as string
  if (!subscriptionId) return

  const { data: access } = await supabase
    .from('package_access')
    .select('user_id')
    .eq('pagarme_subscription_id', subscriptionId)
    .maybeSingle()

  if (access) {
    await supabase.from('notificacoes').insert({
      user_id: access.user_id,
      titulo: 'Falha na renovação',
      descricao: 'Não conseguimos renovar sua assinatura. Verifique seu cartão.',
    })
  }
}
