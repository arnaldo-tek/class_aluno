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

    // Only admins and professors can list orders
    if (!await isAdminOrProfessor(supabase, user.id)) {
      return errorResponse('Acesso negado', 403)
    }

    const body = await req.json()
    const { page = 1, size = 20, status, created_since, created_until, customer_id } = body

    // Build query params
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('size', String(size))
    if (status) params.set('status', status)
    if (created_since) params.set('created_since', created_since)
    if (created_until) params.set('created_until', created_until)
    if (customer_id) params.set('customer_id', customer_id)

    const result = await pagarmeRequest<{
      data: Array<{
        id: string
        code: string
        amount: number
        status: string
        created_at: string
        updated_at: string
        customer: {
          id: string
          name: string
          email: string
        } | null
        charges: Array<{
          id: string
          amount: number
          status: string
          payment_method: string
          paid_at: string | null
          gateway_response: {
            code: string
          } | null
        }>
        items: Array<{
          amount: number
          description: string
          quantity: number
          code: string
        }>
      }>
      paging: {
        total: number
        previous: string | null
        next: string | null
      }
    }>(`/orders?${params.toString()}`)

    return jsonResponse(result)
  } catch (err) {
    console.error('payment-orders error:', err)
    if (err instanceof PagarmeError) {
      return jsonResponse({ error: 'Pagar.me error', details: err.data }, err.status)
    }
    return errorResponse(err.message ?? 'Internal error', 500)
  }
})
