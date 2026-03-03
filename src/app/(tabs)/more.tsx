import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColors } from '@/hooks/useThemeColors'
import { t } from '@/i18n'

export default function MoreScreen() {
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="px-4 pt-4 pb-3">
        <Text className="text-2xl font-bold text-darkText">Mais</Text>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="bg-dark-surface rounded-2xl overflow-hidden mb-4">
          <MenuItem
            icon="newspaper-outline"
            iconColor="#fbbf24"
            label={t('news.title')}
            onPress={() => router.push('/news')}
          />
          <MenuItem
            icon="document-text-outline"
            iconColor="#60a5fa"
            label={t('notices.title')}
            onPress={() => router.push('/notices')}
          />
          <MenuItem
            icon="musical-notes-outline"
            iconColor="#c084fc"
            label={t('audio.title')}
            onPress={() => router.push('/audio')}
          />
          <MenuItem
            icon="people-outline"
            iconColor="#34d399"
            label={t('community.title')}
            onPress={() => router.push('/community')}
            last
          />
        </View>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  )
}

function MenuItem({ icon, iconColor, label, last, onPress }: {
  icon: string
  iconColor: string
  label: string
  last?: boolean
  onPress?: () => void
}) {
  const colors = useThemeColors()
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center px-4 py-4 ${last ? '' : 'border-b border-darkBorder-subtle'}`}
      activeOpacity={0.6}
    >
      <View className="w-10 h-10 rounded-xl bg-dark-surfaceLight items-center justify-center mr-3">
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <Text className="flex-1 text-base font-medium text-darkText">{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  )
}
