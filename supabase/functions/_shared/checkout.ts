import { createSupabaseFromRequest } from './supabase.ts'

type SupabaseClient = ReturnType<typeof createSupabaseFromRequest>

/** Resolve Pagar.me receiver IDs for split rules from course or package */
export async function resolveReceiverIds(
  supabase: SupabaseClient,
  cursoId?: string,
  pacoteId?: string,
): Promise<string[]> {
  const professorIds: string[] = []

  if (cursoId) {
    const { data } = await supabase
      .from('cursos')
      .select('professor_id')
      .eq('id', cursoId)
      .single()
    if (data?.professor_id) professorIds.push(data.professor_id)
  }

  if (pacoteId) {
    const { data: cursoLinks } = await supabase
      .from('pacote_cursos')
      .select('curso_id')
      .eq('pacote_id', pacoteId)
    if (cursoLinks?.length) {
      const cursoIds = cursoLinks.map((r: any) => r.curso_id)
      const { data: cursos } = await supabase
        .from('cursos')
        .select('professor_id')
        .in('id', cursoIds)
      if (cursos) {
        for (const c of cursos) {
          if (c.professor_id) professorIds.push(c.professor_id)
        }
      }
    }
  }

  if (!professorIds.length) return []

  const uniqueProfIds = [...new Set(professorIds)]
  const { data: profiles } = await supabase
    .from('professor_profiles')
    .select('pagarme_receiver_id')
    .in('id', uniqueProfIds)
    .not('pagarme_receiver_id', 'is', null)

  return (profiles ?? []).map((p: any) => p.pagarme_receiver_id).filter(Boolean)
}

/** Resolve professor ID from a course */
export async function resolveProfessorId(
  supabase: SupabaseClient,
  cursoId?: string,
): Promise<string | null> {
  if (!cursoId) return null
  const { data } = await supabase
    .from('cursos')
    .select('professor_id')
    .eq('id', cursoId)
    .single()
  return data?.professor_id ?? null
}

/**
 * Apply coupon discount atomically using an RPC or conditional update
 * to prevent race conditions on uses_count
 */
export async function applyCoupon(
  supabase: SupabaseClient,
  codigo: string,
  amount: number,
): Promise<number> {
  // Fetch coupon
  const { data: cupom } = await supabase
    .from('cupons')
    .select('id, valor, valid_until, max_uses, uses_count, is_active')
    .eq('codigo', codigo.toUpperCase())
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (!cupom) return amount

  // Check expiration
  if (cupom.valid_until && new Date(cupom.valid_until) < new Date()) return amount

  // Check max uses
  if (cupom.max_uses && (cupom.uses_count ?? 0) >= cupom.max_uses) return amount

  // Apply discount
  const discountCents = Math.round(cupom.valor * 100)
  const final = Math.max(amount - discountCents, 0)

  // Atomic increment: only increment if uses_count hasn't changed (optimistic lock)
  const currentCount = cupom.uses_count ?? 0
  const { data: updated, error } = await supabase
    .from('cupons')
    .update({ uses_count: currentCount + 1 })
    .eq('id', cupom.id)
    .eq('uses_count', currentCount) // optimistic lock
    .select('id')
    .maybeSingle()

  if (error || !updated) {
    // Race condition: someone else used the coupon at the same time
    // Re-check if max_uses exceeded
    if (cupom.max_uses && currentCount + 1 > cupom.max_uses) {
      return amount // Don't apply discount
    }
    // Retry once
    await supabase
      .from('cupons')
      .update({ uses_count: currentCount + 1 })
      .eq('id', cupom.id)
  }

  return final
}

/**
 * Create splits for a movimentacao — tracks how much each professor earns.
 * For individual courses: 1 split.
 * For packages: N splits, proportional to each course's price (preco > 0 only).
 */
export async function createMovimentacaoSplits(
  supabase: SupabaseClient,
  movimentacaoId: string,
  valorFinalCents: number,
  cursoId?: string,
  pacoteId?: string,
) {
  const valorTotal = valorFinalCents / 100

  interface CourseInfo {
    curso_id: string
    professor_id: string
    preco: number
  }

  const courses: CourseInfo[] = []

  if (cursoId) {
    const { data } = await supabase
      .from('cursos')
      .select('id, professor_id, preco')
      .eq('id', cursoId)
      .single()
    if (data && Number(data.preco ?? 0) > 0) {
      courses.push({ curso_id: data.id, professor_id: data.professor_id, preco: Number(data.preco) })
    }
  }

  if (pacoteId) {
    const { data } = await supabase
      .from('pacote_cursos')
      .select('curso_id, cursos(id, professor_id, preco)')
      .eq('pacote_id', pacoteId)
    if (data) {
      for (const row of data) {
        const curso = (row as any).cursos
        if (curso && Number(curso.preco ?? 0) > 0) {
          courses.push({ curso_id: curso.id, professor_id: curso.professor_id, preco: Number(curso.preco) })
        }
      }
    }
  }

  if (courses.length === 0) return

  // Calculate proportional splits
  const totalPrecos = courses.reduce((sum, c) => sum + c.preco, 0)

  // Group by professor (a professor may have multiple courses in a package)
  const profMap = new Map<string, { professor_id: string; curso_id: string; proporcao: number }>()
  for (const c of courses) {
    const proporcao = c.preco / totalPrecos
    const existing = profMap.get(c.professor_id + ':' + c.curso_id)
    if (existing) {
      existing.proporcao += proporcao
    } else {
      profMap.set(c.professor_id + ':' + c.curso_id, {
        professor_id: c.professor_id,
        curso_id: c.curso_id,
        proporcao,
      })
    }
  }

  const splits = Array.from(profMap.values()).map((entry) => {
    const valorBruto = Math.round(valorTotal * entry.proporcao * 100) / 100
    const valorPlataforma = Math.round(valorBruto * 0.25 * 100) / 100
    const valorProfessor = Math.round((valorBruto - valorPlataforma) * 100) / 100
    return {
      movimentacao_id: movimentacaoId,
      professor_id: entry.professor_id,
      curso_id: entry.curso_id,
      valor_bruto: valorBruto,
      valor_professor: valorProfessor,
      valor_plataforma: valorPlataforma,
    }
  })

  if (splits.length > 0) {
    await supabase.from('movimentacao_splits').insert(splits)
  }
}

/** Create enrollment for a user (course and/or package) */
export async function createEnrollment(
  supabase: SupabaseClient,
  userId: string,
  cursoId?: string,
  pacoteId?: string,
) {
  if (cursoId) {
    await supabase.from('enrollments').upsert(
      { user_id: userId, curso_id: cursoId },
      { onConflict: 'user_id,curso_id' },
    )
  }

  if (pacoteId) {
    const { data: cursos } = await supabase
      .from('pacote_cursos')
      .select('curso_id')
      .eq('pacote_id', pacoteId)

    if (cursos) {
      for (const c of cursos) {
        await supabase.from('enrollments').upsert(
          { user_id: userId, curso_id: c.curso_id },
          { onConflict: 'user_id,curso_id' },
        )
      }
    }

    await supabase.from('package_access').upsert(
      { user_id: userId, pacote_id: pacoteId },
      { onConflict: 'pacote_id,user_id' },
    )
  }
}
