import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

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
        .select('*, pacote_cursos(curso_id, cursos(id, nome, imagem, preco, taxa_superclasse, professor:professor_profiles(nome_professor)))')
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
        .select('id, access_expire_date, cancelled_at')
        .eq('user_id', user.id)
        .eq('pacote_id', pacoteId)
        .maybeSingle()

      if (!data) return false
      if (!data.access_expire_date) return true
      return new Date(data.access_expire_date) >= new Date()
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
      return data ?? []
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
      if (error) throw new Error(error.message ?? 'Failed to create subscription')
      if (data?.error) throw new Error(data.error)
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
