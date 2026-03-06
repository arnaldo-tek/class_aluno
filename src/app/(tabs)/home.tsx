import { View, Text, ScrollView, FlatList, Image, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { t } from '@/i18n'
import { useCategories, useTopProfessors, useRecentNews } from '@/hooks/useHome'
import { useFeaturedCourses } from '@/hooks/useCourses'
import { usePackages } from '@/hooks/usePackages'
import { CourseCard } from '@/components/CourseCard'
import { ProfessorCard } from '@/components/ProfessorCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { BannerCarousel } from '@/components/BannerCarousel'
import { DrawerMenu } from '@/components/DrawerMenu'
import { TopBar } from '@/components/TopBar'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColors } from '@/hooks/useThemeColors'

export default function HomeScreen() {
  const router = useRouter()
  const colors = useThemeColors()
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const qc = useQueryClient()

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await qc.invalidateQueries()
    setRefreshing(false)
  }, [qc])

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['left', 'right', 'bottom']}>
      <TopBar onMenuPress={() => setDrawerVisible(true)} />
      <DrawerMenu visible={drawerVisible} onClose={() => setDrawerVisible(false)} />

      <ScrollView
        className="flex-1 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" colors={['#3b82f6']} />}
      >
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

        <View className="h-28" />
      </ScrollView>
    </SafeAreaView>
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
  const colors = useThemeColors()

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
              <Ionicons name="newspaper-outline" size={20} color={colors.textMuted} />
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
