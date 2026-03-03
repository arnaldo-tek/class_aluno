import { View, Text, TouchableOpacity, Image, ScrollView, Modal, Pressable, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthContext } from '@/contexts/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { signOut } from '@/lib/auth'
import { t } from '@/i18n'
import { useThemeColors } from '@/hooks/useThemeColors'

interface DrawerMenuProps {
  visible: boolean
  onClose: () => void
}

export function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const { user } = useAuthContext()
  const { data: profile } = useProfile(user?.id)
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const displayName = profile?.display_name ?? user?.user_metadata?.display_name ?? 'Usuário'
  const photoUrl = profile?.photo_url ?? null

  function navigateTo(path: string) {
    onClose()
    setTimeout(() => router.push(path as any), 150)
  }

  async function handleLogout() {
    onClose()
    await signOut()
    router.replace('/(auth)/login')
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 flex-row">
        {/* Drawer panel */}
        <View
          className="bg-white w-[80%] max-w-[320px] shadow-2xl"
          style={{ paddingTop: insets.top }}
        >
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Avatar section */}
            <View className="px-5 py-6 border-b border-gray-100">
              <View className="flex-row items-center">
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} className="w-14 h-14 rounded-full" />
                ) : (
                  <View className="w-14 h-14 rounded-full bg-primary-50 items-center justify-center">
                    <Text className="text-xl font-bold text-primary-light">
                      {displayName[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <View className="ml-3 flex-1">
                  <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text className="text-sm text-gray-500" numberOfLines={1}>
                    {user?.email}
                  </Text>
                </View>
              </View>
            </View>

            {/* Menu items */}
            <View className="py-2">
              <DrawerItem icon="cart-outline" label={t('profile.myPurchases')} onPress={() => navigateTo('/purchases')} />
              <DrawerItem icon="person-outline" label={t('profile.editProfile')} onPress={() => navigateTo('/profile/edit')} />
              <DrawerItem icon="notifications-outline" label="Notificações" onPress={() => navigateTo('/notifications')} />
              <DrawerItem icon="bulb-outline" label="Enviar sugestão" onPress={() => navigateTo('/suggestion')} />
              <DrawerItem icon="help-circle-outline" label={t('faq.title')} onPress={() => navigateTo('/faq')} />
              <DrawerItem icon="settings-outline" label={t('profile.settings')} onPress={() => navigateTo('/settings')} />
              <DrawerItem icon="document-outline" label={t('terms.title')} onPress={() => navigateTo('/terms')} />
              <DrawerItem icon="headset-outline" label={t('profile.support')} onPress={() => navigateTo('/support')} />
            </View>

            {/* Logout */}
            <View className="border-t border-gray-100 py-2 px-4">
              <TouchableOpacity
                onPress={handleLogout}
                className="flex-row items-center py-3 px-2"
                activeOpacity={0.6}
              >
                <Ionicons name="log-out-outline" size={20} color="#dc2626" />
                <Text className="text-base font-medium text-red-600 ml-3">{t('auth.logout')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Backdrop */}
        <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      </View>
    </Modal>
  )
}

function DrawerItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const colors = useThemeColors()
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center px-5 py-3.5"
      activeOpacity={0.6}
    >
      <Ionicons name={icon as any} size={20} color={colors.textSecondary} />
      <Text className="text-base text-gray-800 ml-3 flex-1">{label}</Text>
      <Ionicons name="chevron-forward" size={14} color="#d1d5db" />
    </TouchableOpacity>
  )
}
