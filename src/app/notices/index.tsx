import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useNotices, useNoticeCategories, useNoticeFilterOptions } from '@/hooks/useNotices'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { FilterDropdown } from '@/components/FilterDropdown'
import { t } from '@/i18n'

export default function NoticesScreen() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [estado, setEstado] = useState<string | null>(null)
  const [cidade, setCidade] = useState<string | null>(null)
  const [orgao, setOrgao] = useState<string | null>(null)
  const [disciplina, setDisciplina] = useState<string | null>(null)

  const { data: categories } = useNoticeCategories()
  const { data: notices, isLoading } = useNotices({
    search, categoriaId: selectedCategory, estado, cidade, orgao, disciplina,
  })

  const selectedCat = categories?.find((c) => c.id === selectedCategory)

  const { data: estadoOptions } = useNoticeFilterOptions('estado')
  const { data: cidadeOptions } = useNoticeFilterOptions('cidade')
  const { data: orgaoOptions } = useNoticeFilterOptions('orgao')
  const { data: disciplinaOptions } = useNoticeFilterOptions('disciplina')

  // If no category selected, show category grid
  const showCategoryGrid = !selectedCategory && categories && categories.length > 0

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900 flex-1">{t('notices.title')}</Text>
      </View>

      <SearchInput value={search} onChangeText={setSearch} />

      {showCategoryGrid && !search ? (
        // Category grid view
        <FlatList
          data={categories}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          columnWrapperStyle={{ gap: 12 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item.id)}
              className="flex-1 bg-white rounded-xl p-4 border border-gray-100 items-center"
            >
              <Ionicons name="document-text-outline" size={32} color="#2563eb" />
              <Text className="text-sm font-medium text-gray-900 mt-2 text-center">{item.nome}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <>
          {/* Category pills + filters */}
          {selectedCategory && (
            <View className="px-4 pb-2">
              <TouchableOpacity
                onPress={() => setSelectedCategory(null)}
                className="flex-row items-center mb-2"
              >
                <Ionicons name="arrow-back" size={16} color="#2563eb" />
                <Text className="text-sm text-blue-600 ml-1">{t('notices.categories')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pb-3">
            {(!selectedCat || selectedCat.filtro_estado) && estadoOptions && estadoOptions.length > 0 && (
              <FilterDropdown label={t('news.estado')} value={estado} options={estadoOptions} onChange={setEstado} />
            )}
            {(!selectedCat || selectedCat.filtro_cidade) && cidadeOptions && cidadeOptions.length > 0 && (
              <FilterDropdown label={t('news.cidade')} value={cidade} options={cidadeOptions} onChange={setCidade} />
            )}
            {(!selectedCat || selectedCat.filtro_orgao) && orgaoOptions && orgaoOptions.length > 0 && (
              <FilterDropdown label={t('news.orgao')} value={orgao} options={orgaoOptions} onChange={setOrgao} />
            )}
            {(!selectedCat || selectedCat.filtro_disciplina) && disciplinaOptions && disciplinaOptions.length > 0 && (
              <FilterDropdown label={t('news.disciplina')} value={disciplina} options={disciplinaOptions} onChange={setDisciplina} />
            )}
          </ScrollView>

          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <FlatList
              data={notices}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16, paddingTop: 0 }}
              ListEmptyComponent={
                <EmptyState
                  title={t('notices.noNotices')}
                  icon={<Ionicons name="document-text-outline" size={48} color="#9ca3af" />}
                />
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => router.push(`/notices/${item.id}`)}
                  className="bg-white rounded-xl mb-3 p-4 border border-gray-100"
                >
                  <Text className="text-base font-semibold text-gray-900" numberOfLines={2}>
                    {item.titulo}
                  </Text>
                  {item.resumo && (
                    <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
                      {item.resumo}
                    </Text>
                  )}
                  <View className="flex-row items-center mt-2 flex-wrap gap-1">
                    {(item as any).categorias?.nome && (
                      <View className="bg-blue-50 px-2 py-0.5 rounded">
                        <Text className="text-xs text-blue-700">{(item as any).categorias.nome}</Text>
                      </View>
                    )}
                    {(item as any).professor_profiles?.nome_professor && (
                      <Text className="text-xs text-gray-400 ml-2">
                        {t('notices.professor')}: {(item as any).professor_profiles.nome_professor}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      )}
    </SafeAreaView>
  )
}
