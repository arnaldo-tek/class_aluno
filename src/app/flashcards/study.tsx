import { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, interpolate,
} from 'react-native-reanimated'
import { useFlashcards } from '@/hooks/useFlashcards'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function FlashcardStudyScreen() {
  const { block_id } = useLocalSearchParams<{ block_id: string }>()
  const router = useRouter()
  const { data: cards, isLoading } = useFlashcards(block_id!)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const flipProgress = useSharedValue(0)

  const flip = useCallback(() => {
    const toValue = isFlipped ? 0 : 1
    flipProgress.value = withTiming(toValue, { duration: 400 })
    setIsFlipped(!isFlipped)
  }, [isFlipped, flipProgress])

  const goNext = useCallback(() => {
    if (!cards || currentIndex >= cards.length - 1) return
    flipProgress.value = 0
    setIsFlipped(false)
    setCurrentIndex((i) => i + 1)
  }, [cards, currentIndex, flipProgress])

  const goPrev = useCallback(() => {
    if (currentIndex <= 0) return
    flipProgress.value = 0
    setIsFlipped(false)
    setCurrentIndex((i) => i - 1)
  }, [currentIndex, flipProgress])

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(flipProgress.value, [0, 1], [0, 180])}deg` }],
    backfaceVisibility: 'hidden' as const,
  }))

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(flipProgress.value, [0, 1], [180, 360])}deg` }],
    backfaceVisibility: 'hidden' as const,
  }))

  if (isLoading) return <LoadingSpinner />
  if (!cards?.length) return null

  const card = cards[currentIndex]
  const isFinished = currentIndex >= cards.length

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-sm font-medium text-gray-600">
          {currentIndex + 1} / {cards.length}
        </Text>
        <View className="w-6" />
      </View>

      {/* Progress */}
      <View className="h-1 bg-gray-200 mx-4 rounded-full mb-6">
        <View
          className="h-1 bg-blue-600 rounded-full"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </View>

      {/* Card */}
      <TouchableOpacity
        onPress={flip}
        activeOpacity={0.95}
        className="flex-1 mx-4 mb-4"
      >
        <View className="flex-1 relative">
          {/* Front (Question) */}
          <Animated.View
            style={[frontStyle, { position: 'absolute', width: '100%', height: '100%' }]}
          >
            <View className="flex-1 bg-white rounded-2xl border border-gray-200 items-center justify-center px-8 shadow-sm">
              <Ionicons name="help-circle-outline" size={32} color="#2563eb" />
              <Text className="text-lg font-semibold text-gray-900 text-center mt-4 leading-7">
                {card.pergunta}
              </Text>
              <Text className="text-xs text-gray-400 mt-6">Toque para virar</Text>
            </View>
          </Animated.View>

          {/* Back (Answer) */}
          <Animated.View
            style={[backStyle, { position: 'absolute', width: '100%', height: '100%' }]}
          >
            <View className="flex-1 bg-blue-600 rounded-2xl items-center justify-center px-8 shadow-sm">
              <Ionicons name="bulb-outline" size={32} color="white" />
              <Text className="text-lg font-semibold text-white text-center mt-4 leading-7">
                {card.resposta}
              </Text>
              <Text className="text-xs text-blue-200 mt-6">Toque para virar</Text>
            </View>
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Navigation */}
      <View className="flex-row items-center justify-between px-8 pb-6">
        <TouchableOpacity
          onPress={goPrev}
          disabled={currentIndex === 0}
          className={`w-14 h-14 rounded-full items-center justify-center ${currentIndex === 0 ? 'bg-gray-100' : 'bg-gray-200'}`}
        >
          <Ionicons name="arrow-back" size={24} color={currentIndex === 0 ? '#d1d5db' : '#374151'} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={flip}
          className="w-14 h-14 rounded-full bg-blue-100 items-center justify-center"
        >
          <Ionicons name="sync-outline" size={24} color="#2563eb" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={currentIndex === cards.length - 1 ? () => router.back() : goNext}
          className="w-14 h-14 rounded-full bg-blue-600 items-center justify-center"
        >
          <Ionicons
            name={currentIndex === cards.length - 1 ? 'checkmark' : 'arrow-forward'}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
