import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createSupabaseFromRequest, isAdminOrProfessor } from '../_shared/supabase.ts'
import { pagarmeRequest, PagarmeError } from '../_shared/pagarme.ts'

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const supabase = createSupabaseFromRequest(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return errorResponse('Unauthorized', 401)

    const { recipient_id } = await req.json()
    if (!recipient_id) return errorResponse('recipient_id is required')

    // Only admins/professors can view recipient details
    if (!await isAdminOrProfessor(supabase, user.id)) {
      return errorResponse('Acesso negado', 403)
    }

    const recipient = await pagarmeRequest(`/recipients/${recipient_id}`)

    return jsonResponse(recipient)
  } catch (err) {
    console.error('payment-recipient-details error:', err)
    if (err instanceof PagarmeError) {
      return jsonResponse({ error: 'Pagar.me error', details: err.data }, err.status)
    }
    return errorResponse(err.message ?? 'Internal error', 500)
  }
})
