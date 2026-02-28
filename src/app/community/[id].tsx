import { useState, useRef, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, Image, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { useCommunityMessages, useSendCommunityMessage, useCommunityDetail } from '@/hooks/useCommunity'
import { useAuthContext } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { t } from '@/i18n'

export default function CommunityChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuthContext()
  const { data: community } = useCommunityDetail(id!)
  const { data: messages, isLoading } = useCommunityMessages(id!)
  const sendMessage = useSendCommunityMessage()

  const [text, setText] = useState('')
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    if (messages?.length) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages?.length])

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed) return

    setText('')
    sendMessage.mutate({ comunidadeId: id!, texto: trimmed })
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900 flex-1" numberOfLines={1}>
          {community?.nome ?? t('community.title')}
        </Text>
        {community?.regras && (
          <TouchableOpacity onPress={() => router.push(`/community/rules/${id}`)}>
            <Ionicons name="information-circle-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isMe = item.user_id === user?.id
            const profile = (item as any).profiles
            return (
              <View className={`mb-3 max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}>
                {!isMe && (
                  <View className="flex-row items-center mb-1">
                    {profile?.photo_url ? (
                      <Image source={{ uri: profile.photo_url }} className="w-5 h-5 rounded-full mr-1" />
                    ) : null}
                    <Text className="text-xs text-gray-500 font-medium">
                      {profile?.display_name ?? 'Usuário'}
                    </Text>
                  </View>
                )}
                <View className={`rounded-2xl px-4 py-2.5 ${isMe ? 'bg-blue-600' : 'bg-white border border-gray-100'}`}>
                  <Text className={`text-sm ${isMe ? 'text-white' : 'text-gray-900'}`}>
                    {item.texto}
                  </Text>
                </View>
                <Text className={`text-[10px] mt-0.5 ${isMe ? 'text-right text-gray-400' : 'text-gray-400'}`}>
                  {format(new Date(item.created_at), 'HH:mm')}
                </Text>
              </View>
            )
          }}
        />

        {/* Input */}
        <View className="flex-row items-center px-4 py-3 bg-white border-t border-gray-100">
          <TextInput
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-base text-gray-900 mr-3"
            placeholder={t('community.sendMessage')}
            placeholderTextColor="#9ca3af"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            className="w-10 h-10 bg-blue-600 rounded-full items-center justify-center"
          >
            <Ionicons name="send" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
