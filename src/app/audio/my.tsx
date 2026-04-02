import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useAuthContext } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useThemeColors } from '@/hooks/useThemeColors'

type Tab = 'leis' | 'pacotes'

function useFavoritosByTipo(tipo: string) {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['favoritos-list', user?.id, tipo],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('favoritos')
        .select('id, referencia_id, created_at')
        .eq('user_id', user.id)
        .eq('tipo', tipo)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
  })
}

function useFavoriteLawDetails(ids: string[]) {
  return useQuery({
    queryKey: ['favorite-law-details', ids],
    queryFn: async () => {
      if (!ids.length) return []
      const { data, error } = await supabase
        .from('leis')
        .select('id, nome')
        .in('id', ids)
      if (error) throw error
      return data ?? []
    },
    enabled: ids.length > 0,
  })
}

function useFavoriteAudioPackageDetails(ids: string[]) {
  return useQuery({
    queryKey: ['favorite-audio-package-details', ids],
    queryFn: async () => {
      if (!ids.length) return []
      const { data, error } = await supabase
        .from('subpastas_leis')
        .select('id, nome')
        .in('id', ids)
      if (error) throw error
      return data ?? []
    },
    enabled: ids.length > 0,
  })
}

function useRemoveFavorito() {
  const { user } = useAuthContext()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ tipo, referenciaId }: { tipo: string; referenciaId: string }) => {
      const { error } = await supabase
        .from('favoritos')
        .delete()
        .eq('user_id', user!.id)
        .eq('tipo', tipo)
        .eq('referencia_id', referenciaId)
      if (error) throw error
    },
    onSuccess: (_data, { tipo }) => {
      qc.invalidateQueries({ queryKey: ['favoritos-list', user?.id, tipo] })
    },
  })
}

export default function MyAudioScreen() {
  const router = useRouter()
  const colors = useThemeColors()
  const [activeTab, setActiveTab] = useState<Tab>('leis')

  const { data: favLeis } = useFavoritosByTipo('lei')
  const { data: favPacotes } = useFavoritosByTipo('pacote_lei')

  const leiIds = (favLeis ?? []).map((f) => f.referencia_id)
  const pacoteIds = (favPacotes ?? []).map((f) => f.referencia_id)

  const { data: lawDetails, isLoading: loadingLaws } = useFavoriteLawDetails(leiIds)
  const { data: packageDetails, isLoading: loadingPackages } = useFavoriteAudioPackageDetails(pacoteIds)
  const removeFavorito = useRemoveFavorito()

  function confirmRemove(tipo: string, referenciaId: string, nome: string) {
    Alert.alert(
      'Desfavoritar',
      `Remover "${nome}" dos seus favoritos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => removeFavorito.mutate({ tipo, referenciaId }) },
      ]
    )
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'leis', label: 'Minhas Leis', count: favLeis?.length ?? 0 },
    { key: 'pacotes', label: 'Meus Pacotes', count: favPacotes?.length ?? 0 },
  ]

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-3 bg-dark-surface border-b border-darkBorder-subtle">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-darkText">Meus Áudio Cursos</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-darkBorder-subtle">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 items-center border-b-2 ${activeTab === tab.key ? 'border-primary' : 'border-transparent'}`}
          >
            <Text className={`text-sm font-medium ${activeTab === tab.key ? 'text-primary' : 'text-darkText-muted'}`}>
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Minhas Leis */}
      {activeTab === 'leis' && (
        loadingLaws ? <LoadingSpinner /> : !lawDetails?.length ? (
          <EmptyState
            title="Nenhuma lei salva"
            description="Favorite leis nos áudio cursos para vê-las aqui."
            icon={<Ionicons name="document-text-outline" size={48} color={colors.textMuted} />}
          />
        ) : (
          <FlatList
            data={lawDetails}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View className="bg-dark-surface rounded-2xl px-4 py-3.5 mb-3 flex-row items-center">
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/audio/player/[id]', params: { id: item.id } })}
                  className="flex-1 flex-row items-center"
                  activeOpacity={0.7}
                >
                  <View className="w-10 h-10 rounded-full bg-dark-surfaceLight items-center justify-center">
                    <Ionicons name="musical-notes" size={18} color="#93c5fd" />
                  </View>
                  <Text className="flex-1 text-base font-medium text-darkText ml-3" numberOfLines={2}>
                    {item.nome}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => confirmRemove('lei', item.id, item.nome)}
                  className="ml-2 p-2"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="heart" size={22} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}
          />
        )
      )}

      {/* Meus Pacotes de Áudios */}
      {activeTab === 'pacotes' && (
        loadingPackages ? <LoadingSpinner /> : !packageDetails?.length ? (
          <EmptyState
            title="Nenhum pacote salvo"
            description="Favorite pacotes de áudio para vê-los aqui."
            icon={<Ionicons name="library-outline" size={48} color={colors.textMuted} />}
          />
        ) : (
          <FlatList
            data={packageDetails}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View className="bg-dark-surface rounded-2xl px-4 py-3.5 mb-3 flex-row items-center">
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/audio/laws/[id]', params: { id: item.id } })}
                  className="flex-1 flex-row items-center"
                  activeOpacity={0.7}
                >
                  <View className="w-10 h-10 rounded-full bg-dark-surfaceLight items-center justify-center">
                    <Ionicons name="library" size={18} color="#93c5fd" />
                  </View>
                  <Text className="flex-1 text-base font-medium text-darkText ml-3" numberOfLines={2}>
                    {item.nome}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => confirmRemove('pacote_lei', item.id, item.nome)}
                  className="ml-2 p-2"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="heart" size={22} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}
          />
        )
      )}
    </SafeAreaView>
  )
}
