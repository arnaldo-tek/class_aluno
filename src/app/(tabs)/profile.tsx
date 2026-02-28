import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthContext } from '@/contexts/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { signOut } from '@/lib/auth'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { t } from '@/i18n'

export default function ProfileScreen() {
  const { user } = useAuthContext()
  const { data: profile } = useProfile(user?.id)
  const router = useRouter()

  const displayName = profile?.display_name ?? user?.user_metadata?.display_name ?? 'Usuário'
  const photoUrl = profile?.photo_url ?? null

  async function handleLogout() {
    await signOut()
    router.replace('/(auth)/login')
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-gray-900 mb-6">
          {t('profile.title')}
        </Text>

        {/* Avatar + info */}
        <View className="items-center mb-6 bg-white rounded-2xl py-6 px-4">
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} className="w-20 h-20 rounded-full mb-3" />
          ) : (
            <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-3">
              <Text className="text-2xl text-blue-600 font-bold">
                {displayName[0].toUpperCase()}
              </Text>
            </View>
          )}
          <Text className="text-lg font-semibold text-gray-900">{displayName}</Text>
          <Text className="text-sm text-gray-500">{user?.email}</Text>
        </View>

        {/* Menu items */}
        <View className="bg-white rounded-2xl overflow-hidden mb-4">
          <MenuItem icon="person-outline" label={t('profile.editProfile')} onPress={() => router.push('/profile/edit')} />
          <MenuItem icon="cart-outline" label={t('profile.myPurchases')} onPress={() => router.push('/purchases')} />
          <MenuItem icon="cube-outline" label={t('packages.title')} onPress={() => router.push('/packages')} />
          <MenuItem icon="heart-outline" label={t('profile.favorites')} onPress={() => router.push('/favorites')} />
          <MenuItem icon="layers-outline" label="Flashcards" onPress={() => router.push('/flashcards')} />
          <MenuItem icon="chatbubbles-outline" label="Conversas" onPress={() => router.push('/chat')} last />
        </View>

        <View className="bg-white rounded-2xl overflow-hidden mb-4">
          <MenuItem icon="musical-notes-outline" label={t('audio.title')} onPress={() => router.push('/audio')} />
          <MenuItem icon="newspaper-outline" label={t('news.title')} onPress={() => router.push('/news')} />
          <MenuItem icon="document-text-outline" label={t('notices.title')} onPress={() => router.push('/notices')} />
          <MenuItem icon="people-outline" label={t('community.title')} onPress={() => router.push('/community')} last />
        </View>

        <View className="bg-white rounded-2xl overflow-hidden mb-4">
          <MenuItem icon="notifications-outline" label="Notificações" onPress={() => router.push('/notifications')} />
          <MenuItem icon="help-circle-outline" label={t('faq.title')} onPress={() => router.push('/faq')} />
          <MenuItem icon="settings-outline" label={t('profile.settings')} onPress={() => router.push('/settings')} />
          <MenuItem icon="document-outline" label={t('terms.title')} onPress={() => router.push('/terms')} />
          <MenuItem icon="headset-outline" label={t('profile.support')} onPress={() => router.push('/support')} last />
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          className="mb-8 bg-red-50 rounded-2xl py-3.5 flex-row items-center justify-center"
        >
          <Ionicons name="log-out-outline" size={20} color="#dc2626" />
          <Text className="text-red-600 font-semibold ml-2">{t('auth.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

function MenuItem({ icon, label, last, onPress }: { icon: string; label: string; last?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} className={`flex-row items-center px-4 py-3.5 ${last ? '' : 'border-b border-gray-50'}`}>
      <Ionicons name={icon as any} size={20} color="#6b7280" />
      <Text className="flex-1 text-base text-gray-900 ml-3">{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
    </TouchableOpacity>
  )
}
