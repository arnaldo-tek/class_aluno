import { useState } from 'react'
import { View, Text, FlatList, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { useNews, useNewsCategories, useNewsFilterOptions } from '@/hooks/useNews'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { FilterDropdown, FilterDropdownMulti } from '@/components/FilterDropdown'
import { t } from '@/i18n'
import { useThemeColors } from '@/hooks/useThemeColors'

export default function NewsScreen() {
  const router = useRouter()
  const colors = useThemeColors()
  const [search, setSearch] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [estadoId, setEstadoId] = useState<string | null>(null)
  const [municipioId, setMunicipioId] = useState<string | null>(null)
  const [orgao, setOrgao] = useState<string | null>(null)
  const [cargo, setCargo] = useState<string | null>(null)
  const [disciplina, setDisciplina] = useState<string | null>(null)
  const { data: categories } = useNewsCategories()
  const { data: news, isLoading } = useNews({
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

  const { data: estadoOptions } = useNewsFilterOptions('estado', selectedCategories, fEstado)
  const { data: cidadeOptions } = useNewsFilterOptions('cidade', selectedCategories, fCidade)
  const { data: orgaoOptions } = useNewsFilterOptions('orgao', selectedCategories, fOrgao)
  const { data: cargoOptions } = useNewsFilterOptions('cargo', selectedCategories, fCargo)
  const { data: disciplinaOptions } = useNewsFilterOptions('disciplina', selectedCategories, fDisciplina)

  const hasSubFilters = fEstado || fCidade || fOrgao || fCargo || fDisciplina

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder-subtle bg-dark-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-base font-bold text-darkText flex-1">{t('news.title')}</Text>
      </View>

      {/* Search */}
      <View className="flex-row items-center bg-dark-surfaceLight rounded-xl px-3 py-2 mx-4 mt-3">
        <Ionicons name="search" size={16} color={colors.textMuted} />
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

      {/* Category dropdown (multi-select) */}
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

      {/* Sub-filters - show when category has filter flags */}
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
              icon={<Ionicons name="newspaper-outline" size={48} color={colors.textMuted} />}
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
                  <Ionicons name="newspaper-outline" size={32} color={colors.textMuted} />
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
