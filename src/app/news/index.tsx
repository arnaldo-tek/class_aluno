import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { useNews, useNewsCategories, useNewsFilterOptions } from '@/hooks/useNews'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { FilterDropdown } from '@/components/FilterDropdown'
import { t } from '@/i18n'

export default function NewsScreen() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [estado, setEstado] = useState<string | null>(null)
  const [cidade, setCidade] = useState<string | null>(null)
  const [orgao, setOrgao] = useState<string | null>(null)
  const [disciplina, setDisciplina] = useState<string | null>(null)

  const { data: categories } = useNewsCategories()
  const { data: news, isLoading } = useNews({
    search, categoriaId: selectedCategory, estado, cidade, orgao, disciplina,
  })

  // Find selected category to check which filters are enabled
  const selectedCat = categories?.find((c) => c.id === selectedCategory)

  const { data: estadoOptions } = useNewsFilterOptions('estado')
  const { data: cidadeOptions } = useNewsFilterOptions('cidade')
  const { data: orgaoOptions } = useNewsFilterOptions('orgao')
  const { data: disciplinaOptions } = useNewsFilterOptions('disciplina')

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900 flex-1">{t('news.title')}</Text>
      </View>

      <SearchInput value={search} onChangeText={setSearch} />

      {/* Category chips */}
      {categories && categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pb-2">
          <TouchableOpacity
            onPress={() => setSelectedCategory(null)}
            className={`px-4 py-2 mr-2 rounded-full border ${
              !selectedCategory ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
            }`}
          >
            <Text className={`text-sm font-medium ${!selectedCategory ? 'text-white' : 'text-gray-700'}`}>
              {t('common.seeAll')}
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 mr-2 rounded-full border ${
                selectedCategory === cat.id ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
              }`}
            >
              <Text className={`text-sm font-medium ${
                selectedCategory === cat.id ? 'text-white' : 'text-gray-700'
              }`}>
                {cat.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Conditional filter dropdowns */}
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
          data={news}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          ListEmptyComponent={
            <EmptyState
              title={t('news.noNews')}
              icon={<Ionicons name="newspaper-outline" size={48} color="#9ca3af" />}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/news/${item.id}`)}
              className="flex-row bg-white rounded-xl mb-3 overflow-hidden border border-gray-100"
            >
              {item.imagem ? (
                <Image source={{ uri: item.imagem }} className="w-24 h-24" resizeMode="cover" />
              ) : (
                <View className="w-24 h-24 bg-gray-100 items-center justify-center">
                  <Ionicons name="newspaper-outline" size={24} color="#9ca3af" />
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
                {item.created_at && (
                  <Text className="text-xs text-gray-400 mt-1">
                    {format(new Date(item.created_at), 'dd/MM/yyyy')}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}
