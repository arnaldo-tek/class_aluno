import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

export function useCommunities() {
  return useQuery({
    queryKey: ['communities'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('comunidades')
        .select('*, categorias(nome)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as any[]
    },
  })
}

export function useIsMember(comunidadeId: string) {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['is-member', user?.id, comunidadeId],
    queryFn: async () => {
      if (!user) return false
      const { data } = await (supabase as any)
        .from('comunidade_membros')
        .select('id')
        .eq('user_id', user.id)
        .eq('comunidade_id', comunidadeId)
        .maybeSingle()

      return !!data
    },
    enabled: !!user && !!comunidadeId,
  })
}

export function useToggleMembership() {
  const { user } = useAuthContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ comunidadeId, isMember }: { comunidadeId: string; isMember: boolean }) => {
      if (!user) throw new Error('Not authenticated')

      if (isMember) {
        const { error } = await (supabase as any)
          .from('comunidade_membros')
          .delete()
          .eq('user_id', user.id)
          .eq('comunidade_id', comunidadeId)
        if (error) throw error
      } else {
        const { error } = await (supabase as any)
          .from('comunidade_membros')
          .insert({ user_id: user.id, comunidade_id: comunidadeId })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['is-member'] })
      qc.invalidateQueries({ queryKey: ['communities'] })
    },
  })
}

export function useCommunityMessages(comunidadeId: string) {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['community-messages', comunidadeId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('comunidade_mensagens')
        .select('id, texto, user_id, created_at, profiles(display_name, photo_url)')
        .eq('comunidade_id', comunidadeId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return (data ?? []) as any[]
    },
    enabled: !!comunidadeId,
  })

  // Realtime subscription
  useEffect(() => {
    if (!comunidadeId) return

    const channel = supabase
      .channel(`community-${comunidadeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comunidade_mensagens',
          filter: `comunidade_id=eq.${comunidadeId}`,
        },
        () => qc.invalidateQueries({ queryKey: ['community-messages', comunidadeId] }),
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [comunidadeId, qc])

  return query
}

export function useSendCommunityMessage() {
  const { user } = useAuthContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ comunidadeId, texto }: { comunidadeId: string; texto: string }) => {
      if (!user) throw new Error('Not authenticated')

      const { error } = await (supabase as any).from('comunidade_mensagens').insert({
        comunidade_id: comunidadeId,
        user_id: user.id,
        texto,
      })
      if (error) throw error
    },
    onSuccess: (_, { comunidadeId }) => {
      qc.invalidateQueries({ queryKey: ['community-messages', comunidadeId] })
    },
  })
}

export function useCommunityDetail(id: string) {
  return useQuery({
    queryKey: ['community-detail', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('comunidades')
        .select('*, categorias(nome)')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as any
    },
    enabled: !!id,
  })
}
