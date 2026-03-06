import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useAuthContext } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useThemeColors } from '@/hooks/useThemeColors'

function useMyFavoriteNotices() {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['my-favorite-notices', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data: favs, error: favError } = await supabase
        .from('favoritos')
        .select('referencia_id')
        .eq('user_id', user.id)
        .eq('tipo', 'edital')
        .order('created_at', { ascending: false })
      if (favError) throw favError
      if (!favs?.length) return []

      const ids = favs.map((f) => f.referencia_id)
      const { data, error } = await supabase
        .from('editais')
        .select('id, titulo, resumo')
        .in('id', ids)
      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
  })
}

export default function MyNoticesScreen() {
  const router = useRouter()
  const colors = useThemeColors()
  const { data: notices, isLoading } = useMyFavoriteNotices()

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center px-4 pt-4 pb-3 bg-dark-surface border-b border-darkBorder-subtle">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-darkText">Meus Editais</Text>
      </View>

      {isLoading ? <LoadingSpinner /> : !notices?.length ? (
        <EmptyState
          title="Nenhum edital salvo"
          description="Favorite editais para vê-los aqui."
          icon={<Ionicons name="document-text-outline" size={48} color={colors.textMuted} />}
        />
      ) : (
        <FlatList
          data={notices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/notices/[id]', params: { id: item.id } })}
              className="bg-dark-surface rounded-2xl px-4 py-3.5 mb-3"
              activeOpacity={0.7}
            >
              <Text className="text-base font-medium text-darkText" numberOfLines={2}>
                {item.titulo}
              </Text>
              {item.resumo && (
                <Text className="text-sm text-darkText-secondary mt-1" numberOfLines={2}>
                  {item.resumo}
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}
