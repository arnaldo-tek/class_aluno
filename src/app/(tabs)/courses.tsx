import { useState, useCallback } from 'react'
import { View, Text, FlatList, RefreshControl, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { t } from '@/i18n'
import { useCourses } from '@/hooks/useCourses'
import { useCategories } from '@/hooks/useHome'
import { CourseCard } from '@/components/CourseCard'
import { SearchInput } from '@/components/ui/SearchInput'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Ionicons } from '@expo/vector-icons'

export default function CoursesScreen() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch, isRefetching } = useCourses({
    search: search || undefined,
    categoriaId: selectedCategory,
    page,
  })

  const { data: categories } = useCategories()

  const handleRefresh = useCallback(() => {
    setPage(1)
    refetch()
  }, [refetch])

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900">{t('courses.title')}</Text>
      </View>

      <SearchInput value={search} onChangeText={(v) => { setSearch(v); setPage(1) }} />

      {/* Category chips */}
      {categories && categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
        >
          <TouchableOpacity
            onPress={() => { setSelectedCategory(undefined); setPage(1) }}
            className={`rounded-full px-3 py-1.5 mr-2 ${!selectedCategory ? 'bg-blue-600' : 'bg-white border border-gray-200'}`}
          >
            <Text className={`text-sm font-medium ${!selectedCategory ? 'text-white' : 'text-gray-700'}`}>
              Todos
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => { setSelectedCategory(cat.id === selectedCategory ? undefined : cat.id); setPage(1) }}
              className={`rounded-full px-3 py-1.5 mr-2 ${selectedCategory === cat.id ? 'bg-blue-600' : 'bg-white border border-gray-200'}`}
            >
              <Text className={`text-sm font-medium ${selectedCategory === cat.id ? 'text-white' : 'text-gray-700'}`}>
                {cat.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : !data?.courses.length ? (
        <EmptyState
          title={t('common.noResults')}
          icon={<Ionicons name="book-outline" size={48} color="#9ca3af" />}
        />
      ) : (
        <FlatList
          data={data.courses}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <CourseCard
              id={item.id}
              nome={item.nome}
              imagem={item.imagem}
              preco={item.preco ?? 0}
              professor_nome={item.professor_nome}
              average_rating={item.average_rating}
            />
          )}
          onEndReached={() => {
            if (data.hasMore) setPage((p) => p + 1)
          }}
          onEndReachedThreshold={0.5}
        />
      )}
    </SafeAreaView>
  )
}
