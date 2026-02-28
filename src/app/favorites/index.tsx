import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useFollowingProfessors } from '@/hooks/useFavorites'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { t } from '@/i18n'

export default function FavoritesScreen() {
  const router = useRouter()
  const { data: following, isLoading } = useFollowingProfessors()

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 pt-4 pb-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">{t('profile.favorites')}</Text>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : !following?.length ? (
        <EmptyState
          title="Nenhum favorito"
          description="Siga professores para vê-los aqui."
          icon={<Ionicons name="heart-outline" size={48} color="#9ca3af" />}
        />
      ) : (
        <FlatList
          data={following}
          keyExtractor={(item) => item.professor_id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const prof = item.professor as any
            if (!prof) return null
            return (
              <TouchableOpacity
                onPress={() => router.push(`/professor/${prof.id}`)}
                className="bg-white rounded-xl px-4 py-3 mb-3 border border-gray-100 flex-row items-center"
                activeOpacity={0.7}
              >
                {prof.foto_perfil ? (
                  <Image source={{ uri: prof.foto_perfil }} className="w-12 h-12 rounded-full" />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center">
                    <Ionicons name="person" size={20} color="#2563eb" />
                  </View>
                )}
                <View className="flex-1 ml-3">
                  <Text className="text-base font-medium text-gray-900">{prof.nome_professor}</Text>
                  {prof.average_rating > 0 && (
                    <View className="flex-row items-center mt-0.5">
                      <Ionicons name="star" size={12} color="#f59e0b" />
                      <Text className="text-xs text-gray-500 ml-1">{prof.average_rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
              </TouchableOpacity>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}
