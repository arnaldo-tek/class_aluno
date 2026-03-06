import { useState } from 'react'
import { View, Text, FlatList, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useNotices, useNoticeCategories, useNoticeFilterOptions } from '@/hooks/useNotices'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { FilterDropdown } from '@/components/FilterDropdown'
import { t } from '@/i18n'
import { useThemeColors } from '@/hooks/useThemeColors'

export default function NoticesScreen() {
  const router = useRouter()
  const colors = useThemeColors()
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

  const categoryOptions = (categories ?? []).map((c) => ({ label: c.nome, value: c.id }))

  const showEstado = (!selectedCat || selectedCat.filtro_estado) && !!estadoOptions?.length
  const showCidade = (!selectedCat || selectedCat.filtro_cidade) && !!cidadeOptions?.length
  const showOrgao = (!selectedCat || selectedCat.filtro_orgao) && !!orgaoOptions?.length
  const showDisciplina = (!selectedCat || selectedCat.filtro_disciplina) && !!disciplinaOptions?.length
  const hasSubFilters = showEstado || showCidade || showOrgao || showDisciplina

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder-subtle bg-dark-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-base font-bold text-darkText flex-1">{t('notices.title')}</Text>
      </View>

      <SearchInput value={search} onChangeText={setSearch} className="flex-row items-center bg-dark-surfaceLight rounded-2xl px-4 py-2.5 mx-4 my-3" />

      {/* Category filter */}
      {categoryOptions.length > 0 && (
        <View className="flex-row px-4 pb-1">
          <FilterDropdown
            label="Todas as categorias"
            value={selectedCategory}
            options={categoryOptions}
            onChange={(val) => {
              setSelectedCategory(val)
              setEstado(null)
              setCidade(null)
              setOrgao(null)
              setDisciplina(null)
            }}
          />
        </View>
      )}

      {/* Sub-filters */}
      {hasSubFilters && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          {showEstado && (
            <FilterDropdown label={t('news.estado')} value={estado} options={estadoOptions!} onChange={setEstado} />
          )}
          {showCidade && (
            <FilterDropdown label={t('news.cidade')} value={cidade} options={cidadeOptions!} onChange={setCidade} />
          )}
          {showOrgao && (
            <FilterDropdown label={t('news.orgao')} value={orgao} options={orgaoOptions!} onChange={setOrgao} />
          )}
          {showDisciplina && (
            <FilterDropdown label={t('news.disciplina')} value={disciplina} options={disciplinaOptions!} onChange={setDisciplina} />
          )}
        </ScrollView>
      )}

      {/* Notices list */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={notices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          className="flex-1"
          ListEmptyComponent={
            <EmptyState
              title={t('notices.noNotices')}
              icon={<Ionicons name="document-text-outline" size={48} color={colors.textMuted} />}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/notices/[id]', params: { id: item.id } })}
              className="bg-dark-surface rounded-2xl mb-3 p-4 border border-darkBorder-subtle"
              activeOpacity={0.7}
            >
              <Text className="text-base font-semibold text-darkText" numberOfLines={2}>
                {item.titulo}
              </Text>
              {item.resumo && (
                <Text className="text-sm text-darkText-secondary mt-1" numberOfLines={2}>
                  {item.resumo}
                </Text>
              )}
              <View className="flex-row items-center mt-2 flex-wrap gap-1">
                {(item as any).categorias?.nome && (
                  <View className="bg-primary-50 px-2.5 py-1 rounded-full">
                    <Text className="text-xs text-primary-light font-medium">{(item as any).categorias.nome}</Text>
                  </View>
                )}
                {(item as any).professor_profiles?.nome_professor && (
                  <Text className="text-xs text-darkText-muted ml-2">
                    {t('notices.professor')}: {(item as any).professor_profiles.nome_professor}
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
