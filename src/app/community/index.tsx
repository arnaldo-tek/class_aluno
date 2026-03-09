import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Image, Modal, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useCommunities, useIsMember, useToggleMembership, useCommunityNickname, useSetCommunityNickname } from '@/hooks/useCommunity'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { t } from '@/i18n'
import { useThemeColors } from '@/hooks/useThemeColors'

export default function CommunityListScreen() {
  const router = useRouter()
  const colors = useThemeColors()
  const { data: communities, isLoading } = useCommunities()

  if (isLoading) return <LoadingSpinner />

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder bg-dark-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-base font-bold text-darkText flex-1">{t('community.title')}</Text>
      </View>

      <FlatList
        data={communities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState
            title={t('community.noCommunities')}
            icon={<Ionicons name="people-outline" size={48} color={colors.textMuted} />}
          />
        }
        renderItem={({ item }) => (
          <CommunityItem item={item} />
        )}
      />
    </SafeAreaView>
  )
}

function CommunityItem({ item }: { item: any }) {
  const router = useRouter()
  const { data: isMember } = useIsMember(item.id)
  const toggleMembership = useToggleMembership()
  const { data: nickname } = useCommunityNickname()
  const setNickname = useSetCommunityNickname()
  const [showNicknameModal, setShowNicknameModal] = useState(false)
  const [nicknameInput, setNicknameInput] = useState('')

  function handleJoin() {
    if (!nickname) {
      setShowNicknameModal(true)
      return
    }
    toggleMembership.mutate({ comunidadeId: item.id, isMember: false })
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
      toggleMembership.mutate({ comunidadeId: item.id, isMember: false })
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o apelido.')
    }
  }

  function handleToggle() {
    if (isMember) {
      toggleMembership.mutate({ comunidadeId: item.id, isMember: true })
    } else {
      handleJoin()
    }
  }

  return (
    <View className="bg-dark-surface rounded-2xl mb-3 overflow-hidden border border-darkBorder">
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/community/[id]', params: { id: item.id } })}
        className="flex-row p-4"
      >
        {item.imagem ? (
          <Image source={{ uri: item.imagem }} className="w-14 h-14 rounded-xl" resizeMode="cover" />
        ) : (
          <View className="w-14 h-14 bg-primary-50 rounded-xl items-center justify-center">
            <Ionicons name="people-outline" size={24} color="#60a5fa" />
          </View>
        )}
        <View className="flex-1 ml-3 justify-center">
          <Text className="text-base font-semibold text-darkText">{item.nome}</Text>
          {item.categorias?.nome && (
            <Text className="text-xs text-darkText-muted mt-0.5">{item.categorias.nome}</Text>
          )}
        </View>
      </TouchableOpacity>

      <View className="flex-row border-t border-darkBorder-subtle">
        <TouchableOpacity
          onPress={handleToggle}
          disabled={toggleMembership.isPending}
          className="flex-1 py-3.5 items-center"
        >
          <Text className={`text-sm font-medium ${isMember ? 'text-error' : 'text-primary-light'}`}>
            {isMember ? t('community.leave') : t('community.join')}
          </Text>
        </TouchableOpacity>
        {item.regras && (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/community/rules/[id]', params: { id: item.id } })}
            className="flex-1 py-3.5 items-center border-l border-darkBorder-subtle"
          >
            <Text className="text-sm font-medium text-darkText-secondary">{t('community.rules')}</Text>
          </TouchableOpacity>
        )}
      </View>

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
    </View>
  )
}
