import { Platform } from 'react-native'
import { supabase } from './supabase'

async function registerSession(accessToken: string) {
  const deviceInfo = `${Platform.OS} - ${Platform.Version}`
  const { error } = await supabase.rpc('register_session', {
    p_session_token: accessToken,
    p_device_info: deviceInfo,
  })
  if (error) console.warn('Failed to register session:', error.message)
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (data.session) {
    await registerSession(data.session.access_token)
  }
  return data
}

export async function signUp(email: string, password: string, displayName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  })
  if (error) throw error
  if (data.session) {
    await registerSession(data.session.access_token)
  }
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}
