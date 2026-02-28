import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

export function useMyChamados() {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['my-chamados', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('chamados')
        .select('id, descricao, status, created_at')
        .eq('user_id', user.id)
        .eq('is_suporte_aluno', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
  })
}

export function useCreateChamado() {
  const { user } = useAuthContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ descricao }: { descricao: string }) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('chamados').insert({
        descricao,
        user_id: user.id,
        is_suporte_aluno: true,
        status: 'aberto',
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-chamados'] }),
  })
}
