import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createSupabaseAdmin, createSupabaseFromRequest, canAccessProfessorData } from '../_shared/supabase.ts'
import { pagarmeRequest, PagarmeError } from '../_shared/pagarme.ts'

interface RegisterRecipientBody {
  professor_id: string
  type: 'individual' | 'company'
  name: string
  email: string
  document: string
  phone: { country_code: string; area_code: string; number: string }
  birthdate?: string
  monthly_income?: number
  address: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zip_code: string
    country: string
  }
  bank_account: {
    bank: string
    branch_number: string
    branch_check_digit?: string
    account_number: string
    account_check_digit: string
    type: 'checking' | 'savings'
    holder_name: string
    holder_document: string
    holder_type: 'individual' | 'company'
  }
}

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const supabase = createSupabaseFromRequest(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return errorResponse('Unauthorized', 401)

    const body: RegisterRecipientBody = await req.json()
    if (!body.professor_id || !body.type || !body.document || !body.bank_account) {
      return errorResponse('professor_id, type, document, and bank_account are required')
    }

    // Verify caller is admin or the professor themselves
    if (!await canAccessProfessorData(supabase, user.id, body.professor_id)) {
      return errorResponse('Acesso negado', 403)
    }

    // Build Pagar.me recipient payload
    const recipientPayload: Record<string, unknown> = {
      name: body.name,
      email: body.email,
      document: body.document.replace(/\D/g, ''),
      type: body.type,
      default_bank_account: {
        bank: body.bank_account.bank,
        branch_number: body.bank_account.branch_number,
        branch_check_digit: body.bank_account.branch_check_digit || '',
        account_number: body.bank_account.account_number,
        account_check_digit: body.bank_account.account_check_digit,
        type: body.bank_account.type,
        holder_name: body.bank_account.holder_name,
        holder_document: body.bank_account.holder_document.replace(/\D/g, ''),
        holder_type: body.bank_account.holder_type,
      },
      phone: {
        country_code: body.phone.country_code || '55',
        area_code: body.phone.area_code,
        number: body.phone.number,
      },
      address: {
        street: body.address.street,
        number: body.address.number,
        complement: body.address.complement || '',
        neighborhood: body.address.neighborhood,
        city: body.address.city,
        state: body.address.state,
        zip_code: body.address.zip_code.replace(/\D/g, ''),
        country: body.address.country || 'BR',
      },
    }

    if (body.birthdate) {
      recipientPayload.birthdate = body.birthdate
    }
    if (body.monthly_income) {
      recipientPayload.monthly_income = body.monthly_income
    }

    const recipient = await pagarmeRequest<{ id: string; status: string }>(
      '/recipients',
      'POST',
      recipientPayload,
    )

    // Save receiver ID to professor profile
    const admin = createSupabaseAdmin()
    const { error: updateError } = await admin
      .from('professor_profiles')
      .update({ pagarme_receiver_id: recipient.id })
      .eq('id', body.professor_id)

    if (updateError) throw updateError

    return jsonResponse({ recipient_id: recipient.id, status: recipient.status })
  } catch (err) {
    console.error('payment-register-recipient error:', err)
    if (err instanceof PagarmeError) {
      return jsonResponse({ error: 'Pagar.me error', details: err.data }, err.status)
    }
    return errorResponse(err.message ?? 'Internal error', 500)
  }
})
