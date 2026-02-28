import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Video, ResizeMode } from 'expo-av'
import { useLessonQuestions } from '@/hooks/useLesson'
import { useSaveQuizAttempt } from '@/hooks/useQuiz'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function QuizScreen() {
  const { lesson_id, curso_id } = useLocalSearchParams<{ lesson_id: string; curso_id: string }>()
  const router = useRouter()
  const { data: questions, isLoading } = useLessonQuestions(lesson_id!)
  const saveAttempt = useSaveQuizAttempt()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [answers, setAnswers] = useState<Record<string, string>>({})

  if (isLoading) return <LoadingSpinner />
  if (!questions?.length) return null

  const question = questions[currentIndex]
  const isCorrect = selectedAnswer === question.resposta
  const isLastQuestion = currentIndex === questions.length - 1
  const isFinished = score.total === questions.length && showResult && isLastQuestion

  function handleSelectAnswer(answer: string) {
    if (showResult) return
    setSelectedAnswer(answer)
    setShowResult(true)
    setScore((prev) => ({
      correct: prev.correct + (answer === question.resposta ? 1 : 0),
      total: prev.total + 1,
    }))
    setAnswers((prev) => ({ ...prev, [question.id]: answer }))
  }

  function handleNext() {
    if (isLastQuestion) return
    setCurrentIndex((i) => i + 1)
    setSelectedAnswer(null)
    setShowResult(false)
  }

  function handleFinish() {
    saveAttempt.mutate({
      aulaId: lesson_id!,
      cursoId: curso_id!,
      score: score.correct,
      totalQuestions: score.total,
      answers,
    })
  }

  function handleRestart() {
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore({ correct: 0, total: 0 })
    setAnswers({})
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3 border-b border-darkBorder-subtle">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons name="close" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text className="text-sm font-semibold text-darkText-secondary">
          {currentIndex + 1} / {questions.length}
        </Text>
        <View className="flex-row items-center">
          <Ionicons name="checkmark-circle" size={16} color="#34d399" />
          <Text className="text-sm font-semibold text-success ml-1">{score.correct}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View className="h-1 bg-dark-surfaceLight">
        <View
          className="h-1 bg-accent"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Finished state */}
        {isFinished ? (
          <View className="items-center pt-12">
            <View className="w-20 h-20 rounded-full bg-accent-muted items-center justify-center mb-4">
              <Ionicons name="trophy" size={40} color="#fbbf24" />
            </View>
            <Text className="text-2xl font-bold text-darkText mb-2">Resultado</Text>
            <Text className="text-4xl font-bold text-accent mb-1">
              {score.correct}/{score.total}
            </Text>
            <Text className="text-sm text-darkText-secondary mb-8">
              {Math.round((score.correct / score.total) * 100)}% de acertos
            </Text>

            <TouchableOpacity
              onPress={handleRestart}
              className="w-full bg-primary rounded-2xl py-4 items-center mb-3"
            >
              <Text className="text-white font-bold">Refazer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-full bg-dark-surfaceLight rounded-2xl py-4 items-center"
            >
              <Text className="text-darkText-secondary font-semibold">Voltar a aula</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Question */}
            <Text className="text-base font-semibold text-darkText mb-6 leading-7">
              {question.pergunta}
            </Text>

            {/* Alternatives */}
            {(question.alternativas ?? []).map((alt: string, i: number) => {
              const letter = String.fromCharCode(65 + i)
              const isSelected = selectedAnswer === alt
              const isCorrectAnswer = alt === question.resposta

              let bgClass = 'bg-dark-surface border-darkBorder'
              let textClass = 'text-darkText'
              let letterBg = 'bg-dark-surfaceLight'
              let letterText = 'text-darkText-secondary'

              if (showResult) {
                if (isCorrectAnswer) {
                  bgClass = 'bg-success-dark border-success/40'
                  letterBg = 'bg-success'
                  textClass = 'text-success'
                  letterText = 'text-darkText-inverse'
                } else if (isSelected && !isCorrectAnswer) {
                  bgClass = 'bg-error-dark border-error/40'
                  letterBg = 'bg-error'
                  textClass = 'text-error'
                  letterText = 'text-darkText-inverse'
                }
              } else if (isSelected) {
                bgClass = 'bg-primary-50 border-primary/40'
                letterBg = 'bg-primary'
                letterText = 'text-white'
              }

              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleSelectAnswer(alt)}
                  disabled={showResult}
                  className={`flex-row items-center px-4 py-4 mb-3 rounded-2xl border ${bgClass}`}
                >
                  <View className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${letterBg}`}>
                    <Text className={`text-sm font-bold ${letterText}`}>
                      {letter}
                    </Text>
                  </View>
                  <Text className={`flex-1 text-sm font-medium ${textClass}`}>{alt}</Text>
                  {showResult && isCorrectAnswer && (
                    <Ionicons name="checkmark-circle" size={20} color="#34d399" />
                  )}
                  {showResult && isSelected && !isCorrectAnswer && (
                    <Ionicons name="close-circle" size={20} color="#f87171" />
                  )}
                </TouchableOpacity>
              )
            })}

            {/* Video explanation */}
            {showResult && question.video && (
              <View className="mt-4">
                <Text className="text-sm font-bold text-darkText mb-2">Explicacao em video:</Text>
                <Video
                  source={{ uri: question.video }}
                  style={{ width: SCREEN_WIDTH - 32, height: (SCREEN_WIDTH - 32) * 9 / 16, borderRadius: 16, backgroundColor: '#000' }}
                  resizeMode={ResizeMode.CONTAIN}
                  useNativeControls
                />
              </View>
            )}

            {/* Next button */}
            {showResult && !isLastQuestion && (
              <TouchableOpacity
                onPress={handleNext}
                className="mt-6 bg-primary rounded-2xl py-4 items-center"
              >
                <Text className="text-white font-bold">Proxima questao</Text>
              </TouchableOpacity>
            )}

            {showResult && isLastQuestion && (
              <TouchableOpacity
                onPress={handleFinish}
                className="mt-6 bg-accent rounded-2xl py-4 items-center"
              >
                <Text className="text-darkText-inverse font-bold">Ver resultado</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
