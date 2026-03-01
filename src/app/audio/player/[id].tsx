import { useState, useRef, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Platform, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Video, ResizeMode } from 'expo-av'
import { useAudioLawDetail, useAudioLawQuestions } from '@/hooks/useAudio'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { DownloadButton } from '@/components/DownloadButton'
import { t } from '@/i18n'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Web-compatible audio player
function useAudioPlayer() {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<any>(null)

  const play = useCallback(async (url: string, index: number, audios: any[], onFinish?: () => void) => {
    // Stop current
    if (audioRef.current) {
      if (Platform.OS === 'web') {
        audioRef.current.pause()
        audioRef.current.src = ''
      } else {
        try {
          const { Audio } = require('expo-av')
          await audioRef.current.stopAsync?.()
          await audioRef.current.unloadAsync?.()
        } catch {}
      }
      audioRef.current = null
    }

    if (Platform.OS === 'web') {
      const audio = new window.Audio(url)
      audio.onended = () => {
        const nextIdx = index + 1
        if (nextIdx < audios.length) {
          play(audios[nextIdx].audio_url, nextIdx, audios, onFinish)
        } else {
          setIsPlaying(false)
          setCurrentIndex(null)
        }
      }
      audio.onerror = () => {
        setIsPlaying(false)
        setCurrentIndex(null)
      }
      audioRef.current = audio
      audio.play()
      setCurrentIndex(index)
      setIsPlaying(true)
    } else {
      try {
        const { Audio } = require('expo-av')
        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true },
          (status: any) => {
            if (status.isLoaded && status.didJustFinish) {
              const nextIdx = index + 1
              if (nextIdx < audios.length) {
                play(audios[nextIdx].audio_url, nextIdx, audios, onFinish)
              } else {
                setIsPlaying(false)
                setCurrentIndex(null)
              }
            }
          },
        )
        audioRef.current = sound
        setCurrentIndex(index)
        setIsPlaying(true)
      } catch {
        setIsPlaying(false)
        setCurrentIndex(null)
      }
    }
  }, [])

  const togglePlayPause = useCallback(async (index: number, url: string, audios: any[]) => {
    if (currentIndex === index && isPlaying) {
      if (Platform.OS === 'web') {
        audioRef.current?.pause()
      } else {
        await audioRef.current?.pauseAsync?.()
      }
      setIsPlaying(false)
    } else if (currentIndex === index && !isPlaying) {
      if (Platform.OS === 'web') {
        audioRef.current?.play()
      } else {
        await audioRef.current?.playAsync?.()
      }
      setIsPlaying(true)
    } else {
      await play(url, index, audios)
    }
  }, [currentIndex, isPlaying, play])

  return { currentIndex, isPlaying, play, togglePlayPause }
}

export default function AudioPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data, isLoading } = useAudioLawDetail(id!)
  const { currentIndex, isPlaying, play, togglePlayPause } = useAudioPlayer()

  const audios = data?.audios ?? []

  if (isLoading) return <LoadingSpinner />
  if (!data?.lei) return null

  const { lei } = data

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder bg-dark-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-darkText flex-1" numberOfLines={1}>
          {lei.nome}
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Audio player */}
        {audios.length > 0 && (
          <View className="px-4 pt-4">
            <Text className="text-sm font-semibold text-darkText mb-3">
              {t('audio.title')} ({audios.length})
            </Text>
            {audios.map((audio, i) => (
              <TouchableOpacity
                key={audio.id}
                onPress={() => togglePlayPause(i, audio.audio_url, audios)}
                className={`flex-row items-center px-4 py-3 mb-2 rounded-2xl border ${
                  currentIndex === i
                    ? 'border-primary bg-primary-50'
                    : 'border-darkBorder bg-dark-surface'
                }`}
              >
                <View className={`w-10 h-10 rounded-full items-center justify-center ${
                  currentIndex === i && isPlaying ? 'bg-primary' : 'bg-dark-surfaceLight'
                }`}>
                  <Ionicons
                    name={currentIndex === i && isPlaying ? 'pause' : 'play'}
                    size={18}
                    color={currentIndex === i && isPlaying ? '#fff' : '#60a5fa'}
                  />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-medium text-darkText">
                    {audio.titulo ?? `${t('audio.title')} ${i + 1}`}
                  </Text>
                </View>
                {currentIndex === i && (
                  <Ionicons name="musical-notes" size={16} color="#f59e0b" />
                )}
                {Platform.OS !== 'web' && (
                  <View className="ml-2">
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
              </TouchableOpacity>
            ))}

            {audios.length > 1 && (
              <TouchableOpacity
                onPress={() => play(audios[0].audio_url, 0, audios)}
                className="mt-2 bg-primary rounded-2xl py-3.5 items-center"
              >
                <Text className="text-white font-semibold text-sm">
                  Reproduzir todos sequencialmente
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Questions */}
        <AudioQuizSection leiId={id!} />

        {/* Law text */}
        {lei.texto && (
          <View className="px-4 pt-6">
            <Text className="text-sm font-semibold text-darkText mb-2">{lei.nome}</Text>
            <Text className="text-sm text-darkText-secondary leading-6">{lei.texto}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function AudioQuizSection({ leiId }: { leiId: string }) {
  const { data: questions } = useAudioLawQuestions(leiId)
  const [started, setStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  if (!questions?.length) return null

  const question = questions[currentIndex]
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
  }

  function handleNext() {
    setCurrentIndex((i) => i + 1)
    setSelectedAnswer(null)
    setShowResult(false)
  }

  function handleRestart() {
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore({ correct: 0, total: 0 })
    setStarted(true)
  }

  if (!started) {
    return (
      <View className="px-4 pt-6">
        <TouchableOpacity
          onPress={() => setStarted(true)}
          className="flex-row items-center justify-center bg-accent rounded-2xl py-3.5"
        >
          <Ionicons name="help-circle-outline" size={20} color="#1a1a2e" />
          <Text className="text-darkText-inverse font-semibold text-sm ml-2">
            Responder questões ({questions.length})
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (isFinished) {
    return (
      <View className="px-4 pt-6 items-center">
        <View className="w-16 h-16 rounded-full bg-accent-muted items-center justify-center mb-3">
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

      {/* Progress */}
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

      {/* Video explanation */}
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

      {/* Next / Finish */}
      {showResult && !isLastQuestion && (
        <TouchableOpacity
          onPress={handleNext}
          className="mt-4 bg-primary rounded-2xl py-3.5 items-center"
        >
          <Text className="text-white font-bold">Próxima questão</Text>
        </TouchableOpacity>
      )}

      {showResult && isLastQuestion && (
        <TouchableOpacity
          onPress={() => setScore((s) => ({ ...s }))}
          className="mt-4 bg-accent rounded-2xl py-3.5 items-center"
        >
          <Text className="text-darkText-inverse font-bold">Ver resultado</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
