import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useFlashcardBlocks, useCreateBlock, useDeleteBlock } from '@/hooks/useFlashcards'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useThemeColors } from '@/hooks/useThemeColors'

export default function FlashcardBlocksScreen() {
  const { folder_id, folder_name } = useLocalSearchParams<{ folder_id: string; folder_name?: string }>()
  const router = useRouter()
  const colors = useThemeColors()
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1 }} className="flex-row items-center justify-between px-4 pt-4 pb-3">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text }} className="flex-1 text-lg font-bold" numberOfLines={1}>{folder_name ?? 'Blocos'}</Text>
        <TouchableOpacity onPress={() => setShowInput(!showInput)}>
          <Ionicons name="add-circle-outline" size={28} color="#60a5fa" />
        </TouchableOpacity>
      </View>

      {/* Breadcrumb */}
      <View style={{ backgroundColor: colors.bg }} className="flex-row items-center px-4 py-2">
        <TouchableOpacity onPress={() => router.push('/flashcards')}>
          <Text className="text-xs text-primary-light">Flashcards</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={12} color={colors.textMuted} style={{ marginHorizontal: 4 }} />
        <Text style={{ color: colors.textMuted }} className="text-xs" numberOfLines={1}>{folder_name ?? 'Pasta'}</Text>
      </View>

      {showInput && (
        <View style={{ backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1 }} className="flex-row px-4 py-3 gap-2">
          <TextInput
            style={{ borderColor: colors.border, backgroundColor: colors.surfaceLight, color: colors.text }}
            className="flex-1 border rounded-2xl px-3 py-2 text-sm"
            placeholder="Nome do bloco"
            placeholderTextColor={colors.textMuted}
            value={newName}
            onChangeText={setNewName}
            autoFocus
          />
          <TouchableOpacity
            onPress={handleCreate}
            disabled={createBlock.isPending}
            className="bg-primary rounded-2xl px-4 items-center justify-center"
          >
            <Text style={{ color: colors.textInverse }} className="font-semibold text-sm">Criar</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : !blocks?.length ? (
        <EmptyState
          title="Nenhum bloco"
          description="Crie blocos para organizar os cards."
          icon={<Ionicons name="albums-outline" size={48} color={colors.textMuted} />}
        />
      ) : (
        <FlatList
          data={blocks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push({
                pathname: '/flashcards/study',
                params: { block_id: item.id, block_name: item.nome, folder_id: folder_id!, folder_name: folder_name ?? '' },
              })}
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
              className="rounded-2xl px-4 py-4 mb-3 border flex-row items-center"
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 rounded-full bg-primary-50 items-center justify-center">
                <Ionicons name="albums-outline" size={22} color="#60a5fa" />
              </View>
              <Text style={{ color: colors.text }} className="flex-1 text-base font-medium ml-3">{item.nome}</Text>
              <TouchableOpacity
                onPress={() => Alert.alert('Excluir bloco', `Excluir "${item.nome}"?`, [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Excluir', style: 'destructive', onPress: () => deleteBlock.mutate(item.id) },
                ])}
                className="p-2"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}
