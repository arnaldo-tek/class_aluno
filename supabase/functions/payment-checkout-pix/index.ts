import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createSupabaseFromRequest, createSupabaseAdmin } from '../_shared/supabase.ts'
import { pagarmeRequest, buildSplitRules, PagarmeError } from '../_shared/pagarme.ts'
import { resolveReceiverIds, resolveProfessorId, applyCoupon, createMovimentacaoSplits } from '../_shared/checkout.ts'

interface PixCheckoutBody {
  customer_id: string
  amount: number // in cents
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

    const body: PixCheckoutBody = await req.json()
    if (!body.customer_id || !body.amount) {
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

    // Create PIX order in Pagar.me
    const order = await pagarmeRequest<{
      id: string
      status: string
      charges?: Array<{
        last_transaction?: {
          qr_code?: string
          qr_code_url?: string
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
          payment_method: 'pix',
          pix: {
            expires_in: 1800, // 30 minutes
          },
          split: splitRules,
        },
      ],
    })

    // Extract QR code from response
    const lastTx = order.charges?.[0]?.last_transaction
    const qrCode = lastTx?.qr_code ?? null
    const qrCodeUrl = lastTx?.qr_code_url ?? null

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
      status: 'pending',
    }).select('id').single()

    // Create splits for professor earnings tracking
    if (mov) {
      await createMovimentacaoSplits(admin, mov.id, finalAmount, body.curso_id, body.pacote_id)
    }

    return jsonResponse({
      order_id: order.id,
      status: order.status,
      qr_code: qrCode,
      qr_code_url: qrCodeUrl,
    })
  } catch (err) {
    console.error('payment-checkout-pix error:', err)
    if (err instanceof PagarmeError) {
      console.error('Pagar.me details:', JSON.stringify(err.data))
      return jsonResponse({ error: 'Erro no pagamento', details: err.data })
    }
    return jsonResponse({ error: err.message ?? 'Erro interno no servidor' })
  }
})
