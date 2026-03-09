import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Video, ResizeMode } from 'expo-av'
import { useAudioLawDetail, useAudioLawQuestions } from '@/hooks/useAudio'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { DownloadButton } from '@/components/DownloadButton'
import { AudioPlayerList } from '@/components/AudioPlayer'
import { t } from '@/i18n'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { AudioItem } from '@/components/AudioPlayer'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

type TabKey = 'audio' | 'text' | 'questions'

export default function AudioPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const colors = useThemeColors()
  const { data, isLoading } = useAudioLawDetail(id!)
  const [activeTab, setActiveTab] = useState<TabKey>('audio')

  const audios: AudioItem[] = (data?.audios ?? []).map((a: any) => ({
    id: a.id,
    titulo: a.titulo,
    audio_url: a.audio_url,
  }))

  if (isLoading) return <LoadingSpinner />
  if (!data?.lei) return null

  const { lei } = data

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'audio', label: 'Áudio', icon: 'musical-notes' },
    { key: 'text', label: 'Texto', icon: 'document-text' },
    { key: 'questions', label: 'Questões', icon: 'help-circle' },
  ]

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder bg-dark-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-base font-bold text-darkText flex-1" numberOfLines={1}>
          {lei.nome}
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-darkBorder-subtle px-4">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className={`flex-row items-center pb-3 pt-3 mr-6 ${activeTab === tab.key ? 'border-b-2 border-accent' : ''}`}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? '#f59e0b' : colors.textSecondary}
            />
            <Text className={`text-sm font-semibold ml-1.5 ${activeTab === tab.key ? 'text-accent' : 'text-darkText-muted'}`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'audio' && (
          <View className="px-4 pt-4">
            {audios.length > 0 && (
              <>
                <Text className="text-sm font-semibold text-darkText mb-3">
                  {t('audio.title')} ({audios.length})
                </Text>
                <AudioPlayerList
                  audios={audios}
                  accentColor="#f59e0b"
                  renderItemRight={(audio, i) => (
                    <View style={{ marginLeft: 8 }}>
                      <DownloadButton
                        lessonId={audio.id}
                        courseId={lei.id ?? ''}
                        courseTitle={lei.nome ?? ''}
                        lessonTitle={audio.titulo ?? `Audio ${i + 1}`}
                        contentType="audio"
                        remoteUrl={audio.audio_url}
                        size={28}
                      />
                    </View>
                  )}
                />
              </>
            )}
          </View>
        )}

        {activeTab === 'text' && (
          <View className="px-4 pt-4">
            {lei.texto ? (
              <>
                <Text className="text-sm font-semibold text-darkText mb-3">{lei.nome}</Text>
                <Text className="text-sm text-darkText-secondary leading-6" style={{ textAlign: 'justify' }}>{lei.texto}</Text>
              </>
            ) : (
              <View className="items-center py-12">
                <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
                <Text className="text-sm text-darkText-muted mt-2">Nenhum texto disponível</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'questions' && (
          <AudioQuizSection leiId={id!} />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function AudioQuizSection({ leiId }: { leiId: string }) {
  const colors = useThemeColors()
  const { data: questions } = useAudioLawQuestions(leiId)
  const [started, setStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [finished, setFinished] = useState(false)

  if (!questions?.length) {
    return (
      <View className="items-center py-12 px-4">
        <Ionicons name="help-circle-outline" size={40} color={colors.textMuted} />
        <Text className="text-sm text-darkText-muted mt-2">Nenhuma questão disponível</Text>
      </View>
    )
  }

  const question = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  function handleSelectAnswer(answer: string) {
    if (showResult) return
    setSelectedAnswer(answer)
    setShowResult(true)
    setScore((prev) => ({
      correct: prev.correct + (answer === question.resposta ? 1 : 0),
      total: prev.total + 1,
    }))
  }

  function handleNext() {
    setCurrentIndex((i) => i + 1)
    setSelectedAnswer(null)
    setShowResult(false)
  }

  function handlePrevious() {
    if (currentIndex === 0) return
    setCurrentIndex((i) => i - 1)
    setSelectedAnswer(null)
    setShowResult(true)
  }

  function handleRestart() {
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore({ correct: 0, total: 0 })
    setFinished(false)
    setStarted(true)
  }

  if (!started) {
    return (
      <View className="px-4 pt-6">
        <TouchableOpacity
          onPress={() => setStarted(true)}
          className="flex-row items-center justify-center bg-accent rounded-2xl py-3.5"
        >
          <Ionicons name="help-circle-outline" size={20} color={colors.text} />
          <Text className="text-dark-bg font-semibold text-sm ml-2">
            Responder questões ({questions.length})
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (finished) {
    return (
      <View className="px-4 pt-6 items-center">
        <View className="w-16 h-16 rounded-full bg-accent/20 items-center justify-center mb-3">
          <Ionicons name="trophy" size={32} color="#fbbf24" />
        </View>
        <Text className="text-xl font-bold text-darkText mb-1">Resultado</Text>
        <Text className="text-3xl font-bold text-accent mb-1">
          {score.correct}/{score.total}
        </Text>
        <Text className="text-sm text-darkText-secondary mb-4">
          {Math.round((score.correct / score.total) * 100)}% de acertos
        </Text>
        <TouchableOpacity
          onPress={handleRestart}
          className="w-full bg-primary rounded-2xl py-3.5 items-center"
        >
          <Text className="text-white font-bold">Refazer</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="px-4 pt-6">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-semibold text-darkText">
          Questão {currentIndex + 1}/{questions.length}
        </Text>
        <View className="flex-row items-center">
          <Ionicons name="checkmark-circle" size={16} color="#34d399" />
          <Text className="text-sm font-semibold text-success ml-1">{score.correct}</Text>
        </View>
      </View>

      <View className="h-1 bg-dark-surfaceLight rounded-full mb-4">
        <View
          className="h-1 bg-accent rounded-full"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </View>

      <Text className="text-base font-semibold text-darkText mb-4 leading-7">
        {question.pergunta}
      </Text>

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
              <Text className={`text-sm font-bold ${letterText}`}>{letter}</Text>
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

      {showResult && question.video && (
        <View className="mt-2 mb-2">
          <Text className="text-sm font-bold text-darkText mb-2">Explicação em vídeo:</Text>
          <View className="rounded-2xl overflow-hidden">
            <Video
              source={{ uri: question.video }}
              style={{ width: SCREEN_WIDTH - 32, height: (SCREEN_WIDTH - 32) * 9 / 16, backgroundColor: '#000' }}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
            />
          </View>
        </View>
      )}

      {showResult && question.resposta_escrita && (
        <View className="mt-2 mb-2 bg-dark-surfaceLight rounded-2xl p-4 border border-accent/20">
          <Text className="text-sm font-bold text-accent mb-1">Comentário:</Text>
          <Text className="text-sm text-darkText-secondary leading-6">{question.resposta_escrita}</Text>
        </View>
      )}

      {showResult && (
        <View className="mt-4 gap-3">
          {!isLastQuestion && (
            <TouchableOpacity
              onPress={handleNext}
              className="bg-primary rounded-2xl py-3.5 items-center"
            >
              <Text className="text-white font-bold">Próxima questão</Text>
            </TouchableOpacity>
          )}

          {isLastQuestion && (
            <TouchableOpacity
              onPress={() => setFinished(true)}
              className="bg-accent rounded-2xl py-3.5 items-center"
            >
              <Text className="text-dark-bg font-bold">Ver resultado</Text>
            </TouchableOpacity>
          )}

          {currentIndex > 0 && (
            <TouchableOpacity
              onPress={handlePrevious}
              className="bg-dark-surfaceLight rounded-2xl py-3.5 items-center"
            >
              <Text className="text-darkText-secondary font-semibold">Questão anterior</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}
