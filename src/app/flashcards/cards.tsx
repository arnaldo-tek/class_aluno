import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useFlashcards, useCreateFlashcard, useDeleteFlashcard } from '@/hooks/useFlashcards'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

export default function FlashcardsListScreen() {
  const { block_id, block_name, folder_id, folder_name } = useLocalSearchParams<{
    block_id: string; block_name?: string; folder_id: string; folder_name?: string
  }>()
  const router = useRouter()
  const { data: cards, isLoading } = useFlashcards(block_id!)
  const createCard = useCreateFlashcard()
  const deleteCard = useDeleteFlashcard()

  const [showForm, setShowForm] = useState(false)
  const [pergunta, setPergunta] = useState('')
  const [resposta, setResposta] = useState('')

  async function handleCreate() {
    if (!pergunta.trim() || !resposta.trim()) return
    await createCard.mutateAsync({
      pergunta: pergunta.trim(),
      resposta: resposta.trim(),
      bloco_id: block_id!,
      pasta_id: folder_id!,
    })
    setPergunta('')
    setResposta('')
    setShowForm(false)
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3 bg-dark-surface border-b border-darkBorder">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-bold text-darkText" numberOfLines={1}>{block_name ?? 'Cards'}</Text>
        <View className="flex-row gap-2">
          {cards && cards.length > 0 && (
            <TouchableOpacity
              onPress={() => router.push({
                pathname: '/flashcards/study',
                params: { block_id: block_id! },
              })}
            >
              <Ionicons name="play-circle-outline" size={28} color="#34d399" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowForm(!showForm)}>
            <Ionicons name="add-circle-outline" size={28} color="#60a5fa" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Breadcrumb */}
      <View className="flex-row items-center px-4 py-2 bg-dark-bg">
        <TouchableOpacity onPress={() => router.push('/flashcards')}>
          <Text className="text-xs text-primary-light">Flashcards</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={12} color="#9ca3af" style={{ marginHorizontal: 4 }} />
        <TouchableOpacity onPress={() => router.push({ pathname: '/flashcards/blocks', params: { folder_id: folder_id!, folder_name: folder_name ?? '' } })}>
          <Text className="text-xs text-primary-light" numberOfLines={1}>{folder_name ?? 'Pasta'}</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={12} color="#9ca3af" style={{ marginHorizontal: 4 }} />
        <Text className="text-xs text-darkText-muted" numberOfLines={1}>{block_name ?? 'Bloco'}</Text>
      </View>

      {showForm && (
        <View className="px-4 py-3 bg-dark-surface border-b border-darkBorder gap-2">
          <TextInput
            className="border border-darkBorder rounded-2xl px-3 py-2 text-sm bg-dark-surfaceLight text-darkText"
            placeholder="Pergunta"
            placeholderTextColor="#9ca3af"
            value={pergunta}
            onChangeText={setPergunta}
            multiline
          />
          <TextInput
            className="border border-darkBorder rounded-2xl px-3 py-2 text-sm bg-dark-surfaceLight text-darkText"
            placeholder="Resposta"
            placeholderTextColor="#9ca3af"
            value={resposta}
            onChangeText={setResposta}
            multiline
          />
          <TouchableOpacity
            onPress={handleCreate}
            disabled={createCard.isPending}
            className="bg-primary rounded-2xl py-3.5 items-center"
          >
            <Text className="text-darkText-inverse font-semibold text-sm">Adicionar card</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : !cards?.length ? (
        <EmptyState
          title="Nenhum flashcard"
          description="Adicione cards com pergunta e resposta."
          icon={<Ionicons name="card-outline" size={48} color="#9ca3af" />}
        />
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View className="bg-dark-surface rounded-2xl px-4 py-3 mb-3 border border-darkBorder">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-darkText mb-1">{item.pergunta}</Text>
                  <Text className="text-sm text-darkText-secondary">{item.resposta}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => Alert.alert('Excluir', 'Excluir este flashcard?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Excluir', style: 'destructive', onPress: () => deleteCard.mutate(item.id) },
                  ])}
                  className="ml-2 p-1"
                >
                  <Ionicons name="trash-outline" size={16} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  )
}
