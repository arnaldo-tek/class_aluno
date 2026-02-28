import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthContext } from '@/contexts/AuthContext'
import { useProfile, useUpdateProfile, useUploadAvatar } from '@/hooks/useProfile'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { t } from '@/i18n'

export default function EditProfileScreen() {
  const router = useRouter()
  const { user } = useAuthContext()
  const { data: profile, isLoading } = useProfile(user?.id)
  const updateProfile = useUpdateProfile()
  const uploadAvatar = useUploadAvatar()

  const [displayName, setDisplayName] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  if (isLoading) return <LoadingSpinner />

  if (profile && !initialized) {
    setDisplayName(profile.display_name ?? '')
    setPhotoUrl(profile.photo_url ?? null)
    setInitialized(true)
  }

  async function handleChangePhoto() {
    try {
      const url = await uploadAvatar.mutateAsync()
      if (url) setPhotoUrl(url)
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message)
    }
  }

  async function handleSave() {
    try {
      await updateProfile.mutateAsync({
        display_name: displayName.trim(),
        photo_url: photoUrl,
      })
      Alert.alert('', t('profile.profileSaved'))
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
          {t('profile.editProfile')}
        </Text>
      </View>

      <View className="flex-1 px-4 pt-6">
        {/* Avatar */}
        <View className="items-center mb-8">
          <TouchableOpacity onPress={handleChangePhoto} className="relative">
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} className="w-24 h-24 rounded-full" />
            ) : (
              <View className="w-24 h-24 bg-primary-50 rounded-full items-center justify-center">
                <Text className="text-3xl text-primary-light font-bold">
                  {(displayName || 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full items-center justify-center">
              <Ionicons name="camera" size={16} color="#1a1a2e" />
            </View>
          </TouchableOpacity>
          {uploadAvatar.isPending && (
            <Text className="text-xs text-darkText-muted mt-2">{t('common.loading')}</Text>
          )}
        </View>

        {/* Name */}
        <Text className="text-sm font-medium text-darkText-secondary mb-2">{t('auth.name')}</Text>
        <TextInput
          className="bg-dark-surfaceLight border border-darkBorder rounded-2xl px-4 py-3.5 text-base text-darkText mb-6"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={t('auth.name')}
          placeholderTextColor="#9ca3af"
        />

        {/* Email (read-only) */}
        <Text className="text-sm font-medium text-darkText-secondary mb-2">{t('auth.email')}</Text>
        <View className="bg-dark-elevated border border-darkBorder rounded-2xl px-4 py-3.5 mb-6">
          <Text className="text-base text-darkText-muted">{user?.email}</Text>
        </View>

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={updateProfile.isPending}
          className="bg-primary rounded-2xl py-4 items-center"
        >
          <Text className="text-darkText-inverse font-bold text-base">
            {updateProfile.isPending ? t('common.loading') : t('common.save')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
