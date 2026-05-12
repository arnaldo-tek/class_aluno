import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIsOnline } from './useIsOnline'
import { getOfflineLesson, getOfflineAudios, getOfflineTexts, getOfflineQuestions, getOfflineProgress, upsertOfflineProgress } from '@/lib/offlineDb'

export function useLessonDetail(lessonId: string) {
  const isOnline = useIsOnline()
  return useQuery({
    queryKey: ['lesson', lessonId, isOnline],
    networkMode: 'offlineFirst',
    queryFn: async () => {
      if (!isOnline) {
        const ol = await getOfflineLesson(lessonId)
        if (!ol) return null
        return {
          id: ol.id,
          titulo: ol.titulo,
          descricao: ol.descricao,
          is_liberado: ol.is_liberado === 1,
          is_degustacao: ol.is_degustacao === 1,
          imagem_capa: ol.imagem_capa,
          pdf: ol.pdf_url,
          video_url: ol.video_url,
          texto_aula: ol.texto_aula,
          curso_id: ol.course_id,
          modulo_id: ol.module_id,
          curso: { id: ol.course_id, nome: null },
          modulo: { id: ol.module_id, nome: null },
          autor: null,
        } as any
      }

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
  const isOnline = useIsOnline()
  return useQuery({
    queryKey: ['lesson-texts', lessonId, isOnline],
    networkMode: 'offlineFirst',
    queryFn: async () => {
      if (!isOnline) return getOfflineTexts(lessonId)

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
  const isOnline = useIsOnline()
  return useQuery({
    queryKey: ['lesson-audios', lessonId, isOnline],
    networkMode: 'offlineFirst',
    queryFn: async () => {
      if (!isOnline) {
        return getOfflineAudios(lessonId)
      }

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
  const isOnline = useIsOnline()
  return useQuery({
    queryKey: ['lesson-questions', lessonId, isOnline],
    networkMode: 'offlineFirst',
    queryFn: async () => {
      if (!isOnline) return getOfflineQuestions(lessonId)

      const { data, error } = await supabase
        .from('questoes_da_aula')
        .select('id, pergunta, resposta, alternativas, video, resposta_escrita, sort_order')
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
  const isOnline = useIsOnline()

  return useQuery({
    queryKey: ['lesson-progress', user?.id, lessonId, isOnline],
    networkMode: 'offlineFirst',
    queryFn: async () => {
      if (!user) return null
      if (!isOnline) {
        const local = await getOfflineProgress(lessonId, user.id)
        return local ? { is_completed: local.is_completed === 1 } : null
      }

      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('aula_id', lessonId)
        .maybeSingle()

      if (error) throw error
      if (data) {
        await upsertOfflineProgress({ lesson_id: lessonId, user_id: user.id, is_completed: data.is_completed ? 1 : 0 })
      }
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
      await upsertOfflineProgress({ lesson_id: aulaId, user_id: user.id, is_completed: 1 })
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
