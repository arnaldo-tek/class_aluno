import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useFlashcardBlocks, useCreateBlock, useDeleteBlock } from '@/hooks/useFlashcards'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

export default function FlashcardBlocksScreen() {
  const { folder_id, folder_name } = useLocalSearchParams<{ folder_id: string; folder_name?: string }>()
  const router = useRouter()
  const { data: blocks, isLoading } = useFlashcardBlocks(folder_id!)
  const createBlock = useCreateBlock()
  const deleteBlock = useDeleteBlock()
  const [newName, setNewName] = useState('')
  const [showInput, setShowInput] = useState(false)

  async function handleCreate() {
    if (!newName.trim()) return
    await createBlock.mutateAsync({ nome: newName.trim(), pasta_id: folder_id! })
    setNewName('')
    setShowInput(false)
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-bold text-gray-900" numberOfLines={1}>{folder_name ?? 'Blocos'}</Text>
        <TouchableOpacity onPress={() => setShowInput(!showInput)}>
          <Ionicons name="add-circle-outline" size={28} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {showInput && (
        <View className="flex-row px-4 py-3 bg-white border-b border-gray-100 gap-2">
          <TextInput
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50"
            placeholder="Nome do bloco"
            placeholderTextColor="#9ca3af"
            value={newName}
            onChangeText={setNewName}
            autoFocus
          />
          <TouchableOpacity
            onPress={handleCreate}
            disabled={createBlock.isPending}
            className="bg-blue-600 rounded-xl px-4 items-center justify-center"
          >
            <Text className="text-white font-semibold text-sm">Criar</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : !blocks?.length ? (
        <EmptyState
          title="Nenhum bloco"
          description="Crie blocos para organizar os cards."
          icon={<Ionicons name="albums-outline" size={48} color="#9ca3af" />}
        />
      ) : (
        <FlatList
          data={blocks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push({
                pathname: '/flashcards/cards',
                params: { block_id: item.id, block_name: item.nome, folder_id: folder_id! },
              })}
              className="bg-white rounded-xl px-4 py-4 mb-3 border border-gray-100 flex-row items-center"
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 rounded-full bg-purple-50 items-center justify-center">
                <Ionicons name="albums-outline" size={22} color="#7c3aed" />
              </View>
              <Text className="flex-1 text-base font-medium text-gray-900 ml-3">{item.nome}</Text>
              <TouchableOpacity
                onPress={() => Alert.alert('Excluir bloco', `Excluir "${item.nome}"?`, [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Excluir', style: 'destructive', onPress: () => deleteBlock.mutate(item.id) },
                ])}
                className="p-2"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={18} color="#9ca3af" />
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}
