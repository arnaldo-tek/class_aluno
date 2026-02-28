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
      setError('As senhas nao coincidem')
      return
    }
    setError('')
    setLoading(true)

    try {
      const data = await signUp(email, password, name)
      if (data.session) {
        router.replace('/(tabs)/home')
      } else {
        if (Platform.OS === 'web') {
          alert('Verifique seu email: Enviamos um link de confirmação para o seu email. Confirme para acessar o app.')
        } else {
          Alert.alert(
            'Verifique seu email',
            'Enviamos um link de confirmacao para o seu email. Confirme para acessar o app.',
          )
        }
        router.replace('/(auth)/login')
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
      className="flex-1 bg-dark-bg"
    >
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-12">
        <Image
          source={require('../../../assets/logo.png')}
          style={{ width: 192, height: 56, alignSelf: 'center', marginBottom: 24 }}
          resizeMode="contain"
        />
        <Text className="text-base text-center text-darkText-secondary mb-8">
          {t('auth.register')}
        </Text>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-darkText-secondary mb-1.5">
              {t('auth.name')}
            </Text>
            <TextInput
              className="bg-dark-surfaceLight border border-darkBorder rounded-2xl px-4 py-3.5 text-base text-darkText"
              placeholder="Seu nome completo"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
              autoComplete="name"
            />
          </View>

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
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-darkText-secondary mb-1.5">
              {t('auth.confirmPassword')}
            </Text>
            <TextInput
              className="bg-dark-surfaceLight border border-darkBorder rounded-2xl px-4 py-3.5 text-base text-darkText"
              placeholder="Confirme sua senha"
              placeholderTextColor="#9ca3af"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          {error ? (
            <Text className="text-sm text-error">{error}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            className="bg-primary rounded-2xl py-4 items-center mt-2"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">
                {t('auth.register')}
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center gap-1 mt-4">
            <Text className="text-darkText-muted text-sm">{t('auth.hasAccount')}</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-accent font-semibold text-sm">
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
