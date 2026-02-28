import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ActivityIndicator, Image, Alert,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { signIn, signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { t } from '@/i18n'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin() {
    if (!email || !password) return
    setError('')
    setLoading(true)

    try {
      const data = await signIn(email, password)

      // Check if user is suspended
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_suspended')
        .eq('id', data.user.id)
        .single()

      if (profile?.is_suspended) {
        await signOut()
        setError('Sua conta foi suspensa. Entre em contato com o suporte para mais informações.')
        return
      }

      router.replace('/(tabs)/home')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-dark-bg"
    >
      <View className="flex-1 justify-center px-6">
        <Image
          source={require('../../../assets/logo.png')}
          style={{ width: 192, height: 56, alignSelf: 'center', marginBottom: 24 }}
          resizeMode="contain"
        />
        <Text className="text-base text-center text-darkText-secondary mb-8">
          {t('auth.login')}
        </Text>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-darkText-secondary mb-1.5">
              {t('auth.email')}
            </Text>
            <TextInput
              className="bg-dark-surfaceLight border border-darkBorder rounded-2xl px-4 py-3.5 text-base text-darkText"
              placeholder="seu@email.com"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-darkText-secondary mb-1.5">
              {t('auth.password')}
            </Text>
            <TextInput
              className="bg-dark-surfaceLight border border-darkBorder rounded-2xl px-4 py-3.5 text-base text-darkText"
              placeholder="Sua senha"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          {error ? (
            <Text className="text-sm text-error">{error}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="bg-primary rounded-2xl py-4 items-center mt-2"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">
                {t('auth.login')}
              </Text>
            )}
          </TouchableOpacity>

          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity className="items-center py-2">
              <Text className="text-primary-light text-sm">
                {t('auth.forgotPassword')}
              </Text>
            </TouchableOpacity>
          </Link>

          <View className="flex-row justify-center items-center gap-1 mt-4">
            <Text className="text-darkText-muted text-sm">{t('auth.noAccount')}</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-accent font-semibold text-sm">
                  {t('auth.register')}
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
