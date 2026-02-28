import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useUnreadNotificationsCount } from '@/hooks/useNotifications'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

export default function NotificationsScreen() {
  const router = useRouter()
  const { data: notifications, isLoading } = useNotifications()
  const { data: unreadCount } = useUnreadNotificationsCount()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  function formatTime(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Agora'
    if (diffMin < 60) return `${diffMin}min`
    const diffHrs = Math.floor(diffMin / 60)
    if (diffHrs < 24) return `${diffHrs}h`
    const diffDays = Math.floor(diffHrs / 24)
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 flex-1">Notificações</Text>
        {(unreadCount ?? 0) > 0 && (
          <TouchableOpacity
            onPress={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <Text className="text-sm font-medium text-blue-600">Marcar todas</Text>
          </TouchableOpacity>
        )}
      </View>

      {!notifications || notifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="Nenhuma notificação"
          description="Você será notificado sobre novidades e atualizações"
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                if (!item.is_read) markRead.mutate(item.id)
              }}
              className={`flex-row px-4 py-3.5 border-b border-gray-50 ${
                !item.is_read ? 'bg-blue-50/50' : ''
              }`}
            >
              {/* Icon */}
              <View className={`w-10 h-10 rounded-full items-center justify-center ${
                !item.is_read ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <Ionicons
                  name="notifications"
                  size={18}
                  color={!item.is_read ? '#2563eb' : '#9ca3af'}
                />
              </View>

              {/* Content */}
              <View className="flex-1 ml-3">
                <View className="flex-row items-start justify-between">
                  <Text
                    className={`text-sm flex-1 mr-2 ${
                      !item.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
                    }`}
                    numberOfLines={1}
                  >
                    {item.titulo ?? 'Notificação'}
                  </Text>
                  <Text className="text-xs text-gray-400">{formatTime(item.created_at ?? '')}</Text>
                </View>
                {item.descricao && (
                  <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={2}>
                    {item.descricao}
                  </Text>
                )}
              </View>

              {/* Unread dot */}
              {!item.is_read && (
                <View className="w-2.5 h-2.5 rounded-full bg-blue-600 ml-2 mt-1" />
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}
