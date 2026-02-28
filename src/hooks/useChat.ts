import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

export function useChats() {
  const { user } = useAuthContext()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['chats', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          user_a_profile:profiles!chats_user_a_fkey(display_name, photo_url),
          user_b_profile:profiles!chats_user_b_fkey(display_name, photo_url)
        `)
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order('last_message_time', { ascending: false })

      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
  })

  // Realtime subscription for chat list updates
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('chats-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats' },
        () => qc.invalidateQueries({ queryKey: ['chats', user.id] }),
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, qc])

  return query
}

export function useChatMessages(chatId: string) {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['chat-messages', chatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, text, image, user_id, created_at')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data ?? []
    },
    enabled: !!chatId,
  })

  // Realtime subscription for new messages
  useEffect(() => {
    if (!chatId) return

    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        () => qc.invalidateQueries({ queryKey: ['chat-messages', chatId] }),
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [chatId, qc])

  return query
}

export function useSendMessage() {
  const { user } = useAuthContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ chatId, text }: { chatId: string; text: string }) => {
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('chat_messages').insert({
        chat_id: chatId,
        user_id: user.id,
        text,
      })
      if (error) throw error

      // Update chat metadata
      await supabase.from('chats').update({
        last_message: text,
        last_message_time: new Date().toISOString(),
        last_message_sent_by: user.id,
        message_seen: false,
      }).eq('id', chatId)
    },
    onSuccess: (_, { chatId }) => {
      qc.invalidateQueries({ queryKey: ['chat-messages', chatId] })
      qc.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}

export function useMarkChatSeen() {
  const { user } = useAuthContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (chatId: string) => {
      if (!user) return
      await supabase.from('chats')
        .update({ message_seen: true })
        .eq('id', chatId)
        .neq('last_message_sent_by', user.id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chats'] }),
  })
}

export function useStartChat() {
  const { user } = useAuthContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error('Not authenticated')

      // Check if chat already exists
      const { data: existing } = await supabase
        .from('chats')
        .select('id')
        .or(`and(user_a.eq.${user.id},user_b.eq.${otherUserId}),and(user_a.eq.${otherUserId},user_b.eq.${user.id})`)
        .maybeSingle()

      if (existing) return existing.id

      // Create new chat
      const { data, error } = await supabase
        .from('chats')
        .insert({ user_a: user.id, user_b: otherUserId })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chats'] }),
  })
}

export function useUnreadChatsCount() {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['unread-chats', user?.id],
    queryFn: async () => {
      if (!user) return 0
      const { count, error } = await supabase
        .from('chats')
        .select('id', { count: 'exact', head: true })
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .eq('message_seen', false)
        .neq('last_message_sent_by', user.id)

      if (error) return 0
      return count ?? 0
    },
    enabled: !!user,
    refetchInterval: 30000,
  })
}
