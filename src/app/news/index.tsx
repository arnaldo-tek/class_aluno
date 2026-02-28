import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Image, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { useNews, useNewsCategories, useNewsFilterOptions } from '@/hooks/useNews'
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
  const [showFilters, setShowFilters] = useState(false)

  const { data: categories } = useNewsCategories()
  const { data: news, isLoading } = useNews({
    search, categoriaId: selectedCategory, estado, cidade, orgao, disciplina,
  })

  const selectedCat = categories?.find((c) => c.id === selectedCategory)
  const { data: estadoOptions } = useNewsFilterOptions('estado')
  const { data: cidadeOptions } = useNewsFilterOptions('cidade')
  const { data: orgaoOptions } = useNewsFilterOptions('orgao')
  const { data: disciplinaOptions } = useNewsFilterOptions('disciplina')

  const hasActiveFilters = !!(estado || cidade || orgao || disciplina)
  const hasFilterOptions = !!(estadoOptions?.length || cidadeOptions?.length || orgaoOptions?.length || disciplinaOptions?.length)

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder-subtle bg-dark-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-darkText flex-1">{t('news.title')}</Text>
        {hasFilterOptions && (
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)} className="p-1">
            <Ionicons name="options-outline" size={20} color={hasActiveFilters ? '#60a5fa' : '#9ca3af'} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View className="flex-row items-center bg-dark-surfaceLight rounded-xl px-3 py-2 mx-4 mt-3">
        <Ionicons name="search" size={16} color="#9ca3af" />
        <TextInput
          className="flex-1 ml-2 text-sm text-darkText"
          placeholder={t('common.search')}
          placeholderTextColor="#6b7280"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      {/* Category chips */}
      {categories && categories.length > 0 && (
        <View className="flex-row flex-wrap px-4 pt-2 pb-1">
          <TouchableOpacity
            onPress={() => setSelectedCategory(null)}
            className={`px-3 py-1 mr-1.5 mb-1.5 rounded-full ${!selectedCategory ? 'bg-primary' : 'bg-dark-surfaceLight'}`}
          >
            <Text className={`text-xs font-medium ${!selectedCategory ? 'text-white' : 'text-darkText-muted'}`}>
              Todas
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 mr-1.5 mb-1.5 rounded-full ${selectedCategory === cat.id ? 'bg-primary' : 'bg-dark-surfaceLight'}`}
            >
              <Text className={`text-xs font-medium ${selectedCategory === cat.id ? 'text-white' : 'text-darkText-muted'}`}>
                {cat.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Filter dropdowns (collapsible) */}
      {showFilters && (
        <View className="flex-row flex-wrap px-4 pb-2">
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
        </View>
      )}

      {/* News list */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={news}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          ListEmptyComponent={
            <EmptyState
              title={t('news.noNews')}
              icon={<Ionicons name="newspaper-outline" size={48} color="#9ca3af" />}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/news/[id]', params: { id: item.id } })}
              className="bg-dark-surface rounded-2xl mb-3 overflow-hidden border border-darkBorder-subtle"
              activeOpacity={0.7}
            >
              {item.imagem ? (
                <Image source={{ uri: item.imagem }} className="w-full h-40" resizeMode="cover" />
              ) : (
                <View className="w-full h-24 bg-dark-surfaceLight items-center justify-center">
                  <Ionicons name="newspaper-outline" size={32} color="#4b5563" />
                </View>
              )}
              <View className="p-3.5">
                <Text className="text-sm font-semibold text-darkText" numberOfLines={2}>
                  {item.titulo}
                </Text>
                {item.descricao && (
                  <Text className="text-xs text-darkText-muted mt-1" numberOfLines={2}>
                    {item.descricao}
                  </Text>
                )}
                {item.created_at && (
                  <Text className="text-[11px] text-darkText-muted mt-2">
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
