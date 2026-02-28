import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useProfessorDetail(professorId: string) {
  return useQuery({
    queryKey: ['professor', professorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professor_profiles')
        .select('*')
        .eq('id', professorId)
        .eq('approval_status', 'aprovado')
        .eq('is_blocked', false)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!professorId,
  })
}

export function useProfessorCourses(professorId: string) {
  return useQuery({
    queryKey: ['professor-courses', professorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cursos')
        .select('id, nome, imagem, preco, average_rating')
        .eq('professor_id', professorId)
        .eq('is_publicado', true)
        .eq('is_encerrado', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
    enabled: !!professorId,
  })
}

export function useProfessorReviews(professorId: string) {
  return useQuery({
    queryKey: ['professor-reviews', professorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avaliacoes')
        .select('id, rating, comentario, created_at, user:profiles(display_name)')
        .eq('professor_id', professorId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data ?? []
    },
    enabled: !!professorId,
  })
}
