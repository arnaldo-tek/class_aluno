import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIsOnline } from './useIsOnline'
import { getOfflineCourse, getOfflineModulesWithLessons } from '@/lib/offlineDb'

export function useFeaturedCourses() {
  return useQuery({
    queryKey: ['featured-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cursos')
        .select('id, nome, imagem, preco, taxa_superclasse, average_rating, professor:professor_profiles!inner(nome_professor, approval_status, is_blocked)')
        .eq('is_publicado', true)
        .eq('is_encerrado', false)
        .eq('professor.approval_status', 'aprovado')
        .eq('professor.is_blocked', false)
        .order('average_rating', { ascending: false })
        .limit(10)

      if (error) throw error
      return (data ?? []).map((c) => ({
        ...c,
        preco: (c.preco ?? 0) * (1 + (c.taxa_superclasse ?? 30) / 100),
        professor_nome: (c.professor as any)?.nome_professor ?? null,
      }))
    },
  })
}

interface CoursesFilter {
  search?: string
  categoriaId?: string
  estado?: string | null
  cidade?: string | null
  orgao?: string | null
  cargo?: string | null
  escolaridade?: string | null
  nivelId?: string | null
  disciplinaId?: string | null
  page?: number
}

export function useCourses(filters: CoursesFilter = {}) {
  const { search, categoriaId, estado, cidade, orgao, cargo, escolaridade, nivelId, disciplinaId, page = 1 } = filters
  const pageSize = 20

  return useQuery({
    queryKey: ['courses', search, categoriaId, estado, cidade, orgao, cargo, escolaridade, nivelId, disciplinaId, page],
    queryFn: async () => {
      let query = supabase
        .from('cursos')
        .select('id, nome, imagem, preco, taxa_superclasse, average_rating, descricao, professor:professor_profiles!inner(nome_professor, approval_status, is_blocked)', { count: 'exact' })
        .eq('is_publicado', true)
        .eq('is_encerrado', false)
        .eq('professor.approval_status', 'aprovado')
        .eq('professor.is_blocked', false)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (search) query = query.ilike('nome', `%${search}%`)
      if (categoriaId) query = query.eq('categoria_id', categoriaId)
      if (estado) query = query.eq('estado', estado)
      if (cidade) query = query.eq('cidade', cidade)
      if (orgao) query = query.eq('orgao', orgao)
      if (cargo) query = query.eq('cargo', cargo)
      if (escolaridade) query = query.eq('escolaridade', escolaridade)
      if (nivelId) query = query.eq('nivel_id', nivelId)
      if (disciplinaId) query = query.eq('disciplina_id', disciplinaId)

      const { data, error, count } = await query
      if (error) throw error

      return {
        courses: (data ?? []).map((c) => ({
          ...c,
          preco: (c.preco ?? 0) * (1 + (c.taxa_superclasse ?? 30) / 100),
          professor_nome: (c.professor as any)?.nome_professor ?? null,
        })),
        total: count ?? 0,
        hasMore: (count ?? 0) > page * pageSize,
      }
    },
  })
}

