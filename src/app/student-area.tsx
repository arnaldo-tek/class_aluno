import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { BannerCarousel } from '@/components/BannerCarousel'
import { useUnreadNotificationsCount } from '@/hooks/useNotifications'
import { useThemeColors } from '@/hooks/useThemeColors'

export default function StudentAreaScreen() {
  const router = useRouter()
  const colors = useThemeColors()
  const { data: unreadNotifications } = useUnreadNotificationsCount()

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-3">
        <TouchableOpacity onPress={() => router.back()} className="p-1 mr-3">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-darkText flex-1">Minha Área</Text>
        <TouchableOpacity onPress={() => router.push('/notifications')} className="relative p-1">
          <Ionicons name="notifications-outline" size={24} color={colors.textSecondary} />
          {(unreadNotifications ?? 0) > 0 && (
            <View className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-accent items-center justify-center">
              <Text className="text-[10px] font-bold text-darkText-inverse">{unreadNotifications}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="pt-4">
          <BannerCarousel />
        </View>

        {/* Grid of options */}
        <View className="flex-row flex-wrap justify-between px-4">
          <AreaCard icon="book" color="#3b82f6" label="Meus Cursos" onPress={() => router.push('/(tabs)/my-courses')} />
          <AreaCard icon="card" color="#f59e0b" label="Minhas Assinaturas" onPress={() => router.push('/packages/my')} />
          <AreaCard icon="musical-notes" color="#c084fc" label="Meus Áudio Cursos" onPress={() => router.push('/audio/my')} />
          <AreaCard icon="layers" color="#34d399" label="Meus Flashcards" onPress={() => router.push('/flashcards')} />
          <AreaCard icon="document-text" color="#60a5fa" label="Meus Editais" onPress={() => router.push('/notices/my')} />
          <AreaCard icon="newspaper" color="#fbbf24" label="Minhas Notícias" onPress={() => router.push('/news/my')} />
        </View>

        <View className="h-8 px-4" />
      </ScrollView>
    </SafeAreaView>
  )
}

function AreaCard({ icon, color, label, onPress }: {
  icon: string; color: string; label: string; onPress: () => void
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-dark-surface rounded-2xl p-4 mb-3 border border-darkBorder-subtle items-center justify-center"
      style={{ width: '48%', minHeight: 110 }}
      activeOpacity={0.7}
    >
      <View className="w-12 h-12 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: `${color}15` }}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text className="text-sm font-medium text-darkText text-center">{label}</Text>
    </TouchableOpacity>
  )
}
