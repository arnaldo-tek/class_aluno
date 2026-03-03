import { useState, useCallback, useRef } from 'react'
import { View, Text, TouchableOpacity, Dimensions, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useFlashcards } from '@/hooks/useFlashcards'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useThemeColors } from '@/hooks/useThemeColors'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function FlashcardStudyScreen() {
  const { block_id } = useLocalSearchParams<{ block_id: string }>()
  const router = useRouter()
  const colors = useThemeColors()
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
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
        <Text className="text-sm font-medium text-darkText-secondary">
          {currentIndex + 1} / {cards.length}
        </Text>
        <View className="w-6" />
      </View>

      {/* Progress */}
      <View className="h-1 bg-dark-surfaceLight mx-4 rounded-full mb-4">
        <View
          className="h-1 bg-accent rounded-full"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </View>

      {/* Card - full screen */}
      <TouchableOpacity
        onPress={flip}
        activeOpacity={0.95}
        className="flex-1 mx-4 mb-4"
      >
        <View className="flex-1 relative">
          {/* Front */}
          <Animated.View
            style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: [{ rotateY: frontRotate }] }}
          >
            <View className="flex-1 bg-dark-surface rounded-3xl border border-darkBorder items-center justify-center px-8">
              <View className="flex-row items-center mb-4">
                <View className="w-7 h-7 rounded-full bg-primary/15 items-center justify-center">
                  <Text className="text-xs font-bold text-primary">F</Text>
                </View>
                <Text className="text-xs font-bold text-primary ml-2 tracking-wider">FRENTE</Text>
              </View>
              <Text className="text-lg font-semibold text-darkText text-center leading-8" style={{ textAlign: 'justify' }}>
                {card.pergunta}
              </Text>
              <Text className="text-xs text-darkText-muted mt-8">Toque para virar</Text>
            </View>
          </Animated.View>

          {/* Back - softer color */}
          <Animated.View
            style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: [{ rotateY: backRotate }] }}
          >
            <View className="flex-1 bg-dark-surfaceLight rounded-3xl border border-accent/30 items-center justify-center px-8">
              <View className="flex-row items-center mb-4">
                <View className="w-7 h-7 rounded-full bg-accent/20 items-center justify-center">
                  <Text className="text-xs font-bold text-accent">V</Text>
                </View>
                <Text className="text-xs font-bold text-accent ml-2 tracking-wider">VERSO</Text>
              </View>
              <Text className="text-lg font-semibold text-darkText text-center leading-8" style={{ textAlign: 'justify' }}>
                {card.resposta}
              </Text>
              <Text className="text-xs text-darkText-muted mt-8">Toque para virar</Text>
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
          <Ionicons name="arrow-back" size={24} color={currentIndex === 0 ? colors.textMuted : colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={flip}
          className="w-14 h-14 rounded-full bg-dark-surface border border-darkBorder items-center justify-center"
        >
          <Ionicons name="sync-outline" size={24} color="#f59e0b" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={currentIndex === cards.length - 1 ? () => router.back() : goNext}
          className="w-14 h-14 rounded-full bg-accent items-center justify-center"
        >
          <Ionicons
            name={currentIndex === cards.length - 1 ? 'checkmark' : 'arrow-forward'}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
