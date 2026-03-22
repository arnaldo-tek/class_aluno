import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createSupabaseFromRequest, createSupabaseAdmin } from '../_shared/supabase.ts'
import { pagarmeRequest, buildSplitRules, PagarmeError } from '../_shared/pagarme.ts'
import { resolveReceiverIds, resolveProfessorId, applyCoupon, createEnrollment, createMovimentacaoSplits } from '../_shared/checkout.ts'

interface BillingAddress {
  line_1: string
  line_2?: string
  zip_code: string
  city: string
  state: string
  country: string
}

interface CardCheckoutBody {
  customer_id: string
  amount: number // in cents
  card: {
    number: string
    holder_name: string
    exp_month: number
    exp_year: number
    cvv: string
    billing_address?: BillingAddress
  }
  installments: number
  curso_id?: string
  pacote_id?: string
  cupom_codigo?: string
}

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const supabase = createSupabaseFromRequest(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return jsonResponse({ error: 'Não autorizado. Faça login novamente.' })

    const body: CardCheckoutBody = await req.json()
    if (!body.customer_id || !body.amount || !body.card) {
      return jsonResponse({ error: 'Dados de pagamento incompletos.' })
    }

    // Admin client for DB writes (user JWT is blocked by RLS)
    const admin = createSupabaseAdmin()

    // Resolve teacher receiver IDs for split
    const receiverIds = await resolveReceiverIds(admin, body.curso_id, body.pacote_id)

    // Apply coupon discount if provided
    let finalAmount = body.amount
    if (body.cupom_codigo) {
      finalAmount = await applyCoupon(admin, body.cupom_codigo, body.amount)
    }

    const splitRules = buildSplitRules(receiverIds, finalAmount)

    // Create order in Pagar.me
    const order = await pagarmeRequest<{
      id: string
      status: string
      charges?: Array<{
        last_transaction?: {
          acquirer_message?: string
          acquirer_return_code?: string
          gateway_response?: { code?: string; errors?: unknown[] }
        }
      }>
    }>('/orders', 'POST', {
      customer_id: body.customer_id,
      items: [
        {
          amount: finalAmount,
          description: 'SuperClasse',
          quantity: 1,
          code: body.curso_id ?? body.pacote_id ?? 'order',
        },
      ],
      payments: [
        {
          payment_method: 'credit_card',
          credit_card: {
            card: {
              number: body.card.number,
              holder_name: body.card.holder_name,
              exp_month: body.card.exp_month,
              exp_year: body.card.exp_year,
              cvv: body.card.cvv,
              billing_address: body.card.billing_address ?? {
                line_1: '1, Rua Teste, Centro',
                zip_code: '01001000',
                city: 'São Paulo',
                state: 'SP',
                country: 'BR',
              },
            },
            installments: body.installments || 1,
            statement_descriptor: 'SuperClasse',
          },
          split: splitRules,
        },
      ],
    })

    // Create movimentacao record
    const professorId = await resolveProfessorId(admin, body.curso_id)
    const { data: mov } = await admin.from('movimentacoes').insert({
      pagarme_order_id: order.id,
      valor: finalAmount / 100,
      valor_curso: body.amount / 100,
      taxa_plataforma: (finalAmount / 100) * 0.25,
      user_id: user.id,
      curso_id: body.curso_id ?? null,
      pacote_id: body.pacote_id ?? null,
      professor_id: professorId,
      status: order.status === 'paid' ? 'paid' : 'pending',
    }).select('id').single()

    // Create splits for professor earnings tracking
    if (mov) {
      await createMovimentacaoSplits(admin, mov.id, finalAmount, body.curso_id, body.pacote_id)
    }

    // If paid immediately, create enrollment
    if (order.status === 'paid') {
      await createEnrollment(admin, user.id, body.curso_id, body.pacote_id)
    }

    // If payment failed, include the reason
    if (order.status === 'failed') {
      const lastTx = order.charges?.[0]?.last_transaction
      const reason = lastTx?.acquirer_message ?? 'Pagamento recusado'
      console.error('Payment failed:', reason, 'code:', lastTx?.acquirer_return_code)
      return jsonResponse({
        order_id: order.id,
        status: order.status,
        error: reason,
        acquirer_code: lastTx?.acquirer_return_code,
      })
    }

    return jsonResponse({ order_id: order.id, status: order.status })
  } catch (err) {
    console.error('payment-checkout-card error:', err)
    if (err instanceof PagarmeError) {
      console.error('Pagar.me details:', JSON.stringify(err.data))
      // Return 200 with error body so supabase.functions.invoke passes it to client
      return jsonResponse({ error: 'Erro no pagamento', details: err.data })
    }
    return jsonResponse({ error: err.message ?? 'Erro interno no servidor' })
  }
})
