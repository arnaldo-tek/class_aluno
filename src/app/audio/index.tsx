import { useState, useRef, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAudioPackages, useAudioBanners } from '@/hooks/useAudio'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { t } from '@/i18n'

const SCREEN_WIDTH = Dimensions.get('window').width

type TabType = 1 | 2 | 3 | 4

const TAB_CONFIG: Array<{ tipo: TabType; label: string; key: string }> = [
  { tipo: 1, label: 'packages', key: 'audio.packages' },
  { tipo: 2, label: 'federalLaws', key: 'audio.federalLaws' },
  { tipo: 3, label: 'stateLaws', key: 'audio.stateLaws' },
  { tipo: 4, label: 'municipalLaws', key: 'audio.municipalLaws' },
]

export default function AudioScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>(1)
  const { data: packages, isLoading } = useAudioPackages(activeTab)
  const { data: banners } = useAudioBanners()

  const bannerRef = useRef<FlatList>(null)
  const [bannerIndex, setBannerIndex] = useState(0)

  useEffect(() => {
    if (!banners?.length || banners.length <= 1) return
    const interval = setInterval(() => {
      const next = (bannerIndex + 1) % banners.length
      bannerRef.current?.scrollToIndex({ index: next, animated: true })
      setBannerIndex(next)
    }, 4000)
    return () => clearInterval(interval)
  }, [bannerIndex, banners?.length])

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900 flex-1">{t('audio.title')}</Text>
      </View>

      {/* Banner carousel */}
      {banners && banners.length > 0 && (
        <View className="mb-2">
          <FlatList
            ref={bannerRef}
            data={banners}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32))
              setBannerIndex(idx)
            }}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12 }}
            renderItem={({ item }) => (
              <View style={{ width: SCREEN_WIDTH - 32 }} className="h-32 rounded-xl overflow-hidden mr-3">
                {item.imagem ? (
                  <Image source={{ uri: item.imagem }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="w-full h-full bg-blue-50 items-center justify-center">
                    <Ionicons name="musical-notes-outline" size={32} color="#2563eb" />
                  </View>
                )}
              </View>
            )}
          />
          {banners.length > 1 && (
            <View className="flex-row justify-center mt-2">
              {banners.map((_, i) => (
                <View
                  key={i}
                  className={`w-2 h-2 rounded-full mx-1 ${i === bannerIndex ? 'bg-blue-600' : 'bg-gray-300'}`}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Tabs */}
      <FlatList
        data={TAB_CONFIG}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => String(item.tipo)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setActiveTab(item.tipo)}
            className={`px-4 py-2 mr-2 rounded-full border ${
              activeTab === item.tipo ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
            }`}
          >
            <Text className={`text-sm font-medium ${
              activeTab === item.tipo ? 'text-white' : 'text-gray-700'
            }`}>
              {t(item.key)}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Package list */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={packages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          ListEmptyComponent={
            <EmptyState
              title={t('audio.noAudio')}
              icon={<Ionicons name="musical-notes-outline" size={48} color="#9ca3af" />}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/audio/folders/${item.id}`)}
              className="flex-row bg-white rounded-xl mb-3 p-4 border border-gray-100 items-center"
            >
              <View className="w-12 h-12 bg-blue-50 rounded-lg items-center justify-center mr-3">
                <Ionicons name="folder-outline" size={24} color="#2563eb" />
              </View>
              <Text className="flex-1 text-base font-medium text-gray-900">{item.nome}</Text>
              <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}
