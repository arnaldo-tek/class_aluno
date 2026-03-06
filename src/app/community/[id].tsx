import { useState, useRef, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, Image, KeyboardAvoidingView, Platform, Modal, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { useCommunityMessages, useSendCommunityMessage, useCommunityDetail, useIsMember, useToggleMembership, useCommunityNickname, useSetCommunityNickname } from '@/hooks/useCommunity'
import { useAuthContext } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { t } from '@/i18n'
import { useThemeColors } from '@/hooks/useThemeColors'

export default function CommunityChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuthContext()
  const { data: community } = useCommunityDetail(id!)
  const { data: messages, isLoading } = useCommunityMessages(id!)
  const sendMessage = useSendCommunityMessage()
  const { data: isMember } = useIsMember(id!)
  const toggleMembership = useToggleMembership()
  const { data: nickname } = useCommunityNickname()
  const setNickname = useSetCommunityNickname()
  const colors = useThemeColors()

  const [text, setText] = useState('')
  const [showNicknameModal, setShowNicknameModal] = useState(false)
  const [nicknameInput, setNicknameInput] = useState('')
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    if (messages?.length) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages?.length])

  function handleJoin() {
    if (!nickname) {
      setShowNicknameModal(true)
      return
    }
    toggleMembership.mutate({ comunidadeId: id!, isMember: false })
  }

  async function handleSetNicknameAndJoin() {
    const trimmed = nicknameInput.trim()
    if (!trimmed || trimmed.length < 3) {
      Alert.alert('Apelido', 'O apelido deve ter pelo menos 3 caracteres.')
      return
    }
    try {
      await setNickname.mutateAsync(trimmed)
      setShowNicknameModal(false)
      toggleMembership.mutate({ comunidadeId: id!, isMember: false })
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o apelido.')
    }
  }

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed) return
    setText('')
    sendMessage.mutate({ comunidadeId: id!, texto: trimmed })
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder bg-dark-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-base font-bold text-darkText flex-1" numberOfLines={1}>
          {community?.nome ?? t('community.title')}
        </Text>
        {community?.regras && (
          <TouchableOpacity onPress={() => router.push({ pathname: '/community/rules/[id]', params: { id: id! } })}>
            <Ionicons name="information-circle-outline" size={24} color={colors.textSecondary} />
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
            const displayName = profile?.apelido_comunidade || 'Anônimo'
            return (
              <View className={`mb-3 max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}>
                {!isMe && (
                  <Text className="text-xs text-darkText-secondary font-medium mb-1 ml-1">
                    {displayName}
                  </Text>
                )}
                <View className={`rounded-2xl px-4 py-2.5 ${isMe ? 'bg-primary' : 'bg-dark-surfaceLight border border-darkBorder'}`}>
                  <Text className={`text-sm ${isMe ? 'text-darkText-inverse' : 'text-darkText'}`}>
                    {item.texto}
                  </Text>
                </View>
                <Text className={`text-[10px] mt-0.5 text-darkText-muted ${isMe ? 'text-right' : ''}`}>
                  {format(new Date(item.created_at), 'HH:mm')}
                </Text>
              </View>
            )
          }}
        />

        {/* Input or join banner */}
        {isMember ? (
          <View className="flex-row items-center px-4 py-3 bg-dark-surface border-t border-darkBorder">
            <TextInput
              className="flex-1 bg-dark-surfaceLight rounded-2xl px-4 py-2.5 text-base text-darkText mr-3 max-h-24"
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
              className="w-10 h-10 bg-primary rounded-full items-center justify-center"
            >
              <Ionicons name="send" size={18} color="#f7f6f3" />
            </TouchableOpacity>
          </View>
        ) : (
          <View className="px-4 py-3 bg-dark-surface border-t border-darkBorder">
            <TouchableOpacity
              onPress={handleJoin}
              disabled={toggleMembership.isPending}
              className="bg-primary rounded-2xl py-3.5 items-center"
            >
              <Text className="text-white font-bold text-sm">
                {toggleMembership.isPending ? 'Entrando...' : 'Participar da comunidade'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <SafeAreaView edges={['bottom']} className="bg-dark-surface" />
      </KeyboardAvoidingView>

      {/* Nickname Modal */}
      <Modal visible={showNicknameModal} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className="bg-dark-surface rounded-3xl p-6">
            <Text className="text-lg font-bold text-darkText text-center mb-2">Crie seu apelido</Text>
            <Text className="text-sm text-darkText-secondary text-center mb-5">
              Nas comunidades, seu apelido aparece no lugar do nome real. Ele é permanente e não pode ser alterado depois.
            </Text>
            <TextInput
              className="bg-dark-surfaceLight rounded-2xl px-4 py-3.5 text-base text-darkText mb-4"
              placeholder="Digite seu apelido"
              placeholderTextColor="#6b7280"
              value={nicknameInput}
              onChangeText={setNicknameInput}
              autoFocus
              maxLength={30}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowNicknameModal(false)}
                className="flex-1 py-3 rounded-2xl bg-dark-surfaceLight items-center"
              >
                <Text className="text-sm font-semibold text-darkText-muted">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSetNicknameAndJoin}
                disabled={!nicknameInput.trim() || nicknameInput.trim().length < 3 || setNickname.isPending}
                className={`flex-1 py-3 rounded-2xl items-center ${nicknameInput.trim().length >= 3 ? 'bg-primary' : 'bg-dark-surfaceLight'}`}
              >
                <Text className={`text-sm font-semibold ${nicknameInput.trim().length >= 3 ? 'text-white' : 'text-darkText-muted'}`}>
                  {setNickname.isPending ? 'Salvando...' : 'Confirmar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
