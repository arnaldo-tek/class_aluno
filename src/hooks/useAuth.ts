import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import type { User, Session } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { supabase } from '@/lib/supabase'

const UID_KEY = 'sc_last_uid'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  offlineUserId: string | null
}

function persistUserId(id: string) {
  if (Platform.OS !== 'web') SecureStore.setItemAsync(UID_KEY, id).catch(() => {})
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    offlineUserId: null,
  })

  useEffect(() => {
    let resolved = false

    // Load last known user ID so offline queries can still match cache
    if (Platform.OS !== 'web') {
      SecureStore.getItemAsync(UID_KEY).then((id) => {
        if (id) setState((prev) => ({ ...prev, offlineUserId: id }))
      }).catch(() => {})
    }

    const resolve = (session: Session | null) => {
      if (resolved) return
      resolved = true
      if (session?.user?.id) persistUserId(session.user.id)
      setState((prev) => ({
        user: session?.user ?? null,
        session,
        isLoading: false,
        offlineUserId: prev.offlineUserId,
      }))
    }

    // Timeout so auth never hangs forever when offline
    const timer = setTimeout(() => resolve(null), 5000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timer)
      resolve(session)
    }).catch(() => {
      clearTimeout(timer)
      resolve(null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        resolved = true
        clearTimeout(timer)
        if (session?.user?.id) persistUserId(session.user.id)
        setState((prev) => ({
          user: session?.user ?? null,
          session,
          isLoading: false,
          offlineUserId: prev.offlineUserId,
        }))
      },
    )

    return () => {
      clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [])

  return state
}
