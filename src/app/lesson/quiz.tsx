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
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-sm font-medium text-gray-600">
          {currentIndex + 1} / {questions.length}
        </Text>
        <View className="flex-row items-center">
          <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
          <Text className="text-sm font-medium text-gray-600 ml-1">{score.correct}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View className="h-1 bg-gray-100">
        <View
          className="h-1 bg-blue-600"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Finished state */}
        {isFinished ? (
          <View className="items-center pt-12">
            <View className="w-20 h-20 rounded-full bg-blue-50 items-center justify-center mb-4">
              <Ionicons name="trophy" size={40} color="#2563eb" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">Resultado</Text>
            <Text className="text-4xl font-bold text-blue-600 mb-1">
              {score.correct}/{score.total}
            </Text>
            <Text className="text-sm text-gray-500 mb-8">
              {Math.round((score.correct / score.total) * 100)}% de acertos
            </Text>

            <TouchableOpacity
              onPress={handleRestart}
              className="w-full bg-blue-600 rounded-xl py-4 items-center mb-3"
            >
              <Text className="text-white font-bold">Refazer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-full bg-gray-100 rounded-xl py-4 items-center"
            >
              <Text className="text-gray-700 font-semibold">Voltar à aula</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Question */}
            <Text className="text-base font-semibold text-gray-900 mb-6 leading-6">
              {question.pergunta}
            </Text>

            {/* Alternatives */}
            {(question.alternativas ?? []).map((alt: string, i: number) => {
              const letter = String.fromCharCode(65 + i) // A, B, C, D...
              const isSelected = selectedAnswer === alt
              const isCorrectAnswer = alt === question.resposta

              let bgClass = 'bg-white border-gray-200'
              let textClass = 'text-gray-900'
              let letterBg = 'bg-gray-100'

              if (showResult) {
                if (isCorrectAnswer) {
                  bgClass = 'bg-green-50 border-green-400'
                  letterBg = 'bg-green-500'
                  textClass = 'text-green-900'
                } else if (isSelected && !isCorrectAnswer) {
                  bgClass = 'bg-red-50 border-red-400'
                  letterBg = 'bg-red-500'
                  textClass = 'text-red-900'
                }
              } else if (isSelected) {
                bgClass = 'bg-blue-50 border-blue-400'
                letterBg = 'bg-blue-600'
              }

              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleSelectAnswer(alt)}
                  disabled={showResult}
                  className={`flex-row items-center px-4 py-3.5 mb-3 rounded-xl border ${bgClass}`}
                >
                  <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${letterBg}`}>
                    <Text className={`text-sm font-bold ${isSelected || (showResult && isCorrectAnswer) ? 'text-white' : 'text-gray-600'}`}>
                      {letter}
                    </Text>
                  </View>
                  <Text className={`flex-1 text-sm ${textClass}`}>{alt}</Text>
                  {showResult && isCorrectAnswer && (
                    <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  )}
                  {showResult && isSelected && !isCorrectAnswer && (
                    <Ionicons name="close-circle" size={20} color="#dc2626" />
                  )}
                </TouchableOpacity>
              )
            })}

            {/* Video explanation */}
            {showResult && question.video && (
              <View className="mt-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Explicação em vídeo:</Text>
                <Video
                  source={{ uri: question.video }}
                  style={{ width: SCREEN_WIDTH - 32, height: (SCREEN_WIDTH - 32) * 9 / 16, borderRadius: 12 }}
                  resizeMode={ResizeMode.CONTAIN}
                  useNativeControls
                />
              </View>
            )}

            {/* Next button */}
            {showResult && !isLastQuestion && (
              <TouchableOpacity
                onPress={handleNext}
                className="mt-6 bg-blue-600 rounded-xl py-4 items-center"
              >
                <Text className="text-white font-bold">Próxima questão</Text>
              </TouchableOpacity>
            )}

            {showResult && isLastQuestion && (
              <TouchableOpacity
                onPress={handleFinish}
                className="mt-6 bg-blue-600 rounded-xl py-4 items-center"
              >
                <Text className="text-white font-bold">Ver resultado</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
