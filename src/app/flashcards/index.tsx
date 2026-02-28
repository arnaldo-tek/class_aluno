import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useFlashcardFolders, useCreateFolder, useDeleteFolder } from '@/hooks/useFlashcards'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

export default function FlashcardFoldersScreen() {
  const router = useRouter()
  const { data: folders, isLoading } = useFlashcardFolders()
  const createFolder = useCreateFolder()
  const deleteFolder = useDeleteFolder()
  const [newName, setNewName] = useState('')
  const [showInput, setShowInput] = useState(false)

  async function handleCreate() {
    if (!newName.trim()) return
    await createFolder.mutateAsync(newName.trim())
    setNewName('')
    setShowInput(false)
  }

  function handleDelete(id: string, nome: string) {
    Alert.alert('Excluir pasta', `Excluir "${nome}" e todos os flashcards?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteFolder.mutate(id) },
    ])
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3 bg-dark-surface border-b border-darkBorder">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-bold text-darkText">Flashcards</Text>
        <TouchableOpacity onPress={() => setShowInput(!showInput)}>
          <Ionicons name="add-circle-outline" size={28} color="#60a5fa" />
        </TouchableOpacity>
      </View>

      {/* Create input */}
      {showInput && (
        <View className="flex-row px-4 py-3 bg-dark-surface border-b border-darkBorder gap-2">
          <TextInput
            className="flex-1 border border-darkBorder rounded-2xl px-3 py-2 text-sm bg-dark-surfaceLight text-darkText"
            placeholder="Nome da pasta"
            placeholderTextColor="#9ca3af"
            value={newName}
            onChangeText={setNewName}
            autoFocus
          />
          <TouchableOpacity
            onPress={handleCreate}
            disabled={createFolder.isPending}
            className="bg-primary rounded-2xl px-4 items-center justify-center"
          >
            <Text className="text-darkText-inverse font-semibold text-sm">Criar</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : !folders?.length ? (
        <EmptyState
          title="Nenhuma pasta"
          description="Crie pastas para organizar seus flashcards."
          icon={<Ionicons name="layers-outline" size={48} color="#9ca3af" />}
        />
      ) : (
        <FlatList
          data={folders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/flashcards/blocks', params: { folder_id: item.id, folder_name: item.nome } })}
              className="bg-dark-surface rounded-2xl px-4 py-4 mb-3 border border-darkBorder flex-row items-center"
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 rounded-full bg-primary-50 items-center justify-center">
                <Ionicons name="folder-outline" size={22} color="#60a5fa" />
              </View>
              <Text className="flex-1 text-base font-medium text-darkText ml-3">{item.nome}</Text>
              <TouchableOpacity
                onPress={() => handleDelete(item.id, item.nome)}
                className="p-2"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={18} color="#9ca3af" />
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={18} color="#6b7280" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}
