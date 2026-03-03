import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

export function useProfessorCards() {
  return useQuery({
    queryKey: ['professor-cards-feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_professores')
        .select('id, titulo, descricao, imagem, video, professor_id, created_at, professor:professor_profiles(nome_professor, foto_perfil)')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return (data ?? []).map((item: any) => ({
        id: item.id,
        titulo: item.titulo,
        texto: item.descricao,
        imagem: item.imagem,
        video: item.video,
        professor_id: item.professor_id,
        professor_nome: item.professor?.nome_professor ?? 'Professor',
        professor_foto: item.professor?.foto_perfil ?? null,
        created_at: item.created_at,
      }))
    },
  })
}

export function useFollowedProfessorCards() {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['followed-professor-cards', user?.id],
    queryFn: async () => {
      if (!user) return []

      // Get followed professor IDs
      const { data: follows, error: followError } = await supabase
        .from('user_following_professors')
        .select('professor_id')
        .eq('user_id', user.id)

      if (followError) throw followError
      const followedIds = (follows ?? []).map((f: any) => f.professor_id)
      if (!followedIds.length) return []

      const { data, error } = await supabase
        .from('post_professores')
        .select('id, titulo, descricao, imagem, video, professor_id, created_at, professor:professor_profiles(nome_professor, foto_perfil)')
        .in('professor_id', followedIds)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return (data ?? []).map((item: any) => ({
        id: item.id,
        titulo: item.titulo,
        texto: item.descricao,
        imagem: item.imagem,
        video: item.video,
        professor_id: item.professor_id,
        professor_nome: item.professor?.nome_professor ?? 'Professor',
        professor_foto: item.professor?.foto_perfil ?? null,
        created_at: item.created_at,
      }))
    },
    enabled: !!user,
  })
}

export function useProfessorCardsByProfessor(professorId: string) {
  return useQuery({
    queryKey: ['professor-cards', professorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_professores')
        .select('id, titulo, descricao, imagem, video, created_at')
        .eq('professor_id', professorId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
    enabled: !!professorId,
  })
}
