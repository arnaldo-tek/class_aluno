import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIsOnline } from './useIsOnline'
import { getOfflineCoursesWithDownloads, getOfflineCourse } from '@/lib/offlineDb'

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
  const { user, offlineUserId } = useAuthContext()
  const userId = user?.id ?? offlineUserId
  const isOnline = useIsOnline()

  return useQuery({
    queryKey: ['my-enrollments', userId, isOnline],
    networkMode: 'offlineFirst',
    queryFn: async () => {
      if (!isOnline) {
        const offlineCourses = await getOfflineCoursesWithDownloads()
        return offlineCourses.map((oc) => ({
          id: oc.id,
          enrolled_at: oc.snapshot_at,
          is_suspended: false,
          curso: {
            id: oc.id,
            nome: oc.nome,
            imagem: oc.imagem,
            preco: oc.preco,
            professor: { nome_professor: oc.professor_nome ?? '' },
          },
          progress: null,
        }))
      }

      if (!user) return []

      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
          id, enrolled_at, is_suspended,
          curso:cursos(id, nome, imagem, preco, professor:professor_profiles(nome_professor))
        `)
        .eq('user_id', user.id)
        .or('is_suspended.is.null,is_suspended.eq.false')
        .order('enrolled_at', { ascending: false })

      if (error) throw error

      const { data: progress } = await supabase
        .from('v_course_progress')
        .select('*')
        .eq('user_id', user.id)

      const progressMap = new Map(
        (progress ?? []).map((p) => [p.curso_id, p]),
      )

      return (enrollments ?? []).map((e) => ({
        ...e,
        progress: progressMap.get(e.curso?.id ?? '') ?? null,
      }))
    },
    enabled: !!userId,
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
  const isOnline = useIsOnline()

  return useQuery({
    queryKey: ['enrollment-check', user?.id, courseId, isOnline],
    networkMode: 'offlineFirst',
    queryFn: async () => {
      if (!isOnline) {
        const offlineCourse = await getOfflineCourse(courseId)
        return offlineCourse !== null
      }
      if (!user) return false
      const { data } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('curso_id', courseId)
        .maybeSingle()

      return !!data
    },
    enabled: !!courseId,
  })
}
