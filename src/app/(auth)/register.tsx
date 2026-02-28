import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ActivityIndicator, ScrollView, Image, Alert,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { signUp } from '@/lib/auth'
import { t } from '@/i18n'

export default function RegisterScreen() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleRegister() {
    if (!name || !email || !password) return
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }
    setError('')
    setLoading(true)

    try {
      const data = await signUp(email, password, name)
      // Se o Supabase retornou sessão, o email não precisa de confirmação
      if (data.session) {
        router.replace('/(tabs)/home')
      } else {
        // Email de confirmação enviado — informar o usuário
        Alert.alert(
          'Verifique seu email',
          'Enviamos um link de confirmação para o seu email. Confirme para acessar o app.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.registerError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-12">
        <Image
          source={require('../../../assets/logo.png')}
          style={{ width: 192, height: 56, alignSelf: 'center', marginBottom: 24 }}
          resizeMode="contain"
        />
        <Text className="text-base text-center text-gray-500 mb-8">
          {t('auth.register')}
        </Text>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">
              {t('auth.name')}
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="Seu nome completo"
              value={name}
              onChangeText={setName}
              autoComplete="name"
            />
          </View>

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
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">
              {t('auth.confirmPassword')}
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="Confirme sua senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          {error ? (
            <Text className="text-sm text-red-600">{error}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            className="bg-blue-600 rounded-lg py-3.5 items-center mt-2"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                {t('auth.register')}
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center gap-1 mt-4">
            <Text className="text-gray-500 text-sm">{t('auth.hasAccount')}</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-blue-600 font-medium text-sm">
                  {t('auth.login')}
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
