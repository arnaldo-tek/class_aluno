import { useState, useRef, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Linking, FlatList, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useProfessorDetail, useProfessorCourses, useProfessorReviews } from '@/hooks/useProfessor'
import { useIsFollowing, useToggleFollow } from '@/hooks/useProfessor'
import { useProfessorCardsByProfessor } from '@/hooks/useProfessorCards'
import { Video, ResizeMode } from 'expo-av'
import * as VideoThumbnails from 'expo-video-thumbnails'
import { CourseCard } from '@/components/CourseCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useThemeColors } from '@/hooks/useThemeColors'
import { t } from '@/i18n'
import { format } from 'date-fns'

const SCREEN_WIDTH = Dimensions.get('window').width
const DESTAQUE_HEIGHT = 200

type TabKey = 'courses' | 'cards' | 'about' | 'reviews'

function ProfileCardItem({ card }: { card: any }) {
  const [playing, setPlaying] = useState(false)
  const [thumbnail, setThumbnail] = useState<string | null>(null)

  useEffect(() => {
    if (card.video && !card.imagem) {
      VideoThumbnails.getThumbnailAsync(card.video, { time: 1000 })
        .then(({ uri }) => setThumbnail(uri))
        .catch(() => {})
    }
  }, [card.video, card.imagem])

  const previewImage = card.imagem ?? thumbnail

  return (
    <View className="bg-dark-surface rounded-2xl mb-3 overflow-hidden border border-darkBorder-subtle">
      {card.video ? (
        playing ? (
          <Video
            source={{ uri: card.video }}
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
            className="w-full h-48 bg-dark-surfaceLight items-center justify-center"
            activeOpacity={0.8}
          >
            {previewImage && (
              <Image source={{ uri: previewImage }} className="w-full h-48 absolute" contentFit="cover" />
            )}
            <View className="items-center justify-center w-14 h-14 rounded-full bg-black/50">
              <Ionicons name="play" size={28} color="#fff" />
            </View>
          </TouchableOpacity>
        )
      ) : card.imagem ? (
        <Image source={{ uri: card.imagem }} className="w-full h-48" contentFit="cover" />
      ) : null}
      <View className="p-4">
        {card.titulo && (
          <Text className="text-base font-semibold text-darkText mb-1">{card.titulo}</Text>
        )}
        {card.descricao && (
          <Text className="text-sm text-darkText-secondary leading-5">{card.descricao}</Text>
        )}
        {card.created_at && (
          <Text className="text-xs text-darkText-muted mt-2">
            {format(new Date(card.created_at), 'dd/MM/yyyy')}
          </Text>
        )}
      </View>
    </View>
  )
}

