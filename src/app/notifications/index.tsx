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
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center px-4 py-3 border-b border-darkBorder-subtle">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-darkText flex-1">Notificacoes</Text>
        {(unreadCount ?? 0) > 0 && (
          <TouchableOpacity
            onPress={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <Text className="text-sm font-semibold text-accent">Marcar todas</Text>
          </TouchableOpacity>
        )}
      </View>

      {!notifications || notifications.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="notifications-outline" size={48} color="#9ca3af" />}
          title="Nenhuma notificacao"
          description="Voce sera notificado sobre novidades e atualizacoes"
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
              className={`flex-row px-4 py-4 border-b border-darkBorder-subtle ${
                !item.is_read ? 'bg-primary-50' : ''
              }`}
            >
              <View className={`w-10 h-10 rounded-full items-center justify-center ${
                !item.is_read ? 'bg-primary-200' : 'bg-dark-surfaceLight'
              }`}>
                <Ionicons
                  name="notifications"
                  size={18}
                  color={!item.is_read ? '#60a5fa' : '#9ca3af'}
                />
              </View>

              <View className="flex-1 ml-3">
                <View className="flex-row items-start justify-between">
                  <Text
                    className={`text-sm flex-1 mr-2 ${
                      !item.is_read ? 'font-bold text-darkText' : 'font-medium text-darkText-secondary'
                    }`}
                    numberOfLines={1}
                  >
                    {item.titulo ?? 'Notificacao'}
                  </Text>
                  <Text className="text-xs text-darkText-muted">{formatTime(item.created_at ?? '')}</Text>
                </View>
                {item.descricao && (
                  <Text className="text-sm text-darkText-muted mt-0.5" numberOfLines={2}>
                    {item.descricao}
                  </Text>
                )}
              </View>

              {!item.is_read && (
                <View className="w-2.5 h-2.5 rounded-full bg-accent ml-2 mt-1" />
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}
