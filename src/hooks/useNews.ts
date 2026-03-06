import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

interface NewsFilters {
  search?: string
  categoriaId?: string | null
  categoriaIds?: string[]
  estadoId?: string | null
  municipioId?: string | null
  orgao?: string | null
  cargo?: string | null
  disciplina?: string | null
}

export function useNews(filters?: NewsFilters) {
  return useQuery({
    queryKey: ['news', filters],
    queryFn: async () => {
      let query = supabase
        .from('noticias')
        .select('id, titulo, descricao, imagem, categoria_id, estado, cidade, orgao, disciplina, created_at, estado_id, municipio_id, categorias(nome)')
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

export function useNewsDetail(id: string) {
  return useQuery({
    queryKey: ['news-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('noticias')
        .select('*, categorias(id, nome, filtro_estado, filtro_cidade, filtro_orgao_editais_noticias, filtro_disciplina)')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useNewsCategories() {
  return useQuery({
    queryKey: ['news-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nome, filtro_estado, filtro_cidade, filtro_orgao_editais_noticias, filtro_cargo, filtro_disciplina')
        .eq('tipo', 'noticia')
        .order('nome')

      if (error) throw error
      return data ?? []
    },
  })
}

export function useIsFavorite(tipo: string, referenciaId: string) {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['is-favorite', user?.id, tipo, referenciaId],
    queryFn: async () => {
      if (!user) return false
      const { data } = await supabase
        .from('favoritos')
        .select('id')
        .eq('user_id', user.id)
        .eq('tipo', tipo)
        .eq('referencia_id', referenciaId)
        .maybeSingle()

      return !!data
    },
    enabled: !!user && !!referenciaId,
  })
}

export function useToggleNewsFavorite() {
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
          .eq('tipo', 'noticia')
          .eq('referencia_id', referenciaId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('favoritos')
          .insert({ user_id: user.id, tipo: 'noticia', referencia_id: referenciaId })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['is-favorite'] })
    },
  })
}

type NewsFilterField = 'estado' | 'cidade' | 'orgao' | 'cargo' | 'disciplina'

export function useNewsFilterOptions(field: NewsFilterField, categoriaIds?: string[], enabled = true) {
  return useQuery({
    queryKey: ['news-filter-options', field, categoriaIds],
    queryFn: async () => {
      if (field === 'estado') {
        const selectField = 'estado_id, estado:estados(nome)'
        let query = supabase.from('noticias').select(selectField).not('estado_id', 'is', null)
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
        let query = supabase.from('noticias').select(selectField).not('municipio_id', 'is', null)
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
      let query = supabase.from('noticias').select(field).not(field, 'is', null)
      if (categoriaIds && categoriaIds.length > 0) query = query.in('categoria_id', categoriaIds)
      const { data, error } = await query
      if (error) throw error
      const unique = [...new Set((data ?? []).map((d: any) => d[field]).filter(Boolean))]
      return unique.sort().map((v) => ({ label: v as string, value: v as string }))
    },
    enabled,
  })
}
