import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createSupabaseAdmin, createSupabaseFromRequest, hasRole, isAdminOrProfessor } from '../_shared/supabase.ts'
import { pagarmeRequest, PagarmeError } from '../_shared/pagarme.ts'

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const supabase = createSupabaseFromRequest(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return errorResponse('Unauthorized', 401)

    // Admins and professors can initiate transfers
    if (!await isAdminOrProfessor(supabase, user.id)) {
      return errorResponse('Acesso negado', 403)
    }

    const { amount, recipient_id } = await req.json()
    if (!amount || !recipient_id) {
      return errorResponse('amount (in cents) and recipient_id are required')
    }

    // If professor, ensure they can only transfer to their own recipient
    const isAdmin = await hasRole(supabase, user.id, 'admin')
    if (!isAdmin) {
      const admin = createSupabaseAdmin()
      const { data: prof } = await admin
        .from('professor_profiles')
        .select('pagarme_receiver_id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (prof?.pagarme_receiver_id !== recipient_id) {
        return errorResponse('Você só pode transferir para sua própria conta', 403)
      }
    }

    // Create transfer via VPS proxy (IP fixo required by Pagar.me)
    const transfer = await pagarmeRequest<{ id: string; status: string; amount: number }>(
      '/transfers',
      'POST',
      { amount, recipient_id },
      { useTransferProxy: true },
    )

    // Record in transferencias table
    const admin = createSupabaseAdmin()
    const { error: insertError } = await admin.from('transferencias').insert({
      pagarme_transfer_id: transfer.id,
      recipient_id,
      amount: amount / 100,
      status: transfer.status,
      requested_by: user.id,
    })

    if (insertError) {
      console.error('Failed to record transfer:', insertError)
    }

    return jsonResponse({
      transfer_id: transfer.id,
      status: transfer.status,
      amount: transfer.amount,
    })
  } catch (err) {
    console.error('payment-transfer error:', err)
    if (err instanceof PagarmeError) {
      return jsonResponse({ error: 'Pagar.me error', details: err.data }, err.status)
    }
    return errorResponse(err.message ?? 'Internal error', 500)
  }
})
