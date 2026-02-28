import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ActivityIndicator, Image,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { signIn } from '@/lib/auth'
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
      await signIn(email, password)
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
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-6">
        <Image
          source={require('../../../assets/logo.png')}
          style={{ width: 192, height: 56, alignSelf: 'center', marginBottom: 24 }}
          resizeMode="contain"
        />
        <Text className="text-base text-center text-gray-500 mb-8">
          {t('auth.login')}
        </Text>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">
              {t('auth.email')}
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">
              {t('auth.password')}
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="Sua senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          {error ? (
            <Text className="text-sm text-red-600">{error}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="bg-blue-600 rounded-lg py-3.5 items-center mt-2"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                {t('auth.login')}
              </Text>
            )}
          </TouchableOpacity>

          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity className="items-center py-2">
              <Text className="text-blue-600 text-sm">
                {t('auth.forgotPassword')}
              </Text>
            </TouchableOpacity>
          </Link>

          <View className="flex-row justify-center items-center gap-1 mt-4">
            <Text className="text-gray-500 text-sm">{t('auth.noAccount')}</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-blue-600 font-medium text-sm">
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
