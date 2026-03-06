import { useState, useCallback, useRef } from 'react'
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Dimensions, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useFlashcards, useCreateFlashcard, useDeleteFlashcard } from '@/hooks/useFlashcards'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useThemeColors } from '@/hooks/useThemeColors'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function FlashcardStudyScreen() {
  const { block_id, block_name, folder_id, folder_name } = useLocalSearchParams<{
    block_id: string; block_name?: string; folder_id?: string; folder_name?: string
  }>()
  const router = useRouter()
  const colors = useThemeColors()
  const { data: cards, isLoading } = useFlashcards(block_id!)
  const createCard = useCreateFlashcard()
  const deleteCard = useDeleteFlashcard()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const animValue = useRef(new Animated.Value(0)).current

  const touchStartRef = useRef({ x: 0, y: 0 })
  const [showForm, setShowForm] = useState(false)
  const [pergunta, setPergunta] = useState('')
  const [resposta, setResposta] = useState('')

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

  function handleDelete() {
    if (!cards?.length) return
    const card = cards[currentIndex]
    Alert.alert('Excluir flashcard', 'Excluir este flashcard?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: () => {
          deleteCard.mutate(card.id)
          animValue.setValue(0)
          setIsFlipped(false)
          if (currentIndex > 0) {
            setCurrentIndex((i) => i - 1)
          }
        },
      },
    ])
  }

  async function handleCreate() {
    if (!pergunta.trim() || !resposta.trim()) return
    await createCard.mutateAsync({
      pergunta: pergunta.trim(),
      resposta: resposta.trim(),
      bloco_id: block_id!,
      pasta_id: folder_id!,
    })
    setPergunta('')
    setResposta('')
    setShowForm(false)
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
        <Text className="text-sm font-medium text-darkText-secondary flex-1 text-center" numberOfLines={1}>
          {block_name ?? 'Flashcards'}
        </Text>
        <View className="flex-row items-center gap-3">
          {cards && cards.length > 0 && (
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color="#f87171" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowForm(!showForm)}>
            <Ionicons name="add-circle-outline" size={24} color="#60a5fa" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Add card form */}
      {showForm && (
        <View className="px-4 py-3 bg-dark-surface border-b border-darkBorder gap-2">
          <TextInput
            className="border border-darkBorder rounded-2xl px-3 py-2 text-sm bg-dark-surfaceLight text-darkText"
            placeholder="Pergunta (frente)"
            placeholderTextColor="#9ca3af"
            value={pergunta}
            onChangeText={setPergunta}
            multiline
            autoFocus
          />
          <TextInput
            className="border border-darkBorder rounded-2xl px-3 py-2 text-sm bg-dark-surfaceLight text-darkText"
            placeholder="Resposta (verso)"
            placeholderTextColor="#9ca3af"
            value={resposta}
            onChangeText={setResposta}
            multiline
          />
          <TouchableOpacity
            onPress={handleCreate}
            disabled={createCard.isPending}
            className="bg-primary rounded-2xl py-3.5 items-center"
          >
            <Text className="text-white font-semibold text-sm">
              {createCard.isPending ? 'Salvando...' : 'Adicionar card'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!cards?.length ? (
        <EmptyState
          title="Nenhum flashcard"
          description="Adicione cards com o botão + acima."
          icon={<Ionicons name="layers-outline" size={48} color={colors.textMuted} />}
        />
      ) : (
        <>
          {/* Progress */}
          <View className="flex-row items-center justify-center mb-1">
            <Text className="text-sm font-medium text-darkText-secondary">
              {currentIndex + 1} / {cards.length}
            </Text>
          </View>
          <View className="h-1 bg-dark-surfaceLight mx-4 rounded-full mb-4">
            <View
              className="h-1 bg-accent rounded-full"
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            />
          </View>

          {/* Card */}
          <View
            style={{ flex: 1, marginHorizontal: 16, marginBottom: 16 }}
            onTouchStart={(e) => { touchStartRef.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY } }}
            onTouchEnd={(e) => {
              const dx = Math.abs(e.nativeEvent.pageX - touchStartRef.current.x)
              const dy = Math.abs(e.nativeEvent.pageY - touchStartRef.current.y)
              if (dx < 10 && dy < 10) flip()
            }}
          >
            <View style={{ flex: 1, position: 'relative' }}>
              {/* Front */}
              <Animated.View
                pointerEvents={isFlipped ? 'none' : 'auto'}
                style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: [{ rotateY: frontRotate }] }}
              >
                <View style={{ flex: 1, backgroundColor: '#1e1e2e', borderRadius: 24, borderWidth: 1, borderColor: '#2a2a3a', paddingHorizontal: 32, paddingTop: 24, paddingBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'center' }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(37,99,235,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#3b82f6' }}>F</Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#3b82f6', marginLeft: 8, letterSpacing: 1.5 }}>FRENTE</Text>
                    <View style={{ flex: 1 }} />
                    <Ionicons name="sync-outline" size={16} color={colors.textMuted} />
                  </View>
                  <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator nestedScrollEnabled contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#f0f0f0', textAlign: 'justify', lineHeight: 32 }}>
                      {cards[currentIndex].pergunta}
                    </Text>
                  </ScrollView>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a3a', marginTop: 12 }}>
                    <Ionicons name="sync-outline" size={14} color={colors.textMuted} />
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 6 }}>Toque para virar</Text>
                  </View>
                </View>
              </Animated.View>

              {/* Back */}
              <Animated.View
                pointerEvents={isFlipped ? 'auto' : 'none'}
                style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: [{ rotateY: backRotate }] }}
              >
                <View style={{ flex: 1, backgroundColor: '#252538', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(96,165,250,0.3)', paddingHorizontal: 32, paddingTop: 24, paddingBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'center' }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(96,165,250,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#60a5fa' }}>V</Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#60a5fa', marginLeft: 8, letterSpacing: 1.5 }}>VERSO</Text>
                    <View style={{ flex: 1 }} />
                    <Ionicons name="sync-outline" size={16} color={colors.textMuted} />
                  </View>
                  <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator nestedScrollEnabled contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#f0f0f0', textAlign: 'justify', lineHeight: 32 }}>
                      {cards[currentIndex].resposta}
                    </Text>
                  </ScrollView>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a3a', marginTop: 12 }}>
                    <Ionicons name="sync-outline" size={14} color={colors.textMuted} />
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 6 }}>Toque para virar</Text>
                  </View>
                </View>
              </Animated.View>
            </View>
          </View>

          {/* Navigation */}
          <View className="flex-row items-center justify-between px-8 pb-6">
            <TouchableOpacity
              onPress={goPrev}
              disabled={currentIndex === 0}
              className={`w-14 h-14 rounded-full items-center justify-center ${currentIndex === 0 ? 'bg-dark-surfaceLight' : 'bg-dark-surface border border-darkBorder-light'}`}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textMuted} />
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
        </>
      )}
    </SafeAreaView>
  )
}
