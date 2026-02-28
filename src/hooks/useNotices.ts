import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

interface NoticeFilters {
  search?: string
  categoriaId?: string | null
  estado?: string | null
  cidade?: string | null
  orgao?: string | null
  disciplina?: string | null
}

export function useNotices(filters?: NoticeFilters) {
  return useQuery({
    queryKey: ['notices', filters],
    queryFn: async () => {
      let query = supabase
        .from('editais')
        .select('*, categorias(nome), professor_profiles(nome_professor)')
        .order('created_at', { ascending: false })

      if (filters?.search) {
        query = query.ilike('titulo', `%${filters.search}%`)
      }
      if (filters?.categoriaId) {
        query = query.eq('categoria_id', filters.categoriaId)
      }
      if (filters?.estado) {
        query = query.eq('estado', filters.estado)
      }
      if (filters?.cidade) {
        query = query.eq('cidade', filters.cidade)
      }
      if (filters?.orgao) {
        query = query.eq('orgao', filters.orgao)
      }
      if (filters?.disciplina) {
        query = query.eq('disciplina', filters.disciplina)
      }

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
  })
}

export function useNoticeDetail(id: string) {
  return useQuery({
    queryKey: ['notice-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('editais')
        .select('*, categorias(id, nome, filtro_estado, filtro_cidade, filtro_orgao, filtro_disciplina), professor_profiles(nome_professor)')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useNoticeCategories() {
  return useQuery({
    queryKey: ['notice-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nome, filtro_estado, filtro_cidade, filtro_orgao, filtro_disciplina')
        .eq('tipo', 'edital')
        .order('nome')

      if (error) throw error
      return data ?? []
    },
  })
}

export function useToggleNoticeFavorite() {
  const { user } = useAuthContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ referenciaId, isFavorite }: { referenciaId: string; isFavorite: boolean }) => {
      if (!user) throw new Error('Not authenticated')

      if (isFavorite) {
        const { error } = await supabase
          .from('favoritos')
          .delete()
          .eq('user_id', user.id)
          .eq('tipo', 'edital')
          .eq('referencia_id', referenciaId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('favoritos')
          .insert({ user_id: user.id, tipo: 'edital', referencia_id: referenciaId })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['is-favorite'] })
    },
  })
}

export function useNoticeFilterOptions(field: 'estado' | 'cidade' | 'orgao' | 'disciplina') {
  return useQuery({
    queryKey: ['notice-filter-options', field],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('editais')
        .select(field)
        .not(field, 'is', null)

      if (error) throw error

      const unique = [...new Set((data ?? []).map((d: any) => d[field]).filter(Boolean))]
      return unique.sort().map((v) => ({ label: v as string, value: v as string }))
    },
  })
}
