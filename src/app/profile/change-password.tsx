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
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900 flex-1">
          {t('profile.changePassword')}
        </Text>
      </View>

      <View className="flex-1 px-4 pt-6">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          {t('profile.newPassword')}
        </Text>
        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-4"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder={t('profile.newPassword')}
          placeholderTextColor="#9ca3af"
          secureTextEntry
        />

        <Text className="text-sm font-medium text-gray-700 mb-2">
          {t('profile.confirmPassword')}
        </Text>
        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-6"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder={t('profile.confirmPassword')}
          placeholderTextColor="#9ca3af"
          secureTextEntry
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={changePassword.isPending}
          className="bg-blue-600 rounded-xl py-4 items-center"
        >
          <Text className="text-white font-bold text-base">
            {changePassword.isPending ? t('common.loading') : t('common.save')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