export default function ProfessorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('courses')

  const colors = useThemeColors()
  const { data: professor, isLoading } = useProfessorDetail(id!)
  const { data: courses } = useProfessorCourses(id!)
  const { data: reviews } = useProfessorReviews(id!)
  const { data: cards } = useProfessorCardsByProfessor(id!)
  const { data: isFollowing } = useIsFollowing(id!)
  const toggleFollow = useToggleFollow()

  if (isLoading) return <LoadingSpinner />
  if (!professor) return null

  const destaques: string[] = (professor as any).fotos_destaque ?? []

  const socialLinks = [
    { key: 'instagram', icon: 'logo-instagram' as const, url: professor.instagram },
    { key: 'youtube', icon: 'logo-youtube' as const, url: professor.youtube },
    { key: 'facebook', icon: 'logo-facebook' as const, url: professor.facebook },
    { key: 'tiktok', icon: 'logo-tiktok' as const, url: professor.tiktok },
  ].filter((s) => !!s.url)

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'courses', label: 'Cursos' },
    { key: 'cards', label: 'Cards' },
    { key: 'about', label: 'Currículo' },
    { key: 'reviews', label: 'Avaliações' },
  ]

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <View className="relative">
          {professor.foto_capa ? (
            <Image source={{ uri: professor.foto_capa }} style={{ width: '100%', height: 160 }} contentFit="cover" />
          ) : (
            <View style={{ width: '100%', height: 160 }} className="bg-dark-surfaceLight" />
          )}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/50 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Avatar + Info */}
        <View className="items-center -mt-12 px-4">
          {professor.foto_perfil ? (
            <Image
              source={{ uri: professor.foto_perfil }}
              className="w-24 h-24 rounded-full border-4 border-dark-bg"
            />
          ) : (
            <View className="w-24 h-24 rounded-full border-4 border-dark-bg bg-dark-surfaceLight items-center justify-center">
              <Ionicons name="person" size={36} color="#60a5fa" />
            </View>
          )}

          <Text className="text-xl font-bold text-darkText mt-2.5 text-center">
            {professor.nome_professor}
          </Text>

          {/* Rating */}
          <View className="flex-row items-center mt-1">
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text className="text-sm font-semibold text-darkText-secondary ml-1">
              {(professor.average_rating ?? 0).toFixed(1)}
            </Text>
            {reviews && (
              <Text className="text-xs text-darkText-muted ml-1">
                ({reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'})
              </Text>
            )}
          </View>

          {/* Follow Button */}
          <TouchableOpacity
            onPress={() => toggleFollow.mutate({ professorId: id!, isFollowing: !!isFollowing })}
            disabled={toggleFollow.isPending}
            className={`flex-row items-center gap-2 mt-4 px-8 py-3 rounded-2xl ${isFollowing ? 'bg-dark-surfaceLight' : 'bg-primary'}`}
          >
            <Ionicons
              name={isFollowing ? 'checkmark-circle' : 'person-add-outline'}
              size={16}
              color={isFollowing ? colors.textMuted : '#ffffff'}
            />
            <Text className={`text-sm font-semibold ${isFollowing ? 'text-darkText-muted' : 'text-white'}`}>
              {isFollowing ? 'Seguindo' : 'Seguir'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Meus Destaques - image carousel */}
        {destaques.length > 0 && (
          <DestaqueCarousel destaques={destaques} />
        )}

        {/* Redes Sociais */}
        {socialLinks.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ textAlign: 'center' }} className="text-base font-bold text-darkText mb-3">Redes Sociais</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', gap: 20 }}>
              {socialLinks.map((s) => {
                const iconColor = s.key === 'instagram' ? '#E4405F' : s.key === 'youtube' ? '#FF0000' : s.key === 'facebook' ? '#1877F2' : '#69C9D0'
                return (
                  <TouchableOpacity
                    key={s.key}
                    onPress={() => Linking.openURL(s.url!)}
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${iconColor}15` }}
                  >
                    <Ionicons name={s.icon} size={24} color={iconColor} />
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )}

        {/* Tabs */}
        <View className="flex-row border-b border-darkBorder-subtle px-4 mt-5">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`pb-3 mr-5 ${activeTab === tab.key ? 'border-b-2 border-accent' : ''}`}
            >
              <Text className={`text-sm font-semibold ${activeTab === tab.key ? 'text-accent' : 'text-darkText-muted'}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        <View className="px-4 pt-4 pb-8">
          {activeTab === 'courses' && (
            <View>
              {!courses?.length ? (
                <Text className="text-sm text-darkText-muted">Nenhum curso disponível.</Text>
              ) : (
                courses.map((c) => (
                  <CourseCard
                    key={c.id}
                    id={c.id}
                    nome={c.nome}
                    imagem={c.imagem}
                    preco={c.preco ?? 0}
                    average_rating={c.average_rating}
                  />
                ))
              )}
            </View>
          )}

          {activeTab === 'cards' && (
            <View>
              {!cards?.length ? (
                <Text className="text-sm text-darkText-muted">Nenhum card publicado.</Text>
              ) : (
                cards.map((card: any) => (
                  <ProfileCardItem key={card.id} card={card} />
                ))
              )}
            </View>
          )}

          {activeTab === 'about' && (
            <View>
              {professor.descricao && (
                <View className="mb-4">
                  <Text className="text-sm text-darkText-secondary leading-6">{professor.descricao}</Text>
                </View>
              )}
              {professor.biografia && (
                <View className="bg-dark-surface rounded-2xl p-4 border border-darkBorder-subtle">
                  <Text className="text-xs font-semibold text-darkText-muted uppercase tracking-wider mb-2">Biografia</Text>
                  <Text className="text-sm text-darkText-secondary leading-6">{professor.biografia}</Text>
                </View>
              )}
              {!professor.descricao && !professor.biografia && (
                <Text className="text-sm text-darkText-muted">Nenhuma informação disponível.</Text>
              )}
            </View>
          )}

          {activeTab === 'reviews' && (
            <View>
              {!reviews?.length ? (
                <Text className="text-sm text-darkText-muted">Nenhuma avaliação ainda.</Text>
              ) : (
                reviews.map((review: any) => (
                  <View key={review.id} className="mb-3 pb-3 border-b border-darkBorder-subtle">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-semibold text-darkText">
                        {review.user?.display_name ?? 'Aluno'}
                      </Text>
                      <View className="flex-row items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Ionicons
                            key={i}
                            name={i < (review.rating ?? 0) ? 'star' : 'star-outline'}
                            size={12}
                            color="#f59e0b"
                          />
                        ))}
                      </View>
                    </View>
                    {review.comentario && (
                      <Text className="text-sm text-darkText-secondary mt-1.5 leading-5">{review.comentario}</Text>
                    )}
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function DestaqueCarousel({ destaques }: { destaques: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0)
    }
  }, [])

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current

  useEffect(() => {
    if (destaques.length <= 1) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % destaques.length
        flatListRef.current?.scrollToIndex({ index: next, animated: true })
        return next
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [destaques.length])

  return (
    <View className="mt-5">
      <Text className="text-base font-bold text-darkText px-4 mb-3">Meus Destaques</Text>
      <FlatList
        ref={flatListRef}
        data={destaques}
        keyExtractor={(_, i) => `dest-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ height: DESTAQUE_HEIGHT }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width: SCREEN_WIDTH, height: DESTAQUE_HEIGHT }}
            contentFit="cover"
          />
        )}
      />
      {destaques.length > 1 && (
        <View className="flex-row justify-center mt-2 gap-1.5">
          {destaques.map((_, i) => (
            <View
              key={i}
              className={`w-2 h-2 rounded-full ${i === activeIndex ? 'bg-primary' : 'bg-darkText-muted opacity-40'}`}
            />
          ))}
        </View>
      )}
    </View>
  )
}
