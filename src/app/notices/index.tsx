import { useState } from 'react'
import { View, Text, FlatList, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useNotices, useNoticeCategories, useNoticeFilterOptions } from '@/hooks/useNotices'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { FilterDropdown, FilterDropdownMulti } from '@/components/FilterDropdown'
import { t } from '@/i18n'
import { useThemeColors } from '@/hooks/useThemeColors'

export default function NoticesScreen() {
  const router = useRouter()
  const colors = useThemeColors()
  const [search, setSearch] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [estadoId, setEstadoId] = useState<string | null>(null)
  const [municipioId, setMunicipioId] = useState<string | null>(null)
  const [orgao, setOrgao] = useState<string | null>(null)
  const [cargo, setCargo] = useState<string | null>(null)
  const [disciplina, setDisciplina] = useState<string | null>(null)

  const { data: categories } = useNoticeCategories()
  const { data: notices, isLoading } = useNotices({
    search, categoriaIds: selectedCategories, estadoId, municipioId, orgao, cargo, disciplina,
  })

  const selectedCats = selectedCategories.length > 0
    ? categories?.filter((c) => selectedCategories.includes(c.id)) ?? []
    : []

  const fEstado = selectedCats.length > 0 && selectedCats.some((c) => c.filtro_estado)
  const fCidade = selectedCats.length > 0 && selectedCats.some((c) => c.filtro_cidade)
  const fOrgao = selectedCats.length > 0 && selectedCats.some((c) => c.filtro_orgao_editais_noticias)
  const fCargo = selectedCats.length > 0 && selectedCats.some((c) => c.filtro_cargo)
  const fDisciplina = selectedCats.length > 0 && selectedCats.some((c) => c.filtro_disciplina)

  const { data: estadoOptions } = useNoticeFilterOptions('estado', selectedCategories, fEstado)
  const { data: cidadeOptions } = useNoticeFilterOptions('cidade', selectedCategories, fCidade)
  const { data: orgaoOptions } = useNoticeFilterOptions('orgao', selectedCategories, fOrgao)
  const { data: cargoOptions } = useNoticeFilterOptions('cargo', selectedCategories, fCargo)
  const { data: disciplinaOptions } = useNoticeFilterOptions('disciplina', selectedCategories, fDisciplina)

  const hasSubFilters = fEstado || fCidade || fOrgao || fCargo || fDisciplina

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder-subtle bg-dark-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-base font-bold text-darkText flex-1">{t('notices.title')}</Text>
      </View>

      <SearchInput value={search} onChangeText={setSearch} className="flex-row items-center bg-dark-surfaceLight rounded-2xl px-4 py-2.5 mx-4 my-3" />

      {/* Category filter (multi-select) */}
      {categories && categories.length > 0 && (
        <View className="flex-row px-4 pt-2 pb-1">
          <FilterDropdownMulti
            label="Todas as categorias"
            values={selectedCategories}
            options={categories.map((c) => ({ label: c.nome, value: c.id }))}
            onChange={(vals) => {
              setSelectedCategories(vals)
              setEstadoId(null); setMunicipioId(null); setOrgao(null)
              setCargo(null); setDisciplina(null)
            }}
          />
        </View>
      )}

      {/* Sub-filters */}
      {hasSubFilters && (
        <View className="flex-row items-center py-2 border-b border-darkBorder-subtle">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {fEstado && estadoOptions && estadoOptions.length > 0 && (
              <FilterDropdown label="Estado" value={estadoId} options={estadoOptions} onChange={(val) => { setEstadoId(val); setMunicipioId(null) }} />
            )}
            {fCidade && cidadeOptions && cidadeOptions.length > 0 && (
              <FilterDropdown label="Cidade" value={municipioId} options={cidadeOptions} onChange={setMunicipioId} />
            )}
            {fOrgao && orgaoOptions && orgaoOptions.length > 0 && (
              <FilterDropdown label="Órgão" value={orgao} options={orgaoOptions} onChange={setOrgao} />
            )}
            {fCargo && cargoOptions && cargoOptions.length > 0 && (
              <FilterDropdown label="Cargo" value={cargo} options={cargoOptions} onChange={setCargo} />
            )}
            {fDisciplina && disciplinaOptions && disciplinaOptions.length > 0 && (
              <FilterDropdown label="Disciplina" value={disciplina} options={disciplinaOptions} onChange={setDisciplina} />
            )}
          </ScrollView>
          {(estadoId || municipioId || orgao || cargo || disciplina) && (
            <TouchableOpacity
              onPress={() => { setEstadoId(null); setMunicipioId(null); setOrgao(null); setCargo(null); setDisciplina(null) }}
              className="pr-4 pl-2"
            >
              <Ionicons name="close-circle" size={22} color="#f87171" />
            </TouchableOpacity>
          )}
        </View>
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
