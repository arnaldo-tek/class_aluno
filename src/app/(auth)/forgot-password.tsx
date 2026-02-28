import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ActivityIndicator, Image,
} from 'react-native'
import { Link } from 'expo-router'
import { resetPassword } from '@/lib/auth'
import { t } from '@/i18n'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset() {
    if (!email) return
    setError('')
    setLoading(true)

    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar e-mail')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <View className="flex-1 bg-dark-bg justify-center items-center px-6">
        <Text className="text-2xl font-bold text-darkText mb-4">
          {t('auth.resetSent')}
        </Text>
        <Text className="text-darkText-secondary text-center mb-6">
          Verifique sua caixa de entrada para redefinir a senha.
        </Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity>
            <Text className="text-accent font-semibold">{t('auth.login')}</Text>
          </TouchableOpacity>
        </Link>
      </View>
    )
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
        <Text className="text-2xl font-bold text-center text-darkText mb-2">
          {t('auth.resetPassword')}
        </Text>
        <Text className="text-base text-center text-darkText-secondary mb-8">
          Informe seu e-mail para receber o link de recuperacao.
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

          {error ? (
            <Text className="text-sm text-error">{error}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleReset}
            disabled={loading}
            className="bg-primary rounded-2xl py-4 items-center mt-2"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">
                Enviar link
              </Text>
            )}
          </TouchableOpacity>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity className="items-center py-2">
              <Text className="text-primary-light text-sm">{t('common.back')}</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
