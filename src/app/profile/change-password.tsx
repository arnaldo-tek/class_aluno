import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useChangePassword } from '@/hooks/useProfile'
import { t } from '@/i18n'

export default function ChangePasswordScreen() {
  const router = useRouter()
  const changePassword = useChangePassword()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  async function handleSubmit() {
    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), 'A senha deve ter pelo menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('profile.passwordMismatch'))
      return
    }

    try {
      await changePassword.mutateAsync(newPassword)
      Alert.alert('', t('profile.passwordChanged'))
      router.back()
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder bg-dark-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-darkText flex-1">
          {t('profile.changePassword')}
        </Text>
      </View>

      <View className="flex-1 px-4 pt-6">
        <Text className="text-sm font-medium text-darkText-secondary mb-2">
          {t('profile.newPassword')}
        </Text>
        <TextInput
          className="bg-dark-surfaceLight border border-darkBorder rounded-2xl px-4 py-3.5 text-base text-darkText mb-4"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder={t('profile.newPassword')}
          placeholderTextColor="#9ca3af"
          secureTextEntry
        />

        <Text className="text-sm font-medium text-darkText-secondary mb-2">
          {t('profile.confirmPassword')}
        </Text>
        <TextInput
          className="bg-dark-surfaceLight border border-darkBorder rounded-2xl px-4 py-3.5 text-base text-darkText mb-6"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder={t('profile.confirmPassword')}
          placeholderTextColor="#9ca3af"
          secureTextEntry
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={changePassword.isPending}
          className="bg-primary rounded-2xl py-4 items-center"
        >
          <Text className="text-darkText-inverse font-bold text-base">
            {changePassword.isPending ? t('common.loading') : t('common.save')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
