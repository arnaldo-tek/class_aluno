import { useState, useMemo, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Video, ResizeMode } from 'expo-av'
import * as VideoThumbnails from 'expo-video-thumbnails'
import { useAllProfessors } from '@/hooks/useProfessor'
import { useProfessorCards, useFollowedProfessorCards } from '@/hooks/useProfessorCards'
import { SearchInput } from '@/components/ui/SearchInput'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { TopBar } from '@/components/TopBar'
import { DrawerMenu } from '@/components/DrawerMenu'
import { useThemeColors } from '@/hooks/useThemeColors'

type Filter = 'all' | 'following'

type CardItem = {
  id: string
  titulo: string
  texto: string | null
  imagem: string | null
  video: string | null
  professor_id: string
  professor_nome: string
  professor_foto: string | null
  created_at: string
}

export default function ProfessorsScreen() {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [drawerVisible, setDrawerVisible] = useState(false)

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['left', 'right', 'bottom']}>
      <TopBar title="Professores" onMenuPress={() => setDrawerVisible(true)} />
      <DrawerMenu visible={drawerVisible} onClose={() => setDrawerVisible(false)} />

      {/* Filter tabs */}
      <View className="flex-row px-4 mt-3 mb-3">
        <FilterChip label="Todos" active={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterChip label="Seguindo" active={filter === 'following'} onPress={() => setFilter('following')} />
      </View>

      {filter === 'all' && (
        <SearchInput value={search} onChangeText={setSearch} />
      )}

      {filter === 'all' && <AllProfessorsFeed search={search} />}
      {filter === 'following' && <FollowingFeed />}
    </SafeAreaView>
  )
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2 mr-2 rounded-full border ${
        active ? 'bg-primary border-primary' : 'bg-dark-surfaceLight border-darkBorder'
      }`}
      activeOpacity={0.7}
    >
      <Text className={`text-sm font-medium ${active ? 'text-white' : 'text-darkText-secondary'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

function CardFeedItem({ item }: { item: CardItem }) {
  const router = useRouter()
  const [playing, setPlaying] = useState(false)
  const [thumbnail, setThumbnail] = useState<string | null>(null)

  // Gera thumbnail do vídeo quando não tem imagem
  useEffect(() => {
    if (item.video && !item.imagem) {
      VideoThumbnails.getThumbnailAsync(item.video, { time: 1000 })
        .then(({ uri }) => setThumbnail(uri))
        .catch(() => {})
    }
  }, [item.video, item.imagem])

  const previewImage = item.imagem ?? thumbnail

  return (
    <View className="bg-dark-surface rounded-2xl mb-4 overflow-hidden border border-darkBorder-subtle">
      {/* Professor info - only this navigates to professor page */}
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/professor/[id]', params: { id: item.professor_id } })}
        className="flex-row items-center px-4 py-3"
        activeOpacity={0.7}
      >
        {item.professor_foto ? (
          <Image source={{ uri: item.professor_foto }} className="w-10 h-10 rounded-full" />
        ) : (
          <View className="w-10 h-10 rounded-full bg-primary-50 items-center justify-center">
            <Ionicons name="person" size={18} color="#3b82f6" />
          </View>
        )}
        <View className="ml-3 flex-1">
          <Text className="text-sm font-semibold text-darkText">{item.professor_nome}</Text>
          <Text className="text-xs text-darkText-muted">Professor</Text>
        </View>
      </TouchableOpacity>

      {/* Media */}
      {item.video ? (
        playing ? (
          <Video
            source={{ uri: item.video }}
            useNativeControls
            shouldPlay
            resizeMode={ResizeMode.CONTAIN}
            style={{ width: '100%', height: 256 }}
            onPlaybackStatusUpdate={(status) => {
              if ('didJustFinish' in status && status.didJustFinish) setPlaying(false)
            }}
          />
        ) : (
          <TouchableOpacity
            onPress={() => setPlaying(true)}
            className="w-full h-64 bg-dark-surfaceLight items-center justify-center"
            activeOpacity={0.8}
          >
            {previewImage && (
              <Image source={{ uri: previewImage }} className="absolute w-full h-full" resizeMode="cover" />
            )}
            <View className="w-16 h-16 rounded-full bg-black/50 items-center justify-center">
              <Ionicons name="play" size={32} color="white" />
            </View>
          </TouchableOpacity>
        )
      ) : item.imagem ? (
        <Image source={{ uri: item.imagem }} className="w-full h-64" resizeMode="cover" />
      ) : null}

      {/* Text */}
      {item.texto && (
        <View className="px-4 py-3">
          <Text className="text-sm text-darkText leading-5">{item.texto}</Text>
        </View>
      )}
    </View>
  )
}

function FollowingFeed() {
  const colors = useThemeColors()
  const { data: cards, isLoading } = useFollowedProfessorCards()

  if (isLoading) return <LoadingSpinner />
  if (!cards?.length) {
    return (
      <EmptyState
        title="Nenhum card ainda"
        description="Siga professores para ver seus cards aqui."
        icon={<Ionicons name="heart-outline" size={48} color={colors.textMuted} />}
      />
    )
  }

  return (
    <FlatList
      data={cards}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 16, paddingTop: 0 }}
      renderItem={({ item }) => <CardFeedItem item={item} />}
    />
  )
}

function ProfessorAvatarList() {
  const { data: professors, isLoading } = useAllProfessors()
  const router = useRouter()

  if (isLoading || !professors?.length) return null

  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between px-4 mb-2">
        <Text className="text-sm font-semibold text-darkText">Professores</Text>
        <TouchableOpacity onPress={() => router.push({ pathname: '/all-professors' as any })} className="flex-row items-center">
          <Text className="text-sm text-primary-light font-medium mr-1">Ver todos</Text>
          <Ionicons name="chevron-forward" size={14} color="#60a5fa" />
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
      >
        {professors.map((prof) => (
          <TouchableOpacity
            key={prof.id}
            onPress={() => router.push({ pathname: '/professor/[id]', params: { id: prof.id } })}
            className="items-center mr-4"
            style={{ width: 68 }}
            activeOpacity={0.7}
          >
            {prof.foto_perfil ? (
              <Image source={{ uri: prof.foto_perfil }} className="w-14 h-14 rounded-full border-2 border-primary/40" />
            ) : (
              <View className="w-14 h-14 rounded-full bg-primary-50 items-center justify-center border-2 border-primary/40">
                <Ionicons name="person" size={22} color="#3b82f6" />
              </View>
            )}
            <Text className="text-xs text-darkText-secondary mt-1 text-center" numberOfLines={1}>
              {prof.nome_professor}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

function AllProfessorsFeed({ search }: { search: string }) {
  const colors = useThemeColors()
  const { data: allCards, isLoading } = useProfessorCards()

  const filteredCards = useMemo(() => {
    if (!allCards) return []
    if (!search.trim()) return allCards
    const term = search.trim().toLowerCase()
    return allCards.filter((card) => card.professor_nome.toLowerCase().includes(term))
  }, [allCards, search])

  if (isLoading) return <LoadingSpinner />

  return (
    <FlatList
      data={filteredCards}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 16, paddingTop: 0 }}
      ListHeaderComponent={!search.trim() ? <ProfessorAvatarList /> : null}
      ListEmptyComponent={
        <EmptyState
          title="Nenhum card encontrado"
          icon={<Ionicons name="school-outline" size={48} color={colors.textMuted} />}
        />
      }
      renderItem={({ item }) => <CardFeedItem item={item} />}
    />
  )
}
