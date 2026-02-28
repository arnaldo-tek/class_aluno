import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useChats } from '@/hooks/useChat'
import { useAuthContext } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { t } from '@/i18n'

export default function ChatListScreen() {
  const router = useRouter()
  const { user } = useAuthContext()
  const { data: chats, isLoading } = useChats()

  function getOtherUser(chat: any) {
    const isUserA = chat.user_a === user?.id
    const profile = isUserA ? chat.user_b_profile : chat.user_a_profile
    return {
      id: isUserA ? chat.user_b : chat.user_a,
      name: profile?.display_name ?? 'Usuário',
      photo: profile?.photo_url ?? null,
    }
  }

  function formatTime(dateStr: string | null) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' })
    }
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
        <Text className="text-xl font-bold text-gray-900 flex-1">Conversas</Text>
      </View>

      {!chats || chats.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="Nenhuma conversa"
          description="Inicie uma conversa com um professor pelo perfil dele"
        />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const other = getOtherUser(item)
            const isUnread = !item.message_seen && item.last_message_sent_by !== user?.id

            return (
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id, name: other.name, photo: other.photo ?? '' } })}
                className="flex-row items-center px-4 py-3 border-b border-gray-50"
              >
                {/* Avatar */}
                {other.photo ? (
                  <Image source={{ uri: other.photo }} className="w-12 h-12 rounded-full" />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center">
                    <Text className="text-lg font-bold text-blue-600">
                      {other.name[0].toUpperCase()}
                    </Text>
                  </View>
                )}

                {/* Content */}
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center justify-between">
                    <Text className={`text-base ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>
                      {other.name}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      {formatTime(item.last_message_time)}
                    </Text>
                  </View>
                  <View className="flex-row items-center mt-0.5">
                    <Text
                      className={`text-sm flex-1 ${isUnread ? 'font-semibold text-gray-800' : 'text-gray-500'}`}
                      numberOfLines={1}
                    >
                      {item.last_message ?? 'Nenhuma mensagem ainda'}
                    </Text>
                    {isUnread && (
                      <View className="w-2.5 h-2.5 rounded-full bg-blue-600 ml-2" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}
