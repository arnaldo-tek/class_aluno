import { View, Text, ScrollView, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useRef, useEffect, useState } from 'react'
import { t } from '@/i18n'
import { useBanners, useCategories, useTopProfessors, useRecentNews } from '@/hooks/useHome'
import { useFeaturedCourses } from '@/hooks/useCourses'
import { usePackages } from '@/hooks/usePackages'
import { useUnreadNotificationsCount } from '@/hooks/useNotifications'
import { useUnreadChatsCount } from '@/hooks/useChat'
import { CourseCard } from '@/components/CourseCard'
import { ProfessorCard } from '@/components/ProfessorCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Ionicons } from '@expo/vector-icons'

const SCREEN_WIDTH = Dimensions.get('window').width

export default function HomeScreen() {
  const router = useRouter()
  const { data: unreadNotifications } = useUnreadNotificationsCount()
  const { data: unreadChats } = useUnreadChatsCount()

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-4 pt-4 pb-3">
          <Text className="text-2xl font-bold text-darkText flex-1">{t('home.title')}</Text>
          <TouchableOpacity onPress={() => router.push('/chat')} className="relative mr-4 p-1">
            <Ionicons name="chatbubbles-outline" size={24} color="#6b7280" />
            {(unreadChats ?? 0) > 0 && (
              <View className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-accent items-center justify-center">
                <Text className="text-[10px] font-bold text-darkText-inverse">{unreadChats}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/notifications')} className="relative p-1">
            <Ionicons name="notifications-outline" size={24} color="#6b7280" />
            {(unreadNotifications ?? 0) > 0 && (
              <View className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-accent items-center justify-center">
                <Text className="text-[10px] font-bold text-darkText-inverse">{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Banners */}
        <BannerCarousel />

        {/* Featured Courses */}
        <FeaturedSection />

        {/* Categories */}
        <CategoriesSection />

        {/* Top Professors */}
        <ProfessorsSection />

        {/* Packages */}
        <PackagesSection />

        {/* Recent News */}
        <NewsSection />

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  )
}

function BannerCarousel() {
  const { data: banners } = useBanners()
  const flatListRef = useRef<FlatList>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const BANNER_WIDTH = SCREEN_WIDTH - 32

  useEffect(() => {
    if (!banners?.length || banners.length <= 1) return
    const interval = setInterval(() => {
      const next = (currentIndex + 1) % banners.length
      flatListRef.current?.scrollToOffset({ offset: next * BANNER_WIDTH, animated: true })
      setCurrentIndex(next)
    }, 4000)
    return () => clearInterval(interval)
  }, [currentIndex, banners?.length])

  if (!banners?.length) return null

  return (
    <View className="mb-5 px-4">
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled={false}
        decelerationRate="fast"
        snapToInterval={BANNER_WIDTH}
        snapToAlignment="start"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH)
          setCurrentIndex(index)
        }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ width: BANNER_WIDTH }} className="h-44 rounded-2xl overflow-hidden">
            {item.imagem ? (
              <Image source={{ uri: item.imagem }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <View className="w-full h-full bg-primary-50 items-center justify-center">
                <Ionicons name="megaphone-outline" size={32} color="#3b82f6" />
              </View>
            )}
          </View>
        )}
      />
      {banners.length > 1 && (
        <View className="flex-row justify-center mt-3">
          {banners.map((_, i) => (
            <View
              key={i}
              className={`h-1.5 rounded-full mx-1 ${i === currentIndex ? 'w-6 bg-accent' : 'w-1.5 bg-darkBorder-light'}`}
            />
          ))}
        </View>
      )}
    </View>
  )
}

function FeaturedSection() {
  const { data: courses } = useFeaturedCourses()
  const router = useRouter()

  if (!courses?.length) return null

  return (
    <View className="mb-5">
      <SectionHeader
        title={t('home.featured')}
        onSeeAll={() => router.push('/courses')}
      />
      <FlatList
        data={courses}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CourseCard
            id={item.id}
            nome={item.nome}
            imagem={item.imagem}
            preco={item.preco ?? 0}
            professor_nome={item.professor_nome}
            average_rating={item.average_rating}
            horizontal
          />
        )}
      />
    </View>
  )
}

function CategoriesSection() {
  const { data: categories } = useCategories()
  const router = useRouter()

  if (!categories?.length) return null

  return (
    <View className="mb-5">
      <SectionHeader title={t('home.categories')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => router.push({ pathname: '/courses', params: { categoria: cat.id } })}
            className="bg-dark-surfaceLight rounded-full px-4 py-2.5 mr-2"
            activeOpacity={0.7}
          >
            <Text className="text-sm font-medium text-darkText-secondary">{cat.nome}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

function ProfessorsSection() {
  const { data: professors } = useTopProfessors()

  if (!professors?.length) return null

  return (
    <View className="mb-5">
      <SectionHeader title={t('home.professors')} />
      <FlatList
        data={professors}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProfessorCard
            id={item.id}
            nome={item.nome_professor}
            foto={item.foto_perfil}
            average_rating={item.average_rating}
          />
        )}
      />
    </View>
  )
}

function PackagesSection() {
  const { data: packages } = usePackages()
  const router = useRouter()

  if (!packages?.length) return null

  return (
    <View className="mb-5">
      <SectionHeader title={t('packages.title')} onSeeAll={() => router.push('/(tabs)/packages')} />
      <FlatList
        data={packages.slice(0, 5)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/packages/[id]', params: { id: item.id } })}
            className="bg-dark-surface rounded-2xl mr-3 overflow-hidden border border-darkBorder-subtle"
            style={{ width: 200 }}
            activeOpacity={0.7}
          >
            {item.imagem ? (
              <Image source={{ uri: item.imagem }} className="w-full h-24" resizeMode="cover" />
            ) : (
              <View className="w-full h-24 bg-primary-50 items-center justify-center">
                <Ionicons name="cube-outline" size={28} color="#60a5fa" />
              </View>
            )}
            <View className="p-3">
              <Text className="text-sm font-semibold text-darkText" numberOfLines={1}>{item.nome}</Text>
              <Text className="text-xs font-bold text-primary-light mt-1">
                R$ {((item.preco ?? 0) / 100).toFixed(2)}{t('packages.perMonth')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

function NewsSection() {
  const { data: news } = useRecentNews()
  const router = useRouter()

  if (!news?.length) return null

  return (
    <View className="mb-4">
      <SectionHeader title={t('home.news')} onSeeAll={() => router.push('/news')} />
      {news.map((item) => (
        <TouchableOpacity
          key={item.id}
          onPress={() => router.push({ pathname: '/news/[id]', params: { id: item.id } })}
          className="flex-row bg-dark-surface rounded-2xl mx-4 mb-2.5 overflow-hidden"
        >
          {item.imagem ? (
            <Image source={{ uri: item.imagem }} className="w-20 h-20" resizeMode="cover" />
          ) : (
            <View className="w-20 h-20 bg-dark-surfaceLight items-center justify-center">
              <Ionicons name="newspaper-outline" size={20} color="#9ca3af" />
            </View>
          )}
          <View className="flex-1 p-3.5 justify-center">
            <Text className="text-sm font-semibold text-darkText" numberOfLines={2}>
              {item.titulo}
            </Text>
            {item.descricao && (
              <Text className="text-xs text-darkText-muted mt-1" numberOfLines={1}>
                {item.descricao}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  )
}
