import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createSupabaseFromRequest } from '../_shared/supabase.ts'
import { pagarmeRequest } from '../_shared/pagarme.ts'

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const supabase = createSupabaseFromRequest(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return jsonResponse({ error: 'Não autorizado. Faça login novamente.' })

    const { name, email, document, document_type, phones, customer_id_update } = await req.json()
    const existingId = customer_id_update ?? req.headers.get('x-customer-update')

    let customer: { id: string }

    if (existingId) {
      // Fetch current customer to get name (required by Pagar.me on PUT)
      const existing = await pagarmeRequest<{ id: string; name: string; email: string }>(
        `/customers/${existingId}`,
        'GET',
      )

      const updatePayload: Record<string, unknown> = {
        name: name || existing.name,
        email: email || existing.email,
      }
      if (document) {
        updatePayload.document = document
        updatePayload.document_type = document_type ?? 'CPF'
        updatePayload.type = 'individual'
      }
      if (phones) updatePayload.phones = phones
      customer = await pagarmeRequest<{ id: string }>(`/customers/${existingId}`, 'PUT', updatePayload)
    } else {
      // Create new customer
      if (!name || !email) return jsonResponse({ error: 'Nome e email são obrigatórios.' })
      const createPayload: Record<string, unknown> = {
        name,
        email,
        code: user.id,
      }
      if (document) {
        createPayload.document = document
        createPayload.document_type = document_type ?? 'CPF'
        createPayload.type = 'individual'
      }
      if (phones) createPayload.phones = phones
      customer = await pagarmeRequest<{ id: string }>('/customers', 'POST', createPayload)
    }

    // Save customer ID on profile
    await supabase
      .from('profiles')
      .update({ pagarme_customer_id: customer.id })
      .eq('id', user.id)

    return jsonResponse({ customer_id: customer.id })
  } catch (err) {
    console.error('payment-create-customer error:', err)
    return jsonResponse({ error: err.message ?? 'Erro ao criar cliente' })
  }
})
