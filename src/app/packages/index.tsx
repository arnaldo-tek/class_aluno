import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { usePackages, usePackageCategories } from '@/hooks/usePackages'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { t } from '@/i18n'

export default function PackagesScreen() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { data: categories } = usePackageCategories()
  const { data: packages, isLoading } = usePackages({ search, categoriaId: selectedCategory })

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900 flex-1">{t('packages.title')}</Text>
        <TouchableOpacity onPress={() => router.push('/packages/my')}>
          <Text className="text-sm font-medium text-blue-600">{t('packages.myPackages')}</Text>
        </TouchableOpacity>
      </View>

      <SearchInput value={search} onChangeText={setSearch} />

      {/* Category chips */}
      {categories && categories.length > 0 && (
        <View className="px-4 pb-3">
          <FlatList
            data={[{ id: null, nome: t('common.seeAll') }, ...categories]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id ?? 'all'}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item.id)}
                className={`px-4 py-2 mr-2 rounded-full border ${
                  selectedCategory === item.id ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
                }`}
              >
                <Text className={`text-sm font-medium ${
                  selectedCategory === item.id ? 'text-white' : 'text-gray-700'
                }`}>
                  {item.nome}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={packages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          ListEmptyComponent={
            <EmptyState
              title={t('packages.noPackages')}
              icon={<Ionicons name="cube-outline" size={48} color="#9ca3af" />}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/packages/${item.id}`)}
              className="bg-white rounded-xl mb-3 overflow-hidden border border-gray-100"
            >
              {item.imagem ? (
                <Image source={{ uri: item.imagem }} className="w-full h-40" resizeMode="cover" />
              ) : (
                <View className="w-full h-40 bg-blue-50 items-center justify-center">
                  <Ionicons name="cube-outline" size={40} color="#2563eb" />
                </View>
              )}
              <View className="p-4">
                <Text className="text-base font-bold text-gray-900">{item.nome}</Text>
                {item.descricao && (
                  <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>{item.descricao}</Text>
                )}
                <View className="flex-row items-center justify-between mt-3">
                  <Text className="text-lg font-bold text-blue-600">
                    R$ {((item.preco ?? 0) / 100).toFixed(2)}{t('packages.perMonth')}
                  </Text>
                  <Text className="text-xs text-gray-400">
                    {(item as any).pacote_cursos?.length ?? 0} {t('courses.title').toLowerCase()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}
