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
      <View className="flex-1 bg-white justify-center items-center px-6">
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          {t('auth.resetSent')}
        </Text>
        <Text className="text-gray-500 text-center mb-6">
          Verifique sua caixa de entrada para redefinir a senha.
        </Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity>
            <Text className="text-blue-600 font-medium">{t('auth.login')}</Text>
          </TouchableOpacity>
        </Link>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-6">
        <Image
          source={require('../../../assets/logo.png')}
          className="w-48 h-14 self-center mb-6"
          resizeMode="contain"
        />
        <Text className="text-2xl font-bold text-center text-gray-900 mb-2">
          {t('auth.resetPassword')}
        </Text>
        <Text className="text-base text-center text-gray-500 mb-8">
          Informe seu e-mail para receber o link de recuperação.
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

          {error ? (
            <Text className="text-sm text-red-600">{error}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleReset}
            disabled={loading}
            className="bg-blue-600 rounded-lg py-3.5 items-center mt-2"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Enviar link
              </Text>
            )}
          </TouchableOpacity>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity className="items-center py-2">
              <Text className="text-blue-600 text-sm">{t('common.back')}</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
