import { useState, useCallback } from 'react'
import { View, Text, FlatList, RefreshControl, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { t } from '@/i18n'
import { useCourses, useCourseFilterOptions } from '@/hooks/useCourses'
import { useCategories } from '@/hooks/useHome'
import { CourseCard } from '@/components/CourseCard'
import { SearchInput } from '@/components/ui/SearchInput'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterDropdown } from '@/components/FilterDropdown'
import { TopBar } from '@/components/TopBar'
import { DrawerMenu } from '@/components/DrawerMenu'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColors } from '@/hooks/useThemeColors'

export default function CoursesScreen() {
  const colors = useThemeColors()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
  const [estado, setEstado] = useState<string | null>(null)
  const [cidade, setCidade] = useState<string | null>(null)
  const [orgao, setOrgao] = useState<string | null>(null)
  const [cargo, setCargo] = useState<string | null>(null)
  const [disciplina, setDisciplina] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [drawerVisible, setDrawerVisible] = useState(false)

  const { data, isLoading, refetch, isRefetching } = useCourses({
    search: search || undefined,
    categoriaId: selectedCategory,
    estado, cidade, orgao, cargo, disciplina,
    page,
  })

  const { data: categories } = useCategories()

  const parentFilters = { estado, cidade, orgao, cargo }
  const { data: estadoOptions } = useCourseFilterOptions('estado')
  const { data: cidadeOptions } = useCourseFilterOptions('cidade', { estado })
  const { data: orgaoOptions } = useCourseFilterOptions('orgao', { estado, cidade })
  const { data: cargoOptions } = useCourseFilterOptions('cargo', { estado, cidade, orgao })
  const { data: disciplinaOptions } = useCourseFilterOptions('disciplina', parentFilters)

  const hasActiveFilters = !!(estado || cidade || orgao || cargo || disciplina)
  const hasFilterOptions = !!(estadoOptions?.length || cidadeOptions?.length || orgaoOptions?.length || cargoOptions?.length || disciplinaOptions?.length)

  function handleEstadoChange(v: string | null) {
    setEstado(v); setCidade(null); setOrgao(null); setCargo(null); setDisciplina(null); setPage(1)
  }
  function handleCidadeChange(v: string | null) {
    setCidade(v); setOrgao(null); setCargo(null); setDisciplina(null); setPage(1)
  }
  function handleOrgaoChange(v: string | null) {
    setOrgao(v); setCargo(null); setDisciplina(null); setPage(1)
  }
  function handleCargoChange(v: string | null) {
    setCargo(v); setDisciplina(null); setPage(1)
  }
  function handleDisciplinaChange(v: string | null) {
    setDisciplina(v); setPage(1)
  }

  const handleRefresh = useCallback(() => {
    setPage(1)
    refetch()
  }, [refetch])

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['left', 'right', 'bottom']}>
      <TopBar title="Catálogo" onMenuPress={() => setDrawerVisible(true)} />
      <DrawerMenu visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
      <View className="px-4 py-3 bg-dark-surface border-b border-darkBorder-subtle">
        <View className="flex-row items-center">
          <View className="flex-1">
            <SearchInput value={search} onChangeText={(v) => { setSearch(v); setPage(1) }} className="flex-row items-center bg-dark-surfaceLight rounded-xl px-3" style={{ height: 44 }} />
          </View>
          {hasFilterOptions && (
            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              className={`ml-2 rounded-xl items-center justify-center ${hasActiveFilters || showFilters ? 'bg-primary' : 'bg-dark-surfaceLight'}`}
              style={{ width: 44, height: 44 }}
            >
              <Ionicons name="options-outline" size={20} color={hasActiveFilters || showFilters ? '#ffffff' : colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category chips */}
      {categories && categories.length > 0 && (
        <View className="bg-dark-surface border-b border-darkBorder-subtle">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          >
            <TouchableOpacity
              onPress={() => { setSelectedCategory(undefined); setPage(1) }}
              className={`rounded-full px-4 py-2 mr-2 border ${!selectedCategory ? 'bg-primary border-primary' : 'bg-dark-surface border-darkBorder'}`}
            >
              <Text className={`text-sm font-semibold ${!selectedCategory ? 'text-white' : 'text-darkText-secondary'}`}>
                Todos
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => { setSelectedCategory(cat.id === selectedCategory ? undefined : cat.id); setPage(1) }}
                className={`rounded-full px-4 py-2 mr-2 border ${selectedCategory === cat.id ? 'bg-primary border-primary' : 'bg-dark-surface border-darkBorder'}`}
              >
                <Text className={`text-sm font-semibold ${selectedCategory === cat.id ? 'text-white' : 'text-darkText-secondary'}`}>
                  {cat.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Cascading filter dropdowns */}
      {showFilters && (
        <View className="flex-row items-center py-2 border-b border-darkBorder-subtle">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {estadoOptions && estadoOptions.length > 0 && (
              <FilterDropdown label="Estado" value={estado} options={estadoOptions} onChange={handleEstadoChange} />
            )}
            {estado && cidadeOptions && cidadeOptions.length > 0 && (
              <FilterDropdown label="Cidade" value={cidade} options={cidadeOptions} onChange={handleCidadeChange} />
            )}
            {cidade && orgaoOptions && orgaoOptions.length > 0 && (
              <FilterDropdown label="Órgão" value={orgao} options={orgaoOptions} onChange={handleOrgaoChange} />
            )}
            {orgao && cargoOptions && cargoOptions.length > 0 && (
              <FilterDropdown label="Cargo" value={cargo} options={cargoOptions} onChange={handleCargoChange} />
            )}
            {cargo && disciplinaOptions && disciplinaOptions.length > 0 && (
              <FilterDropdown label="Disciplina" value={disciplina} options={disciplinaOptions} onChange={handleDisciplinaChange} />
            )}
          </ScrollView>
          {hasActiveFilters && (
            <TouchableOpacity
              onPress={() => { setEstado(null); setCidade(null); setOrgao(null); setCargo(null); setDisciplina(null); setPage(1) }}
              className="pr-4 pl-2"
            >
              <Ionicons name="close-circle" size={22} color="#f87171" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : !data?.courses.length ? (
        <EmptyState
          title={t('common.noResults')}
          icon={<Ionicons name="book-outline" size={48} color={colors.textMuted} />}
        />
      ) : (
        <FlatList
          data={data.courses}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor="#2563eb"
              colors={['#2563eb']}
            />
          }
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
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
