import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAudioFolders } from '@/hooks/useAudio'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { t } from '@/i18n'

export default function AudioFoldersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: folders, isLoading } = useAudioFolders(id!)

  if (isLoading) return <LoadingSpinner />

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder bg-dark-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-darkText flex-1">{t('audio.folders')}</Text>
      </View>

      <FlatList
        data={folders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState
            title={t('audio.noAudio')}
            icon={<Ionicons name="folder-open-outline" size={48} color="#9ca3af" />}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/audio/laws/${item.id}`)}
            className="flex-row bg-dark-surface rounded-2xl mb-3 p-4 border border-darkBorder items-center"
          >
            <View className="w-12 h-12 bg-primary-50 rounded-2xl items-center justify-center mr-3">
              <Ionicons name="folder-outline" size={24} color="#60a5fa" />
            </View>
            <Text className="flex-1 text-base font-medium text-darkText">{item.nome}</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  )
}
