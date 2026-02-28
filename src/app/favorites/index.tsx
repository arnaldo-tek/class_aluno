import { useState } from 'react'
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useFollowingProfessors } from '@/hooks/useFavorites'
import { useAuthContext } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { t } from '@/i18n'

type Tab = 'professores' | 'cursos' | 'noticias' | 'editais'

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

function useFavoriteNewsDetails(ids: string[]) {
  return useQuery({
    queryKey: ['favorite-news-details', ids],
    queryFn: async () => {
      if (!ids.length) return []
      const { data, error } = await supabase
        .from('noticias')
        .select('id, titulo, imagem, created_at')
        .in('id', ids)
      if (error) throw error
      return data ?? []
    },
    enabled: ids.length > 0,
  })
}

function useFavoriteNoticeDetails(ids: string[]) {
  return useQuery({
    queryKey: ['favorite-notice-details', ids],
    queryFn: async () => {
      if (!ids.length) return []
      const { data, error } = await supabase
        .from('editais')
        .select('id, titulo, imagem, created_at')
        .in('id', ids)
      if (error) throw error
      return data ?? []
    },
    enabled: ids.length > 0,
  })
}

function useFavoriteCourseDetails(ids: string[]) {
  return useQuery({
    queryKey: ['favorite-course-details', ids],
    queryFn: async () => {
      if (!ids.length) return []
      const { data, error } = await supabase
        .from('cursos')
        .select('id, nome, imagem, preco, average_rating')
        .in('id', ids)
      if (error) throw error
      return data ?? []
    },
    enabled: ids.length > 0,
  })
}

export default function FavoritesScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('professores')

  const { data: following, isLoading: loadingProf } = useFollowingProfessors()
  const { data: favCourses } = useFavoritosByTipo('curso')
  const { data: favNews } = useFavoritosByTipo('noticia')
  const { data: favNotices } = useFavoritosByTipo('edital')

  const courseIds = (favCourses ?? []).map((f) => f.referencia_id)
  const newsIds = (favNews ?? []).map((f) => f.referencia_id)
  const noticeIds = (favNotices ?? []).map((f) => f.referencia_id)

  const { data: courseDetails, isLoading: loadingCourses } = useFavoriteCourseDetails(courseIds)
  const { data: newsDetails, isLoading: loadingNews } = useFavoriteNewsDetails(newsIds)
  const { data: noticeDetails, isLoading: loadingNotices } = useFavoriteNoticeDetails(noticeIds)

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'professores', label: 'Professores', count: following?.length ?? 0 },
    { key: 'cursos', label: 'Cursos', count: favCourses?.length ?? 0 },
    { key: 'noticias', label: 'Noticias', count: favNews?.length ?? 0 },
    { key: 'editais', label: 'Editais', count: favNotices?.length ?? 0 },
  ]

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-3 bg-dark-surface border-b border-darkBorder-subtle">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-darkText">{t('profile.favorites')}</Text>
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

      {/* Content */}
      {activeTab === 'professores' && (
        loadingProf ? <LoadingSpinner /> : !following?.length ? (
          <EmptyState
            title="Nenhum professor seguido"
            description="Siga professores para vê-los aqui."
            icon={<Ionicons name="person-outline" size={48} color="#636366" />}
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
                  onPress={() => router.push({ pathname: '/professor/[id]', params: { id: prof.id } })}
                  className="bg-dark-surface rounded-2xl px-4 py-3.5 mb-3 flex-row items-center"
                  activeOpacity={0.7}
                >
                  {prof.foto_perfil ? (
                    <Image source={{ uri: prof.foto_perfil }} className="w-12 h-12 rounded-full" />
                  ) : (
                    <View className="w-12 h-12 rounded-full bg-primary-50 items-center justify-center">
                      <Ionicons name="person" size={20} color="#60a5fa" />
                    </View>
                  )}
                  <View className="flex-1 ml-3">
                    <Text className="text-base font-medium text-darkText">{prof.nome_professor}</Text>
                    {prof.average_rating > 0 && (
                      <View className="flex-row items-center mt-0.5">
                        <Ionicons name="star" size={12} color="#fbbf24" />
                        <Text className="text-xs text-accent-light ml-1">{prof.average_rating.toFixed(1)}</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#636366" />
                </TouchableOpacity>
              )
            }}
          />
        )
      )}

      {activeTab === 'cursos' && (
        loadingCourses ? <LoadingSpinner /> : !courseDetails?.length ? (
          <EmptyState
            title="Nenhum curso favorito"
            description="Favorite cursos para ve-los aqui."
            icon={<Ionicons name="book-outline" size={48} color="#636366" />}
          />
        ) : (
          <FlatList
            data={courseDetails}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/course/[id]', params: { id: item.id } })}
                className="bg-dark-surface rounded-2xl mb-3 overflow-hidden"
                activeOpacity={0.7}
              >
                {item.imagem && (
                  <Image source={{ uri: item.imagem }} className="w-full h-32" resizeMode="cover" />
                )}
                <View className="px-4 py-3">
                  <Text className="text-base font-medium text-darkText">{item.nome}</Text>
                  <View className="flex-row items-center justify-between mt-1">
                    <Text className="text-sm font-bold text-primary-light">
                      {(item.preco ?? 0) > 0 ? `R$ ${(item.preco ?? 0).toFixed(2)}` : 'Gratis'}
                    </Text>
                    {(item.average_rating ?? 0) > 0 && (
                      <View className="flex-row items-center">
                        <Ionicons name="star" size={12} color="#fbbf24" />
                        <Text className="text-xs text-accent-light ml-1">{(item.average_rating ?? 0).toFixed(1)}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )
      )}

      {activeTab === 'noticias' && (
        loadingNews ? <LoadingSpinner /> : !newsDetails?.length ? (
          <EmptyState
            title="Nenhuma notícia favorita"
            description="Favorite notícias para vê-las aqui."
            icon={<Ionicons name="newspaper-outline" size={48} color="#636366" />}
          />
        ) : (
          <FlatList
            data={newsDetails}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/news/[id]', params: { id: item.id } })}
                className="bg-dark-surface rounded-2xl mb-3 overflow-hidden"
                activeOpacity={0.7}
              >
                {item.imagem && (
                  <Image source={{ uri: item.imagem }} className="w-full h-32" resizeMode="cover" />
                )}
                <View className="px-4 py-3">
                  <Text className="text-base font-medium text-darkText">{item.titulo}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )
      )}

      {activeTab === 'editais' && (
        loadingNotices ? <LoadingSpinner /> : !noticeDetails?.length ? (
          <EmptyState
            title="Nenhum edital favorito"
            description="Favorite editais para vê-los aqui."
            icon={<Ionicons name="document-text-outline" size={48} color="#636366" />}
          />
        ) : (
          <FlatList
            data={noticeDetails}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/notices/[id]', params: { id: item.id } })}
                className="bg-dark-surface rounded-2xl mb-3 overflow-hidden"
                activeOpacity={0.7}
              >
                {item.imagem && (
                  <Image source={{ uri: item.imagem }} className="w-full h-32" resizeMode="cover" />
                )}
                <View className="px-4 py-3">
                  <Text className="text-base font-medium text-darkText">{item.titulo}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )
      )}
    </SafeAreaView>
  )
}
