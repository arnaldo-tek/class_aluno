import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

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
        .select('id, nome, imagem, preco, taxa_superclasse, average_rating')
        .eq('professor_id', professorId)
        .eq('is_publicado', true)
        .eq('is_encerrado', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []).map((c) => ({
        ...c,
        preco: (c.preco ?? 0) * (1 + (c.taxa_superclasse ?? 30) / 100),
      }))
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

export function useAllProfessors(search?: string) {
  return useQuery({
    queryKey: ['all-professors', search],
    queryFn: async () => {
      let query = supabase
        .from('professor_profiles')
        .select('id, nome_professor, foto_perfil, average_rating')
        .eq('approval_status', 'aprovado')
        .eq('is_blocked', false)
        .order('nome_professor')

      if (search?.trim()) {
        query = query.ilike('nome_professor', `%${search.trim()}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
  })
}

export function useFollowedProfessors() {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['followed-professors', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('user_following_professors')
        .select('professor:professor_profiles(id, nome_professor, foto_perfil, average_rating)')
        .eq('user_id', user.id)

      if (error) throw error
      return (data ?? []).map((d: any) => d.professor).filter(Boolean)
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
    onSuccess: (_d, { professorId }) => {
      qc.invalidateQueries({ queryKey: ['is-following'] })
      qc.invalidateQueries({ queryKey: ['followed-professors'] })
      qc.invalidateQueries({ queryKey: ['following-professors'] })
    },
  })
}
