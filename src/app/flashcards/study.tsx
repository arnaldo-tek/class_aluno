import { useState, useCallback, useRef } from 'react'
import { View, Text, TouchableOpacity, Dimensions, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useFlashcards } from '@/hooks/useFlashcards'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function FlashcardStudyScreen() {
  const { block_id } = useLocalSearchParams<{ block_id: string }>()
  const router = useRouter()
  const { data: cards, isLoading } = useFlashcards(block_id!)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const animValue = useRef(new Animated.Value(0)).current

  const flip = useCallback(() => {
    Animated.timing(animValue, {
      toValue: isFlipped ? 0 : 1,
      duration: 400,
      useNativeDriver: true,
    }).start()
    setIsFlipped(!isFlipped)
  }, [isFlipped, animValue])

  const goNext = useCallback(() => {
    if (!cards || currentIndex >= cards.length - 1) return
    animValue.setValue(0)
    setIsFlipped(false)
    setCurrentIndex((i) => i + 1)
  }, [cards, currentIndex, animValue])

  const goPrev = useCallback(() => {
    if (currentIndex <= 0) return
    animValue.setValue(0)
    setIsFlipped(false)
    setCurrentIndex((i) => i - 1)
  }, [currentIndex, animValue])

  const frontRotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  })

  const backRotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  })

  if (isLoading) return <LoadingSpinner />
  if (!cards?.length) return null

  const card = cards[currentIndex]

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text className="text-sm font-medium text-darkText-secondary">
          {currentIndex + 1} / {cards.length}
        </Text>
        <View className="w-6" />
      </View>

      {/* Progress */}
      <View className="h-1 bg-dark-surfaceLight mx-4 rounded-full mb-6">
        <View
          className="h-1 bg-primary rounded-full"
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
            style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: [{ rotateY: frontRotate }] }}
          >
            <View className="flex-1 bg-dark-surface rounded-2xl border border-darkBorder items-center justify-center px-8">
              <Ionicons name="help-circle-outline" size={32} color="#60a5fa" />
              <Text className="text-lg font-semibold text-darkText text-center mt-4 leading-7">
                {card.pergunta}
              </Text>
              <Text className="text-xs text-darkText-muted mt-6">Toque para virar</Text>
            </View>
          </Animated.View>

          {/* Back (Answer) */}
          <Animated.View
            style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: [{ rotateY: backRotate }] }}
          >
            <View className="flex-1 bg-primary rounded-2xl items-center justify-center px-8">
              <Ionicons name="bulb-outline" size={32} color="#f7f6f3" />
              <Text className="text-lg font-semibold text-darkText-inverse text-center mt-4 leading-7">
                {card.resposta}
              </Text>
              <Text className="text-xs text-darkText-inverse opacity-60 mt-6">Toque para virar</Text>
            </View>
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Navigation */}
      <View className="flex-row items-center justify-between px-8 pb-6">
        <TouchableOpacity
          onPress={goPrev}
          disabled={currentIndex === 0}
          className={`w-14 h-14 rounded-full items-center justify-center ${currentIndex === 0 ? 'bg-dark-surfaceLight' : 'bg-dark-surface border border-darkBorder-light'}`}
        >
          <Ionicons name="arrow-back" size={24} color={currentIndex === 0 ? '#e5e4e1' : '#6b7280'} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={flip}
          className="w-14 h-14 rounded-full bg-primary-50 border border-darkBorder items-center justify-center"
        >
          <Ionicons name="sync-outline" size={24} color="#60a5fa" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={currentIndex === cards.length - 1 ? () => router.back() : goNext}
          className="w-14 h-14 rounded-full bg-primary items-center justify-center"
        >
          <Ionicons
            name={currentIndex === cards.length - 1 ? 'checkmark' : 'arrow-forward'}
            size={24}
            color="#f7f6f3"
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
