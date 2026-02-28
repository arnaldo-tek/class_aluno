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
        .select('*, pacote_cursos(curso_id, cursos(id, nome, imagem, preco, professor:professor_profiles(nome_professor)))')
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
        .select('id, access_expire_date')
        .eq('user_id', user.id)
        .eq('pacote_id', pacoteId)
        .gte('access_expire_date', new Date().toISOString())
        .maybeSingle()

      return !!data
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
        .select('id, access_expire_date, pacote_id, pacotes(id, nome, imagem, preco)')
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
      return data
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
