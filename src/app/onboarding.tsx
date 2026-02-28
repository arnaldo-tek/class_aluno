import { useRef, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { t } from '@/i18n'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const SLIDES = [
  { icon: 'school-outline' as const, key: 'slide1', color: '#2563eb' },
  { icon: 'time-outline' as const, key: 'slide2', color: '#7c3aed' },
  { icon: 'trophy-outline' as const, key: 'slide3', color: '#059669' },
]

export default function OnboardingScreen() {
  const router = useRouter()
  const flatListRef = useRef<FlatList>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

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

  function handleNext() {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true })
      setCurrentIndex(currentIndex + 1)
    } else {
      handleFinish()
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
            setCurrentIndex(idx)
          }}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <View style={{ width: SCREEN_WIDTH }} className="flex-1 items-center justify-center px-8">
              <View className="w-32 h-32 rounded-full items-center justify-center mb-8" style={{ backgroundColor: `${item.color}15` }}>
                <Ionicons name={item.icon} size={64} color={item.color} />
              </View>
              <Text className="text-2xl font-bold text-gray-900 text-center mb-4">
                {t('onboarding.welcome')}
              </Text>
              <Text className="text-base text-gray-500 text-center leading-7">
                {t(`onboarding.${item.key}`)}
              </Text>
            </View>
          )}
        />

        {/* Dots */}
        <View className="flex-row justify-center mb-6">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              className={`w-2.5 h-2.5 rounded-full mx-1.5 ${i === currentIndex ? 'bg-blue-600' : 'bg-gray-300'}`}
            />
          ))}
        </View>

        {/* Buttons */}
        <View className="px-6 pb-8">
          <TouchableOpacity
            onPress={handleNext}
            className="bg-blue-600 rounded-xl py-4 items-center mb-3"
          >
            <Text className="text-white font-bold text-base">
              {currentIndex === SLIDES.length - 1 ? t('onboarding.start') : t('common.next')}
            </Text>
          </TouchableOpacity>

          {currentIndex < SLIDES.length - 1 && (
            <TouchableOpacity onPress={handleFinish} className="py-3 items-center">
              <Text className="text-sm text-gray-400">Pular</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}
