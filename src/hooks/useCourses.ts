import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useFeaturedCourses() {
  return useQuery({
    queryKey: ['featured-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cursos')
        .select('id, nome, imagem, preco, average_rating, professor:professor_profiles!inner(nome_professor, approval_status, is_blocked)')
        .eq('is_publicado', true)
        .eq('is_encerrado', false)
        .eq('professor.approval_status', 'aprovado')
        .eq('professor.is_blocked', false)
        .order('average_rating', { ascending: false })
        .limit(10)

      if (error) throw error
      return (data ?? []).map((c) => ({
        ...c,
        professor_nome: (c.professor as any)?.nome_professor ?? null,
      }))
    },
  })
}

interface CoursesFilter {
  search?: string
  categoriaId?: string
  page?: number
}

export function useCourses(filters: CoursesFilter = {}) {
  const { search, categoriaId, page = 1 } = filters
  const pageSize = 20

  return useQuery({
    queryKey: ['courses', search, categoriaId, page],
    queryFn: async () => {
      let query = supabase
        .from('cursos')
        .select('id, nome, imagem, preco, average_rating, descricao, professor:professor_profiles!inner(nome_professor, approval_status, is_blocked)', { count: 'exact' })
        .eq('is_publicado', true)
        .eq('is_encerrado', false)
        .eq('professor.approval_status', 'aprovado')
        .eq('professor.is_blocked', false)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (search) query = query.ilike('nome', `%${search}%`)
      if (categoriaId) query = query.eq('categoria_id', categoriaId)

      const { data, error, count } = await query
      if (error) throw error

      return {
        courses: (data ?? []).map((c) => ({
          ...c,
          professor_nome: (c.professor as any)?.nome_professor ?? null,
        })),
        total: count ?? 0,
        hasMore: (count ?? 0) > page * pageSize,
      }
    },
  })
}

export function useCourseDetail(courseId: string) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
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
  return useQuery({
    queryKey: ['course-modules', courseId],
    queryFn: async () => {
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
