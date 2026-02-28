import { useRef, useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, Dimensions, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import { Platform, Linking } from 'react-native'
import { t } from '@/i18n'
import { useOnboardingSlides } from '@/hooks/useOnboarding'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

export default function OnboardingScreen() {
  const router = useRouter()
  const flatListRef = useRef<FlatList>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const { data: slides, isLoading } = useOnboardingSlides()

  async function handleFinish() {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('onboarding_done', 'true')
      } else {
        await SecureStore.setItemAsync('onboarding_done', 'true')
      }
    } catch {}
    router.replace('/(auth)/login')
  }

  // If no slides configured, skip onboarding
  useEffect(() => {
    if (!isLoading && (!slides || slides.length === 0)) {
      handleFinish()
    }
  }, [isLoading, slides])

  function handleNext() {
    if (!slides?.length) return
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1
      flatListRef.current?.scrollToOffset({ offset: nextIndex * SCREEN_WIDTH, animated: true })
      setCurrentIndex(nextIndex)
    } else {
      handleFinish()
    }
  }

  function handleSlidePress(link: string | null) {
    if (link) {
      Linking.openURL(link).catch(() => {})
    }
  }

  if (isLoading || !slides || slides.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-dark-bg">
        <LoadingSpinner />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['bottom']}>
      <View className="flex-1">
        <FlatList
          ref={flatListRef}
          data={slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
            setCurrentIndex(idx)
          }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={item.link ? 0.9 : 1}
              onPress={() => handleSlidePress(item.link)}
              style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
            >
              {item.imagem ? (
                <Image
                  source={{ uri: item.imagem }}
                  style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} className="bg-dark-surfaceLight items-center justify-center">
                  <Ionicons name="image-outline" size={64} color="#9ca3af" />
                </View>
              )}
            </TouchableOpacity>
          )}
        />

        {/* Overlay bottom with dots + buttons */}
        <View className="absolute bottom-0 left-0 right-0 pb-8 pt-16 px-6" style={{ backgroundColor: 'rgba(247,246,243,0.95)' }}>
          {/* Dots */}
          <View className="flex-row justify-center mb-5">
            {slides.map((_, i) => (
              <View
                key={i}
                className={`h-2 rounded-full mx-1 ${i === currentIndex ? 'w-7 bg-primary' : 'w-2 bg-darkBorder-light'}`}
              />
            ))}
          </View>

          {/* Buttons */}
          <TouchableOpacity
            onPress={handleNext}
            className="bg-primary rounded-2xl py-4 items-center mb-3"
          >
            <Text className="text-white font-bold text-base">
              {currentIndex === slides.length - 1 ? t('onboarding.start') : t('common.next')}
            </Text>
          </TouchableOpacity>

          {currentIndex < slides.length - 1 && (
            <TouchableOpacity onPress={handleFinish} className="py-3 items-center">
              <Text className="text-sm text-darkText-muted">{t('common.skip') ?? 'Pular'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}