// Busca os flags de filtro da categoria selecionada
export function useCategoryFilters(categoriaId?: string) {
  return useQuery({
    queryKey: ['category-filters', categoriaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('filtro_estado, filtro_cidade, filtro_orgao, filtro_cargo, filtro_escolaridade, filtro_nivel, filtro_disciplina')
        .eq('id', categoriaId!)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!categoriaId,
  })
}

type FilterField = 'estado' | 'cidade' | 'orgao' | 'cargo' | 'escolaridade' | 'nivel_id' | 'disciplina_id'

export function useCourseFilterOptions(field: FilterField, parentFilters?: Record<string, string | null>, categoriaId?: string, enabled = true) {
  const isDisciplina = field === 'disciplina_id'
  const isNivel = field === 'nivel_id'
  const needsJoin = isDisciplina || isNivel

  return useQuery({
    queryKey: ['course-filter-options', field, parentFilters, categoriaId],
    queryFn: async () => {
      // Para disciplina/nivel, join com tabela de referência para pegar o nome
      const selectField = isDisciplina
        ? 'disciplina_id, disciplina:disciplinas!cursos_disciplina_id_fkey(nome)'
        : isNivel
        ? 'nivel_id, nivel:niveis(nome)'
        : field
      let query = supabase
        .from('cursos')
        .select(selectField)
        .eq('is_publicado', true)
        .eq('is_encerrado', false)
        .not(field, 'is', null)

      if (categoriaId) query = query.eq('categoria_id', categoriaId)
      if (parentFilters?.estado) query = query.eq('estado', parentFilters.estado)
      if (parentFilters?.cidade && field !== 'estado') query = query.eq('cidade', parentFilters.cidade)
      if (parentFilters?.orgao && field !== 'estado' && field !== 'cidade') query = query.eq('orgao', parentFilters.orgao)
      if (parentFilters?.cargo && field !== 'estado' && field !== 'cidade' && field !== 'orgao') query = query.eq('cargo', parentFilters.cargo)

      const { data, error } = await query
      if (error) throw error

      if (needsJoin) {
        const idKey = isDisciplina ? 'disciplina_id' : 'nivel_id'
        const joinKey = isDisciplina ? 'disciplina' : 'nivel'
        const map = new Map<string, string>()
        for (const d of data ?? []) {
          const id = (d as any)[idKey]
          const nome = (d as any)[joinKey]?.nome
          if (id && nome) map.set(id, nome)
        }
        return [...map.entries()]
          .sort((a, b) => a[1].localeCompare(b[1]))
          .map(([id, nome]) => ({ label: nome, value: id }))
      }

      const unique = [...new Set((data ?? []).map((d: any) => d[field]).filter(Boolean))]
      return unique.sort().map((v) => ({ label: v as string, value: v as string }))
    },
    enabled,
  })
}

export function useCourseDetail(courseId: string) {
  const isOnline = useIsOnline()
  return useQuery({
    queryKey: ['course', courseId, isOnline],
    networkMode: 'offlineFirst',
    queryFn: async () => {
      if (!isOnline) {
        const oc = await getOfflineCourse(courseId)
        if (!oc) return null
        return {
          id: oc.id,
          nome: oc.nome,
          imagem: oc.imagem,
          descricao: oc.descricao,
          preco: oc.preco,
          taxa_superclasse: oc.taxa_superclasse,
          average_rating: oc.average_rating,
          is_publicado: true,
          is_encerrado: false,
          is_degustacao: false,
          professor: {
            id: oc.professor_id,
            user_id: oc.professor_user_id,
            nome_professor: oc.professor_nome,
            foto_perfil: oc.professor_foto,
            average_rating: null,
            descricao: null,
            approval_status: 'aprovado',
            is_blocked: false,
          },
          categoria: null,
        } as any
      }

      const { data, error } = await supabase
        .from('cursos')
        .select(`
          *,
          professor:professor_profiles!inner(id, nome_professor, foto_perfil, average_rating, descricao, user_id, approval_status, is_blocked),
          categoria:categorias(nome)
        `)
        .eq('id', courseId)
        .eq('professor.approval_status', 'aprovado')
        .eq('professor.is_blocked', false)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!courseId,
  })
}

export function useCourseModules(courseId: string) {
  const isOnline = useIsOnline()
  return useQuery({
    queryKey: ['course-modules', courseId, isOnline],
    networkMode: 'offlineFirst',
    queryFn: async () => {
      if (!isOnline) {
        const modules = await getOfflineModulesWithLessons(courseId)
        return modules.map((mod) => ({
          id: mod.id,
          nome: mod.nome,
          sort_order: mod.sort_order,
          aulas: mod.aulas.map((a) => ({
            id: a.id,
            titulo: a.titulo,
            is_liberado: a.is_liberado === 1,
            is_degustacao: a.is_degustacao === 1,
            sort_order: a.sort_order,
          })),
        }))
      }

      const { data, error } = await supabase
        .from('modulos')
        .select('id, nome, sort_order, aulas:aulas(id, titulo, is_liberado, is_degustacao, sort_order)')
        .eq('curso_id', courseId)
        .order('sort_order')

      if (error) throw error
      return (data ?? []).map((m) => ({
        ...m,
        aulas: ((m.aulas as any[]) ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      }))
    },
    enabled: !!courseId,
  })
}

export function useCourseReviews(courseId: string) {
  return useQuery({
    queryKey: ['course-reviews', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avaliacoes')
        .select('id, rating, comentario, created_at, user:profiles(display_name, photo_url)')
        .eq('curso_id', courseId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return data ?? []
    },
    enabled: !!courseId,
  })
}

export function useHasReviewedCourse(courseId: string) {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['has-reviewed-course', user?.id, courseId],
    queryFn: async () => {
      if (!user) return false
      const { data } = await supabase
        .from('avaliacoes')
        .select('id')
        .eq('curso_id', courseId)
        .eq('user_id', user.id)
        .maybeSingle()

      return !!data
    },
    enabled: !!user && !!courseId,
  })
}
