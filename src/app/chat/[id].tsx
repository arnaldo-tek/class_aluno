import { useState, useRef, useEffect } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useChatMessages, useSendMessage, useMarkChatSeen } from '@/hooks/useChat'
import { useAuthContext } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function ChatScreen() {
  const { id, name, photo } = useLocalSearchParams<{ id: string; name: string; photo: string }>()
  const router = useRouter()
  const { user } = useAuthContext()
  const { data: messages, isLoading } = useChatMessages(id!)
  const sendMessage = useSendMessage()
  const markSeen = useMarkChatSeen()

  const [text, setText] = useState('')
  const flatListRef = useRef<FlatList>(null)

  // Mark chat as seen when entering
  useEffect(() => {
    if (id) markSeen.mutate(id)
  }, [id])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages?.length])

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || !id) return
    setText('')
    sendMessage.mutate({ chatId: id, text: trimmed })
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  function formatDateSeparator(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return 'Ontem'
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  // Group messages by date
  function getDateKey(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  if (isLoading) return <LoadingSpinner />

  // Build flat list data with date separators
  const listData: Array<{ type: 'separator'; date: string } | { type: 'message'; item: any }> = []
  let lastDate = ''
  for (const msg of messages ?? []) {
    const dateKey = getDateKey(msg.created_at ?? '')
    if (dateKey !== lastDate) {
      listData.push({ type: 'separator', date: msg.created_at ?? '' })
      lastDate = dateKey
    }
    listData.push({ type: 'message', item: msg })
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        {photo ? (
          <Image source={{ uri: photo }} className="w-9 h-9 rounded-full" />
        ) : (
          <View className="w-9 h-9 rounded-full bg-blue-100 items-center justify-center">
            <Text className="text-sm font-bold text-blue-600">
              {(name ?? 'U')[0].toUpperCase()}
            </Text>
          </View>
        )}
        <Text className="text-base font-semibold text-gray-900 ml-2">{name ?? 'Chat'}</Text>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={listData}
          keyExtractor={(item, index) => item.type === 'separator' ? `sep-${index}` : item.item.id}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingVertical: 12 }}
          renderItem={({ item: entry }) => {
            if (entry.type === 'separator') {
              return (
                <View className="items-center my-3">
                  <Text className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    {formatDateSeparator(entry.date)}
                  </Text>
                </View>
              )
            }

            const msg = entry.item
            const isMine = msg.user_id === user?.id

            return (
              <View className={`mb-2 ${isMine ? 'items-end' : 'items-start'}`}>
                <View
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl ${
                    isMine
                      ? 'bg-blue-600 rounded-br-md'
                      : 'bg-white rounded-bl-md border border-gray-100'
                  }`}
                >
                  {msg.image && (
                    <Image
                      source={{ uri: msg.image }}
                      className="w-48 h-48 rounded-xl mb-1"
                      resizeMode="cover"
                    />
                  )}
                  {msg.text && (
                    <Text className={`text-sm ${isMine ? 'text-white' : 'text-gray-900'}`}>
                      {msg.text}
                    </Text>
                  )}
                  <Text className={`text-[10px] mt-1 ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                    {formatTime(msg.created_at)}
                  </Text>
                </View>
              </View>
            )
          }}
        />

        {/* Input */}
        <View className="flex-row items-end px-4 py-2 bg-white border-t border-gray-100">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Escreva uma mensagem..."
            placeholderTextColor="#9ca3af"
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-900 max-h-24"
            multiline
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            className={`ml-2 w-10 h-10 rounded-full items-center justify-center ${
              text.trim() ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <Ionicons name="send" size={18} color={text.trim() ? 'white' : '#9ca3af'} />
          </TouchableOpacity>
        </View>
        <SafeAreaView edges={['bottom']} className="bg-white" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
