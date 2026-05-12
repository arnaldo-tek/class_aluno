import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { endOfDay, isBefore, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

/** Fim do período de acesso (data só YYYY-MM-DD = fim do dia local; ISO completo = instante). */
function packageAccessPeriodEnd(raw: string): Date {
  const s = String(raw).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return endOfDay(parseISO(s))
  }
  const t = new Date(s)
  return Number.isNaN(t.getTime()) ? new Date(0) : t
}

/**
 * Assinatura / período pago encerrado: some da lista ou sem acesso ao pacote.
 * Usa access_expire_date e, se vier null no banco, next_billing_date (webhook costuma espelhar os dois).
 */
export function isPackageAccessPeriodOver(row: {
  access_expire_date?: string | null
  next_billing_date?: string | null
}): boolean {
  const raw = row.access_expire_date ?? row.next_billing_date
  if (!raw) return false
  return isBefore(packageAccessPeriodEnd(raw), new Date())
}

/** Cursos ativos no catálogo (publicado, não encerrado, prazo de catálogo válido). */
export function filterPacoteCursosForCatalog(pacoteCursos: unknown[] | undefined | null): any[] {
  const today = new Date().toISOString().slice(0, 10)
  const rows = (pacoteCursos as any[]) ?? []
  return rows.filter((pc) => {
    const c = pc?.cursos
    if (!c) return false
    if (c.is_publicado === false) return false
    if (c.is_encerrado === true) return false
    const de = c.data_encerramento
    if (de && String(de).slice(0, 10) < today) return false
    return true
  })
}

interface PackageFilters {
  search?: string
  categoriaId?: string | null
}

export function usePackages(filters?: PackageFilters) {
  return useQuery({
    queryKey: ['packages', filters],
    queryFn: async () => {
      let query = supabase
        .from('pacotes')
        .select('*, pacote_cursos(curso_id, cursos(nome)), pacote_categorias(categorias(id, nome))')
        .order('created_at', { ascending: false })

      if (filters?.search) {
        query = query.ilike('nome', `%${filters.search}%`)
      }

      const { data, error } = await query
      if (error) throw error

      let result = data ?? []
      if (filters?.categoriaId) {
        result = result.filter((p: any) =>
          p.pacote_categorias?.some((pc: any) => pc.categorias?.id === filters.categoriaId)
        )
      }

      return result
    },
  })
}

export function usePackageDetail(id: string) {
  return useQuery({
    queryKey: ['package-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pacotes')
        .select('*, pacote_cursos(curso_id, cursos(id, nome, imagem, preco, taxa_superclasse, is_publicado, is_encerrado, data_encerramento, professor:professor_profiles(nome_professor)))')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useHasPackageAccess(pacoteId: string) {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['package-access', user?.id, pacoteId],
    queryFn: async () => {
      if (!user) return false
      const { data } = await supabase
        .from('package_access')
        .select('id, access_expire_date, next_billing_date, cancelled_at')
        .eq('user_id', user.id)
        .eq('pacote_id', pacoteId)
        .maybeSingle()

      if (!data) return false
      if (isPackageAccessPeriodOver(data)) return false
      return true
    },
    enabled: !!user && !!pacoteId,
  })
}

export function useMyPackages() {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['my-packages', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('package_access')
        .select('id, access_expire_date, next_billing_date, cancelled_at, pagarme_subscription_id, pacote_id, pacotes(id, nome, imagem, preco)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []).filter((row) => !isPackageAccessPeriodOver(row))
    },
    enabled: !!user,
  })
}

export function useCancelSubscription() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (pacoteId: string) => {
      const { data, error } = await supabase.functions.invoke('payment-subscription', {
        body: { action: 'cancel', pacote_id: pacoteId },
      })
      if (error) throw new Error(error.message ?? 'Failed to cancel subscription')
      if (data?.error) throw new Error(data.error)
      return data as { cancelled: boolean; access_until: string | null }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-packages'] })
      qc.invalidateQueries({ queryKey: ['package-access'] })
    },
  })
}

export function useCreateSubscription() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      customer_id: string
      pacote_id: string
      card: {
        number: string
        holder_name: string
        exp_month: number
        exp_year: number
        cvv: string
      }
      amount: number
      interval?: 'month' | 'year'
    }) => {
      const { data, error } = await supabase.functions.invoke('payment-subscription', {
        body: { action: 'create', ...params, interval: params.interval ?? 'month' },
      })
      if (error) {
        // Try to extract structured error from response body
        try {
          const body = await (error as any).context?.json?.()
          if (body && typeof body === 'object' && 'error' in body) {
            const details = body.details ? JSON.stringify(body.details) : body.error
            throw new Error(details)
          }
        } catch (extracted) {
          if (extracted instanceof Error) throw extracted
        }
        throw new Error(error.message ?? 'Failed to create subscription')
      }
      if (data?.error) throw new Error(data.details ? JSON.stringify(data.details) : data.error)
      return data as { subscription_id: string; status: string; next_billing_at: string }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-packages'] })
      qc.invalidateQueries({ queryKey: ['package-access'] })
    },
  })
}

export function usePackageCategories() {
  return useQuery({
    queryKey: ['package-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nome')
        .eq('tipo', 'pacote')
        .order('nome')

      if (error) throw error
      return data ?? []
    },
  })
}
