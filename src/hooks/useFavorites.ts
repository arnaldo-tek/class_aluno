import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

export function useFollowingProfessors() {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['following-professors', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('user_following_professors')
        .select('professor_id, professor:professor_profiles(id, nome_professor, foto_perfil, average_rating)')
        .eq('user_id', user.id)

      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
  })
}

export function useIsFollowing(professorId: string) {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['is-following', user?.id, professorId],
    queryFn: async () => {
      if (!user) return false
      const { data } = await supabase
        .from('user_following_professors')
        .select('professor_id')
        .eq('user_id', user.id)
        .eq('professor_id', professorId)
        .maybeSingle()

      return !!data
    },
    enabled: !!user && !!professorId,
  })
}

export function useToggleFollow() {
  const { user } = useAuthContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ professorId, isFollowing }: { professorId: string; isFollowing: boolean }) => {
      if (!user) throw new Error('Not authenticated')

      if (isFollowing) {
        const { error } = await supabase
          .from('user_following_professors')
          .delete()
          .eq('user_id', user.id)
          .eq('professor_id', professorId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('user_following_professors')
          .insert({ user_id: user.id, professor_id: professorId })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['is-following'] })
      qc.invalidateQueries({ queryKey: ['following-professors'] })
    },
  })
}

export function useSubmitReview() {
  const { user } = useAuthContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      rating: number
      comentario?: string
      curso_id?: string
      professor_id?: string
    }) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('avaliacoes').insert({
        ...params,
        user_id: user.id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-reviews'] })
      qc.invalidateQueries({ queryKey: ['professor-reviews'] })
    },
  })
}

export function useSubmitComment() {
  const { user } = useAuthContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: { comentario: string; curso_id: string }) => {
      if (!user) throw new Error('Not authenticated')
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, photo_url')
        .eq('id', user.id)
        .single()

      const { error } = await supabase.from('comentarios').insert({
        comentario: params.comentario,
        curso_id: params.curso_id,
        user_id: user.id,
        nome: profile?.display_name ?? user.email,
        foto_usuario: profile?.photo_url,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['course-comments'] }),
  })
}

export function useCourseComments(courseId: string) {
  return useQuery({
    queryKey: ['course-comments', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comentarios')
        .select('id, nome, foto_usuario, comentario, imagens, created_at')
        .eq('curso_id', courseId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data ?? []
    },
    enabled: !!courseId,
  })
}
