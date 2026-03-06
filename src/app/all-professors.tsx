import { useState } from 'react'
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { SearchInput } from '@/components/ui/SearchInput'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { t } from '@/i18n'
import { useThemeColors } from '@/hooks/useThemeColors'

function useAllProfessors(search: string) {
  return useQuery({
    queryKey: ['all-professors', search],
    queryFn: async () => {
      let query = supabase
        .from('professor_profiles')
        .select('id, user_id, nome_professor, foto_perfil, descricao, average_rating')
        .eq('approval_status', 'aprovado')
        .eq('is_blocked', false)
        .order('nome_professor')

      if (search.trim()) {
        query = query.ilike('nome_professor', `%${search.trim()}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
  })
}

export default function ProfessorsListScreen() {
  const router = useRouter()
  const colors = useThemeColors()
  const [search, setSearch] = useState('')
  const { data: professors, isLoading } = useAllProfessors(search)

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center px-4 pt-4 pb-3 bg-dark-surface border-b border-darkBorder-subtle">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-darkText flex-1">Professores</Text>
      </View>

      <View className="px-4 py-3">
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar professor..."
        />
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : !professors?.length ? (
        <EmptyState
          title="Nenhum professor encontrado"
          icon={<Ionicons name="person-outline" size={48} color={colors.textMuted} />}
        />
      ) : (
        <FlatList
          data={professors}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/professor/[id]', params: { id: item.id } })}
              className="bg-dark-surface rounded-2xl mb-3 flex-row items-center"
              style={{ paddingHorizontal: 16, paddingVertical: 14 }}
              activeOpacity={0.7}
            >
              {item.foto_perfil ? (
                <Image source={{ uri: item.foto_perfil }} style={{ width: 52, height: 52, borderRadius: 26 }} />
              ) : (
                <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(59,130,246,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="person" size={24} color="#3b82f6" />
                </View>
              )}
              <View className="flex-1" style={{ marginLeft: 14 }}>
                <Text className="text-base font-semibold text-darkText">{item.nome_professor}</Text>
                {item.descricao && (
                  <Text className="text-xs text-darkText-muted mt-0.5" numberOfLines={1}>
                    {item.descricao}
                  </Text>
                )}
                {(item.average_rating ?? 0) > 0 && (
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="star" size={12} color="#fbbf24" />
                    <Text className="text-xs text-accent-light ml-1">{(item.average_rating ?? 0).toFixed(1)}</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}
