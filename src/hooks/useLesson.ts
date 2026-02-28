import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

export function useLessonDetail(lessonId: string) {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aulas')
        .select(`
          *,
          curso:cursos(id, nome),
          modulo:modulos(id, nome),
          autor:professor_profiles(id, nome_professor)
        `)
        .eq('id', lessonId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!lessonId,
  })
}

export function useLessonTexts(lessonId: string) {
  return useQuery({
    queryKey: ['lesson-texts', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('textos_da_aula')
        .select('id, texto, created_at')
        .eq('aula_id', lessonId)
        .order('created_at')

      if (error) throw error
      return data ?? []
    },
    enabled: !!lessonId,
  })
}

export function useLessonAudios(lessonId: string) {
  return useQuery({
    queryKey: ['lesson-audios', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audios_da_aula')
        .select('id, titulo, audio_url, created_at')
        .eq('aula_id', lessonId)
        .order('created_at')

      if (error) throw error
      return data ?? []
    },
    enabled: !!lessonId,
  })
}

export function useLessonQuestions(lessonId: string) {
  return useQuery({
    queryKey: ['lesson-questions', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questoes_da_aula')
        .select('id, pergunta, resposta, alternativas, video, sort_order')
        .eq('aula_id', lessonId)
        .order('sort_order')

      if (error) throw error
      return data ?? []
    },
    enabled: !!lessonId,
  })
}

export function useLessonProgress(lessonId: string) {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['lesson-progress', user?.id, lessonId],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('aula_id', lessonId)
        .maybeSingle()

      if (error) throw error
      return data
    },
    enabled: !!user && !!lessonId,
  })
}

export function useMarkLessonComplete() {
  const { user } = useAuthContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ aulaId, cursoId }: { aulaId: string; cursoId: string }) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('lesson_progress')
        .upsert(
          {
            user_id: user.id,
            aula_id: aulaId,
            curso_id: cursoId,
            is_completed: true,
            completed_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,aula_id' }
        )
      if (error) throw error
    },
    onSuccess: (_, { aulaId, cursoId }) => {
      qc.invalidateQueries({ queryKey: ['lesson-progress', user?.id, aulaId] })
      qc.invalidateQueries({ queryKey: ['course-progress', user?.id, cursoId] })
      qc.invalidateQueries({ queryKey: ['my-enrollments'] })
    },
  })
}

export function useSaveAudioPosition() {
  const { user } = useAuthContext()

  return useMutation({
    mutationFn: async ({
      aulaId,
      cursoId,
      positionSeconds,
    }: {
      aulaId: string
      cursoId: string
      positionSeconds: number
    }) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('lesson_progress')
        .upsert(
          {
            user_id: user.id,
            aula_id: aulaId,
            curso_id: cursoId,
            audio_position_seconds: positionSeconds,
          },
          { onConflict: 'user_id,aula_id' }
        )
      if (error) throw error
    },
  })
}
