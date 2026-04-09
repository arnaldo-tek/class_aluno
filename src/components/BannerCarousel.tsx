import { View, FlatList, TouchableOpacity, Dimensions, Linking } from 'react-native'
import { Image } from 'expo-image'
import { useRef, useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useBanners } from '@/hooks/useHome'

const SCREEN_WIDTH = Dimensions.get('window').width

export function BannerCarousel() {
  const { data: banners } = useBanners()
  const flatListRef = useRef<FlatList>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const BANNER_GAP = 12
  const BANNER_WIDTH = SCREEN_WIDTH - 32
  const SNAP_WIDTH = BANNER_WIDTH + BANNER_GAP

  useEffect(() => {
    if (!banners?.length || banners.length <= 1) return
    const interval = setInterval(() => {
      const next = (currentIndex + 1) % banners.length
      flatListRef.current?.scrollToOffset({ offset: next * SNAP_WIDTH, animated: true })
      setCurrentIndex(next)
    }, 4000)
    return () => clearInterval(interval)
  }, [currentIndex, banners?.length])

  if (!banners?.length) return null

  return (
    <View className="mb-5">
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled={false}
        decelerationRate="fast"
        snapToInterval={SNAP_WIDTH}
        snapToAlignment="start"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ItemSeparatorComponent={() => <View style={{ width: BANNER_GAP }} />}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SNAP_WIDTH)
          setCurrentIndex(index)
        }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={item.redirecionamento ? 0.8 : 1}
            onPress={() => {
              if (item.redirecionamento) Linking.openURL(item.redirecionamento)
            }}
            style={{ width: BANNER_WIDTH }}
            className="h-44 rounded-2xl overflow-hidden"
          >
            {item.imagem ? (
              <Image source={{ uri: item.imagem }} className="w-full h-full" contentFit="cover" />
            ) : (
              <View className="w-full h-full bg-primary-50 items-center justify-center">
                <Ionicons name="megaphone-outline" size={32} color="#3b82f6" />
              </View>
            )}
          </TouchableOpacity>
        )}
      />
      {banners.length > 1 && (
        <View className="flex-row justify-center mt-3">
          {banners.map((_, i) => (
            <View
              key={i}
              className={`h-1.5 rounded-full mx-1 ${i === currentIndex ? 'w-6 bg-accent' : 'w-1.5 bg-darkBorder-light'}`}
            />
          ))}
        </View>
      )}
    </View>
  )
}
