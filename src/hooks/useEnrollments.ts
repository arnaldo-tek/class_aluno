import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

export function useFreeEnroll() {
  const { user } = useAuthContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ cursoId }: { cursoId: string }) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('enrollments').insert({
        user_id: user.id,
        curso_id: cursoId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-enrollments'] })
      qc.invalidateQueries({ queryKey: ['enrollment-check'] })
    },
  })
}

export function useMyEnrollments() {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['my-enrollments', user?.id],
    queryFn: async () => {
      if (!user) return []

      // Fetch enrollments
      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
          id, enrolled_at, is_suspended,
          curso:cursos(id, nome, imagem, preco, professor:professor_profiles(nome_professor))
        `)
        .eq('user_id', user.id)
        .eq('is_suspended', false)
        .order('enrolled_at', { ascending: false })

      if (error) throw error

      // Fetch progress from view
      const { data: progress } = await supabase
        .from('v_course_progress')
        .select('*')
        .eq('user_id', user.id)

      const progressMap = new Map(
        (progress ?? []).map((p) => [p.curso_id, p])
      )

      return (enrollments ?? []).map((e) => ({
        ...e,
        progress: progressMap.get(e.curso?.id ?? '') ?? null,
      }))
    },
    enabled: !!user,
  })
}

export function useCourseProgress(courseId: string) {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['course-progress', user?.id, courseId],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('v_course_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('curso_id', courseId)
        .maybeSingle()

      if (error) throw error
      return data
    },
    enabled: !!user && !!courseId,
  })
}

export function useIsEnrolled(courseId: string) {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['enrollment-check', user?.id, courseId],
    queryFn: async () => {
      if (!user) return false
      const { data } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('curso_id', courseId)
        .maybeSingle()

      return !!data
    },
    enabled: !!user && !!courseId,
  })
}
