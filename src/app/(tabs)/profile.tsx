import { View, Text, TouchableOpacity, Image, ScrollView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthContext } from '@/contexts/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { useDownloadCount } from '@/hooks/useDownloads'
import { signOut } from '@/lib/auth'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { t } from '@/i18n'

export default function ProfileScreen() {
  const { user } = useAuthContext()
  const { data: profile } = useProfile(user?.id)
  const { data: downloadCount = 0 } = useDownloadCount()
  const router = useRouter()

  const displayName = profile?.display_name ?? user?.user_metadata?.display_name ?? 'Usuario'
  const photoUrl = profile?.photo_url ?? null

  async function handleLogout() {
    await signOut()
    router.replace('/(auth)/login')
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-darkText mb-6">
          {t('profile.title')}
        </Text>

        {/* Avatar + info */}
        <View className="items-center mb-6 bg-dark-surface rounded-2xl py-6 px-4">
          {photoUrl ? (
            <View className="rounded-full border-2 border-accent/40">
              <Image source={{ uri: photoUrl }} className="w-20 h-20 rounded-full" />
            </View>
          ) : (
            <View className="w-20 h-20 bg-primary-50 rounded-full items-center justify-center border-2 border-accent/40">
              <Text className="text-2xl text-primary-light font-bold">
                {displayName[0].toUpperCase()}
              </Text>
            </View>
          )}
          <Text className="text-lg font-semibold text-darkText mt-3">{displayName}</Text>
          <Text className="text-sm text-darkText-secondary">{user?.email}</Text>
        </View>

        {/* Menu items - Content */}
        <View className="bg-dark-surface rounded-2xl overflow-hidden mb-4">
          <MenuItem icon="person-outline" iconColor="#60a5fa" label={t('profile.editProfile')} onPress={() => router.push('/profile/edit')} />
          <MenuItem icon="cart-outline" iconColor="#60a5fa" label={t('profile.myPurchases')} onPress={() => router.push('/purchases')} />
          <MenuItem icon="cube-outline" iconColor="#60a5fa" label={t('packages.title')} onPress={() => router.push('/packages')} />
          <MenuItem icon="heart-outline" iconColor="#f87171" label={t('profile.favorites')} onPress={() => router.push('/favorites')} />
          <MenuItem icon="layers-outline" iconColor="#fbbf24" label="Flashcards" onPress={() => router.push('/flashcards')} />
          <MenuItem icon="chatbubbles-outline" iconColor="#34d399" label="Conversas" onPress={() => router.push('/chat')} last />
        </View>

        {/* Menu items - Media */}
        <View className="bg-dark-surface rounded-2xl overflow-hidden mb-4">
          {Platform.OS !== 'web' && (
            <MenuItem icon="cloud-download-outline" iconColor="#2563eb" label={t('downloads')} badge={downloadCount > 0 ? downloadCount : undefined} onPress={() => router.push('/downloads')} />
          )}
          <MenuItem icon="musical-notes-outline" iconColor="#c084fc" label={t('audio.title')} onPress={() => router.push('/audio')} />
          <MenuItem icon="newspaper-outline" iconColor="#fbbf24" label={t('news.title')} onPress={() => router.push('/news')} />
          <MenuItem icon="document-text-outline" iconColor="#60a5fa" label={t('notices.title')} onPress={() => router.push('/notices')} />
          <MenuItem icon="people-outline" iconColor="#34d399" label={t('community.title')} onPress={() => router.push('/community')} last />
        </View>

        {/* Menu items - Discover */}
        <View className="bg-dark-surface rounded-2xl overflow-hidden mb-4">
          <MenuItem icon="school-outline" iconColor="#c084fc" label="Todos os professores" onPress={() => router.push('/professors')} last />
        </View>

        {/* Menu items - Settings */}
        <View className="bg-dark-surface rounded-2xl overflow-hidden mb-4">
          <MenuItem icon="notifications-outline" iconColor="#fbbf24" label="Notificacoes" onPress={() => router.push('/notifications')} />
          <MenuItem icon="bulb-outline" iconColor="#fbbf24" label="Enviar sugestao" onPress={() => router.push('/suggestion')} />
          <MenuItem icon="help-circle-outline" iconColor="#6b7280" label={t('faq.title')} onPress={() => router.push('/faq')} />
          <MenuItem icon="settings-outline" iconColor="#6b7280" label={t('profile.settings')} onPress={() => router.push('/settings')} />
          <MenuItem icon="document-outline" iconColor="#6b7280" label={t('terms.title')} onPress={() => router.push('/terms')} />
          <MenuItem icon="headset-outline" iconColor="#60a5fa" label={t('profile.support')} onPress={() => router.push('/support')} last />
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          className="mb-8 bg-error-dark rounded-2xl py-3.5 flex-row items-center justify-center"
        >
          <Ionicons name="log-out-outline" size={20} color="#f87171" />
          <Text className="text-error font-semibold ml-2">{t('auth.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

function MenuItem({ icon, iconColor, label, last, badge, onPress }: { icon: string; iconColor: string; label: string; last?: boolean; badge?: number; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} className={`flex-row items-center px-4 py-3.5 ${last ? '' : 'border-b border-darkBorder-subtle'}`}>
      <View className="w-8 h-8 rounded-lg bg-dark-surfaceLight items-center justify-center mr-3">
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <Text className="flex-1 text-base text-darkText">{label}</Text>
      {badge != null && badge > 0 && (
        <View className="bg-primary rounded-full min-w-[20px] h-5 items-center justify-center px-1.5 mr-2">
          <Text className="text-xs text-white font-bold">{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
    </TouchableOpacity>
  )
}
