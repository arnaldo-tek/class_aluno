import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

interface NoticeFilters {
  search?: string
  categoriaId?: string | null
  categoriaIds?: string[]
  estadoId?: string | null
  municipioId?: string | null
  orgao?: string | null
  cargo?: string | null
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
      if (filters?.categoriaIds && filters.categoriaIds.length > 0) {
        query = query.in('categoria_id', filters.categoriaIds)
      } else if (filters?.categoriaId) {
        query = query.eq('categoria_id', filters.categoriaId)
      }
      if (filters?.estadoId) {
        query = query.eq('estado_id', filters.estadoId)
      }
      if (filters?.municipioId) {
        query = query.eq('municipio_id', filters.municipioId)
      }
      if (filters?.orgao) {
        query = query.eq('orgao', filters.orgao)
      }
      if (filters?.cargo) {
        query = query.eq('cargo', filters.cargo)
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
        .select('*, categorias(id, nome, filtro_estado, filtro_cidade, filtro_orgao_editais_noticias, filtro_disciplina), professor_profiles(nome_professor)')
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
        .select('id, nome, filtro_estado, filtro_cidade, filtro_orgao_editais_noticias, filtro_cargo, filtro_disciplina')
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

type NoticeFilterField = 'estado' | 'cidade' | 'orgao' | 'cargo' | 'disciplina'

export function useNoticeFilterOptions(field: NoticeFilterField, categoriaIds?: string[], enabled = true) {
  return useQuery({
    queryKey: ['notice-filter-options', field, categoriaIds],
    queryFn: async () => {
      if (field === 'estado') {
        const selectField = 'estado_id, estado:estados(nome)'
        let query = supabase.from('editais').select(selectField).not('estado_id', 'is', null)
        if (categoriaIds && categoriaIds.length > 0) query = query.in('categoria_id', categoriaIds)
        const { data, error } = await query
        if (error) throw error
        const map = new Map<string, string>()
        for (const d of data ?? []) {
          const id = (d as any).estado_id
          const nome = (d as any).estado?.nome
          if (id && nome) map.set(id, nome)
        }
        return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([id, nome]) => ({ label: nome, value: id }))
      }

      if (field === 'cidade') {
        const selectField = 'municipio_id, municipio:municipios(nome)'
        let query = supabase.from('editais').select(selectField).not('municipio_id', 'is', null)
        if (categoriaIds && categoriaIds.length > 0) query = query.in('categoria_id', categoriaIds)
        const { data, error } = await query
        if (error) throw error
        const map = new Map<string, string>()
        for (const d of data ?? []) {
          const id = (d as any).municipio_id
          const nome = (d as any).municipio?.nome
          if (id && nome) map.set(id, nome)
        }
        return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([id, nome]) => ({ label: nome, value: id }))
      }

      // orgao, cargo, disciplina are text columns
      let query = supabase.from('editais').select(field).not(field, 'is', null)
      if (categoriaIds && categoriaIds.length > 0) query = query.in('categoria_id', categoriaIds)
      const { data, error } = await query
      if (error) throw error
      const unique = [...new Set((data ?? []).map((d: any) => d[field]).filter(Boolean))]
      return unique.sort().map((v) => ({ label: v as string, value: v as string }))
    },
    enabled,
  })
}
