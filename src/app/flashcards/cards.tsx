import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useFlashcards, useCreateFlashcard, useDeleteFlashcard } from '@/hooks/useFlashcards'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

export default function FlashcardsListScreen() {
  const { block_id, block_name, folder_id } = useLocalSearchParams<{
    block_id: string; block_name?: string; folder_id: string
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
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-bold text-gray-900" numberOfLines={1}>{block_name ?? 'Cards'}</Text>
        <View className="flex-row gap-2">
          {cards && cards.length > 0 && (
            <TouchableOpacity
              onPress={() => router.push({
                pathname: '/flashcards/study',
                params: { block_id: block_id! },
              })}
            >
              <Ionicons name="play-circle-outline" size={28} color="#16a34a" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowForm(!showForm)}>
            <Ionicons name="add-circle-outline" size={28} color="#2563eb" />
          </TouchableOpacity>
        </View>
      </View>

      {showForm && (
        <View className="px-4 py-3 bg-white border-b border-gray-100 gap-2">
          <TextInput
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50"
            placeholder="Pergunta"
            placeholderTextColor="#9ca3af"
            value={pergunta}
            onChangeText={setPergunta}
            multiline
          />
          <TextInput
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50"
            placeholder="Resposta"
            placeholderTextColor="#9ca3af"
            value={resposta}
            onChangeText={setResposta}
            multiline
          />
          <TouchableOpacity
            onPress={handleCreate}
            disabled={createCard.isPending}
            className="bg-blue-600 rounded-xl py-2.5 items-center"
          >
            <Text className="text-white font-semibold text-sm">Adicionar card</Text>
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
            <View className="bg-white rounded-xl px-4 py-3 mb-3 border border-gray-100">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-900 mb-1">{item.pergunta}</Text>
                  <Text className="text-sm text-gray-500">{item.resposta}</Text>
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
