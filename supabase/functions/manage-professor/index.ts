import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createSupabaseAdmin, createSupabaseFromRequest } from '../_shared/supabase.ts'
import { pagarmeRequest } from '../_shared/pagarme.ts'

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    // Verify caller is admin
    const supabaseUser = createSupabaseFromRequest(req)
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) return errorResponse('Unauthorized', 401)

    const { data: callerRole } = await supabaseUser
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!callerRole) return errorResponse('Apenas admins podem gerenciar professores', 403)

    const body = await req.json()
    const { action } = body

    const admin = createSupabaseAdmin()

    if (action === 'create') {
      const {
        email, password, nome_professor, telefone, cpf_cnpj, disciplina,
        rua, numero_casa_ap, bairro, cidade, estado, cep,
        banco, agencia, digito_agencia, conta, digito_conta,
        data_nascimento, ddd, account_type,
      } = body

      if (!email || !password) return errorResponse('Email e senha são obrigatórios')
      if (!nome_professor) return errorResponse('Nome do professor é obrigatório')

      const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (createErr) {
        if (createErr.message?.includes('already been registered')) {
          return errorResponse('Já existe um usuário com este e-mail')
        }
        throw createErr
      }

      const userId = newUser.user.id

      const { error: roleErr } = await admin
        .from('user_roles')
        .insert({ user_id: userId, role: 'professor' })
      if (roleErr) throw roleErr

      const profileData: Record<string, unknown> = {
        user_id: userId,
        nome_professor,
        email,
        telefone: telefone || null,
        cpf_cnpj: cpf_cnpj || null,
        disciplina: disciplina || null,
        rua: rua || null,
        numero_casa_ap: numero_casa_ap || null,
        bairro: bairro || null,
        cidade: cidade || null,
        estado: estado || null,
        banco: banco || null,
        agencia: agencia || null,
        digito_agencia: digito_agencia || null,
        conta: conta || null,
        digito_conta: digito_conta || null,
        data_nascimento: data_nascimento || null,
        approval_status: 'em_analise',
      }

      const { data: profData, error: profErr } = await admin
        .from('professor_profiles')
        .insert(profileData)
        .select('id')
        .single()
      if (profErr) throw profErr

      // Register as Pagar.me recipient if bank data is provided
      let pagarme_receiver_id: string | null = null
      if (banco && agencia && conta && digito_conta && cpf_cnpj && rua && cidade && estado) {
        try {
          const cleanDoc = cpf_cnpj.replace(/\D/g, '')
          const isCompany = cleanDoc.length > 11
          const phoneDdd = ddd || (telefone ? telefone.replace(/\D/g, '').slice(0, 2) : '')
          const phoneNumber = telefone ? telefone.replace(/\D/g, '').slice(2) : ''

          const recipient = await pagarmeRequest<{ id: string }>('/recipients', 'POST', {
            name: nome_professor,
            email,
            document: cleanDoc,
            type: isCompany ? 'company' : 'individual',
            default_bank_account: {
              bank: banco,
              branch_number: agencia,
              branch_check_digit: digito_agencia || '',
              account_number: conta,
              account_check_digit: digito_conta,
              type: account_type || 'checking',
              holder_name: nome_professor,
              holder_document: cleanDoc,
              holder_type: isCompany ? 'company' : 'individual',
            },
            ...(phoneDdd && phoneNumber ? {
              phone: { country_code: '55', area_code: phoneDdd, number: phoneNumber },
            } : {}),
            address: {
              street: rua,
              number: numero_casa_ap || 'S/N',
              complement: '',
              neighborhood: bairro || '',
              city: cidade,
              state: estado,
              zip_code: (cep || '').replace(/\D/g, ''),
              country: 'BR',
            },
            ...(data_nascimento ? { birthdate: data_nascimento } : {}),
          })

          pagarme_receiver_id = recipient.id

          await admin
            .from('professor_profiles')
            .update({ pagarme_receiver_id: recipient.id })
            .eq('id', profData.id)
        } catch (pagarmeErr) {
          // Log but don't fail the professor creation
          console.error('Pagar.me recipient registration failed:', pagarmeErr)
        }
      }

      return jsonResponse({ user_id: userId, pagarme_receiver_id })
    }

    if (action === 'block') {
      const { professor_id } = body
      if (!professor_id) return errorResponse('professor_id é obrigatório')

      const { data: prof, error: fetchErr } = await admin
        .from('professor_profiles')
        .select('user_id')
        .eq('id', professor_id)
        .single()
      if (fetchErr || !prof) return errorResponse('Professor não encontrado')

      // Check if user has other roles besides professor
      const { data: otherRoles } = await admin
        .from('user_roles')
        .select('role')
        .eq('user_id', prof.user_id)
        .neq('role', 'professor')

      // Only ban auth user if they have no other roles
      if (!otherRoles || otherRoles.length === 0) {
        const { error: banErr } = await admin.auth.admin.updateUserById(prof.user_id, {
          ban_duration: '87600h',
        })
        if (banErr) throw banErr
      }

      // Mark as blocked
      const { error: updateErr } = await admin
        .from('professor_profiles')
        .update({ is_blocked: true })
        .eq('id', professor_id)
      if (updateErr) throw updateErr

      return jsonResponse({ success: true })
    }

    if (action === 'unblock') {
      const { professor_id } = body
      if (!professor_id) return errorResponse('professor_id é obrigatório')

      const { data: prof, error: fetchErr } = await admin
        .from('professor_profiles')
        .select('user_id')
        .eq('id', professor_id)
        .single()
      if (fetchErr || !prof) return errorResponse('Professor não encontrado')

      // Unban auth user
      const { error: banErr } = await admin.auth.admin.updateUserById(prof.user_id, {
        ban_duration: 'none',
      })
      if (banErr) throw banErr

      // Unmark blocked
      const { error: updateErr } = await admin
        .from('professor_profiles')
        .update({ is_blocked: false })
        .eq('id', professor_id)
      if (updateErr) throw updateErr

      return jsonResponse({ success: true })
    }

    if (action === 'delete') {
      const { professor_id } = body
      if (!professor_id) return errorResponse('professor_id é obrigatório')

      const { data: prof, error: fetchErr } = await admin
        .from('professor_profiles')
        .select('user_id')
        .eq('id', professor_id)
        .single()
      if (fetchErr || !prof) return errorResponse('Professor não encontrado')

      // Remove professor role
      await admin
        .from('user_roles')
        .delete()
        .eq('user_id', prof.user_id)
        .eq('role', 'professor')

      // Check if user has other roles
      const { data: otherRoles } = await admin
        .from('user_roles')
        .select('role')
        .eq('user_id', prof.user_id)

      // Only ban auth user if they have no other roles
      if (!otherRoles || otherRoles.length === 0) {
        const { error: banErr } = await admin.auth.admin.updateUserById(prof.user_id, {
          ban_duration: '87600h',
        })
        if (banErr) throw banErr
      }

      // Soft delete profile
      const { error: updateErr } = await admin
        .from('professor_profiles')
        .update({ deleted_at: new Date().toISOString(), is_blocked: true })
        .eq('id', professor_id)
      if (updateErr) throw updateErr

      return jsonResponse({ success: true })
    }

    return errorResponse('Ação inválida. Use: create, block, unblock, delete')
  } catch (err) {
    console.error('manage-professor error:', err)
    return errorResponse(err.message ?? 'Erro interno', 500)
  }
})
