import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useUnreadNotificationsCount } from '@/hooks/useNotifications'

const ICON_COLOR = '#1f2937'

interface TopBarProps {
  title?: string
  onMenuPress: () => void
}

export function TopBar({ title = 'Superclasse', onMenuPress }: TopBarProps) {
  const router = useRouter()
  const { data: unreadNotifications } = useUnreadNotificationsCount()

  return (
    <View style={{ backgroundColor: '#fef200' }} className="px-4 pt-14 pb-3 flex-row items-center">
      <TouchableOpacity onPress={onMenuPress} className="p-1 mr-3">
        <Ionicons name="menu" size={26} color={ICON_COLOR} />
      </TouchableOpacity>
      <Text className="text-xl font-bold text-gray-900 flex-1">{title}</Text>
      <TouchableOpacity
        onPress={() => router.push('/student-area' as any)}
        className="bg-white/90 rounded-full px-3.5 py-1.5 mr-3 border border-gray-800"
        activeOpacity={0.7}
      >
        <Text className="text-xs font-bold text-gray-800">Aluno</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/notifications')} className="relative p-1">
        <Ionicons name="notifications-outline" size={24} color={ICON_COLOR} />
        {(unreadNotifications ?? 0) > 0 && (
          <View className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 items-center justify-center">
            <Text className="text-[10px] font-bold text-white">{unreadNotifications}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  )
}
