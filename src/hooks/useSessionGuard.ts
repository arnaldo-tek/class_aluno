import { useEffect, useRef } from 'react'
import { Alert, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

/**
 * Monitora a tabela active_sessions via Realtime.
 * Se a sessão do usuário for invalidada (outro dispositivo logou),
 * faz logout automático e mostra um aviso.
 */
export function useSessionGuard() {
  const { session } = useAuthContext()
  const router = useRouter()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return

    const userId = session.user.id

    const channel = supabase
      .channel(`session:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'active_sessions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as {
            session_token: string
            invalidated_at: string | null
          }

          // Se a sessão foi invalidada E o token não é o nosso, outro dispositivo logou
          if (row.invalidated_at && row.session_token !== session.access_token) {
            handleForceLogout()
          }

          // Se o token mudou (outra sessão ativa), também forçar logout
          if (!row.invalidated_at && row.session_token !== session.access_token) {
            handleForceLogout()
          }
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [session?.user?.id, session?.access_token])

  async function handleForceLogout() {
    // Limpa o channel antes de deslogar
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
    }

    await supabase.auth.signOut()

    if (Platform.OS === 'web') {
      alert('Sua conta foi acessada em outro dispositivo. Você foi desconectado.')
    } else {
      Alert.alert(
        'Sessão encerrada',
        'Sua conta foi acessada em outro dispositivo. Você foi desconectado.',
        [{ text: 'OK' }],
      )
    }

    router.replace('/(auth)/login')
  }
}
