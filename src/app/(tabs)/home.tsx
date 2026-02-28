import { View, Text, ScrollView, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useRef, useEffect, useState } from 'react'
import { t } from '@/i18n'
import { useBanners, useCategories, useTopProfessors, useRecentNews } from '@/hooks/useHome'
import { useFeaturedCourses } from '@/hooks/useCourses'
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
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold text-gray-900 flex-1">{t('home.title')}</Text>
          <TouchableOpacity onPress={() => router.push('/chat')} className="relative mr-4">
            <Ionicons name="chatbubbles-outline" size={24} color="#374151" />
            {(unreadChats ?? 0) > 0 && (
              <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 items-center justify-center">
                <Text className="text-[10px] font-bold text-white">{unreadChats}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/notifications')} className="relative">
            <Ionicons name="notifications-outline" size={24} color="#374151" />
            {(unreadNotifications ?? 0) > 0 && (
              <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 items-center justify-center">
                <Text className="text-[10px] font-bold text-white">{unreadNotifications}</Text>
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

  useEffect(() => {
    if (!banners?.length || banners.length <= 1) return
    const interval = setInterval(() => {
      const next = (currentIndex + 1) % banners.length
      flatListRef.current?.scrollToIndex({ index: next, animated: true })
      setCurrentIndex(next)
    }, 4000)
    return () => clearInterval(interval)
  }, [currentIndex, banners?.length])

  if (!banners?.length) return null

  return (
    <View className="mb-4">
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32))
          setCurrentIndex(index)
        }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_WIDTH - 32 }} className="h-40 rounded-xl overflow-hidden mr-3">
            {item.imagem ? (
              <Image source={{ uri: item.imagem }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <View className="w-full h-full bg-blue-100 items-center justify-center">
                <Ionicons name="megaphone-outline" size={32} color="#2563eb" />
              </View>
            )}
          </View>
        )}
      />
      {banners.length > 1 && (
        <View className="flex-row justify-center mt-2">
          {banners.map((_, i) => (
            <View
              key={i}
              className={`w-2 h-2 rounded-full mx-1 ${i === currentIndex ? 'bg-blue-600' : 'bg-gray-300'}`}
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
    <View className="mb-4">
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
    <View className="mb-4">
      <SectionHeader title={t('home.categories')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => router.push(`/courses?categoria=${cat.id}`)}
            className="bg-white border border-gray-200 rounded-full px-4 py-2 mr-2"
            activeOpacity={0.7}
          >
            <Text className="text-sm font-medium text-gray-700">{cat.nome}</Text>
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
    <View className="mb-4">
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
          onPress={() => router.push(`/news/${item.id}`)}
          className="flex-row bg-white rounded-xl mx-4 mb-2 overflow-hidden border border-gray-100"
        >
          {item.imagem ? (
            <Image source={{ uri: item.imagem }} className="w-20 h-20" resizeMode="cover" />
          ) : (
            <View className="w-20 h-20 bg-gray-100 items-center justify-center">
              <Ionicons name="newspaper-outline" size={20} color="#9ca3af" />
            </View>
          )}
          <View className="flex-1 p-3 justify-center">
            <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>
              {item.titulo}
            </Text>
            {item.descricao && (
              <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
                {item.descricao}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  )
}
