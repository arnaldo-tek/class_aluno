import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAudioLaws } from '@/hooks/useAudio'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { t } from '@/i18n'

export default function AudioLawsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const { data: laws, isLoading } = useAudioLaws(id!, search)

  if (isLoading) return <LoadingSpinner />

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900 flex-1">{t('audio.laws')}</Text>
      </View>

      <SearchInput value={search} onChangeText={setSearch} />

      <FlatList
        data={laws}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        ListEmptyComponent={
          <EmptyState
            title={t('audio.noAudio')}
            icon={<Ionicons name="document-text-outline" size={48} color="#9ca3af" />}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/audio/player/${item.id}`)}
            className="flex-row bg-white rounded-xl mb-3 p-4 border border-gray-100 items-center"
          >
            <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3">
              <Ionicons name="play" size={18} color="#2563eb" />
            </View>
            <Text className="flex-1 text-base font-medium text-gray-900" numberOfLines={2}>
              {item.nome}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  )
}
