import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { createSupabaseFromRequest } from '../_shared/supabase.ts'
import { pagarmeRequest, PagarmeError } from '../_shared/pagarme.ts'

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const supabase = createSupabaseFromRequest(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return jsonResponse({ error: 'Unauthorized' })

    const { recipient_id } = await req.json()
    if (!recipient_id) return jsonResponse({ error: 'recipient_id is required' })

    const balance = await pagarmeRequest<{
      available_amount: number
      waiting_funds_amount: number
      transferred_amount: number
    }>(`/recipients/${recipient_id}/balance`)

    return jsonResponse(balance)
  } catch (err) {
    console.error('payment-recipient-balance error:', err)
    if (err instanceof PagarmeError) {
      return jsonResponse({ error: 'Pagar.me error', details: err.data })
    }
    return jsonResponse({ error: err.message ?? 'Internal error' })
  }
})
