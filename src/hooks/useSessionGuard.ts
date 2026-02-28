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

  // Poll is_suspended every 30s as fallback (Realtime may not be enabled on profiles)
  useEffect(() => {
    if (!session?.user?.id) return
    const userId = session.user.id

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('is_suspended')
        .eq('id', userId)
        .single()

      if (data?.is_suspended) {
        clearInterval(interval)
        handleForceLogout('Sua conta foi suspensa. Entre em contato com o suporte para mais informações.')
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [session?.user?.id])

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
            handleForceLogout('Sua conta foi acessada em outro dispositivo. Você foi desconectado.')
          }

          // Se o token mudou (outra sessão ativa), também forçar logout
          if (!row.invalidated_at && row.session_token !== session.access_token) {
            handleForceLogout('Sua conta foi acessada em outro dispositivo. Você foi desconectado.')
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { is_suspended?: boolean }
          if (row.is_suspended) {
            handleForceLogout('Sua conta foi suspensa. Entre em contato com o suporte para mais informações.')
          }
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [session?.user?.id, session?.access_token])

  async function handleForceLogout(message: string) {
    // Limpa o channel antes de deslogar
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
    }

    await supabase.auth.signOut()

    if (Platform.OS === 'web') {
      alert(message)
    } else {
      Alert.alert('Aviso', message, [{ text: 'OK' }])
    }

    router.replace('/(auth)/login')
  }
}
