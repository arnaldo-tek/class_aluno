import { useState, useRef, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Platform, Dimensions, PanResponder } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Video, ResizeMode } from 'expo-av'
import { useAudioLawDetail, useAudioLawQuestions } from '@/hooks/useAudio'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { DownloadButton } from '@/components/DownloadButton'
import { t } from '@/i18n'
import { useThemeColors } from '@/hooks/useThemeColors'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2]

type TabKey = 'audio' | 'text' | 'questions'

// --- Seek bar ---

const THUMB_SIZE = 16
const TRACK_H = 6
const SEEK_BAR_H_PAD = 16

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function AudioSeekBar({ progress, positionMs, durationMs, onSeekStart, onSeek }: {
  progress: number
  positionMs: number
  durationMs: number
  onSeekStart: () => void
  onSeek: (ratio: number) => void
}) {
  const barWidth = SCREEN_WIDTH - 32 - SEEK_BAR_H_PAD * 2
  const [dragging, setDragging] = useState(false)
  const [dragRatio, setDragRatio] = useState(0)
  const barRef = useRef<View>(null)
  const barX = useRef(0)

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        onSeekStart()
        setDragging(true)
        barRef.current?.measureInWindow((x) => {
          barX.current = x
          const ratio = Math.max(0, Math.min(1, (e.nativeEvent.pageX - x) / barWidth))
          setDragRatio(ratio)
        })
      },
      onPanResponderMove: (e) => {
        const ratio = Math.max(0, Math.min(1, (e.nativeEvent.pageX - barX.current) / barWidth))
        setDragRatio(ratio)
      },
      onPanResponderRelease: (e) => {
        const ratio = Math.max(0, Math.min(1, (e.nativeEvent.pageX - barX.current) / barWidth))
        setDragging(false)
        onSeek(ratio)
      },
    })
  ).current

  const displayProgress = dragging ? dragRatio : progress
  const displayPosition = dragging ? dragRatio * durationMs : positionMs

  return (
    <View className="px-4 pb-3">
      <View
        ref={barRef}
        {...panResponder.panHandlers}
        style={{ height: THUMB_SIZE + 8, justifyContent: 'center' }}
      >
        <View className="bg-dark-surfaceLight rounded-full" style={{ height: TRACK_H, width: '100%' }}>
          <View className="bg-accent rounded-full" style={{ height: TRACK_H, width: `${displayProgress * 100}%` }} />
        </View>
        <View
          style={{
            position: 'absolute',
            left: displayProgress * barWidth - THUMB_SIZE / 2,
            top: (THUMB_SIZE + 8 - THUMB_SIZE) / 2,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            backgroundColor: '#f59e0b',
            borderWidth: 2,
            borderColor: '#ffffff',
            ...(dragging ? {
              transform: [{ scale: 1.25 }],
              shadowColor: '#f59e0b',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 4,
              elevation: 4,
            } : {}),
          }}
        />
      </View>
      <View className="flex-row justify-between mt-0.5">
        <Text className="text-[10px] text-darkText-muted">{formatTime(displayPosition)}</Text>
        <Text className="text-[10px] text-darkText-muted">{formatTime(durationMs)}</Text>
      </View>
    </View>
  )
}

// --- Audio player hook ---

function useAudioPlayer() {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [positionMs, setPositionMs] = useState(0)
  const [durationMs, setDurationMs] = useState(0)
  const audioRef = useRef<any>(null)
  const isSeeking = useRef(false)
  const webTimerRef = useRef<any>(null)

  const stopWebTimer = useCallback(() => {
    if (webTimerRef.current) {
      clearInterval(webTimerRef.current)
      webTimerRef.current = null
    }
  }, [])

  const play = useCallback(async (url: string, index: number, audios: any[]) => {
    stopWebTimer()

    if (audioRef.current) {
      if (Platform.OS === 'web') {
        audioRef.current.pause()
        audioRef.current.src = ''
      } else {
        try {
          await audioRef.current.stopAsync?.()
          await audioRef.current.unloadAsync?.()
        } catch {}
      }
      audioRef.current = null
    }

    setPositionMs(0)
    setDurationMs(0)

    if (Platform.OS === 'web') {
      const audio = new window.Audio(url)
      audio.playbackRate = speed
      audio.onloadedmetadata = () => {
        setDurationMs(audio.duration * 1000)
      }
      audio.onended = () => {
        stopWebTimer()
        const nextIdx = index + 1
        if (nextIdx < audios.length) {
          play(audios[nextIdx].audio_url, nextIdx, audios)
        } else {
          setIsPlaying(false)
          setCurrentIndex(null)
          setPositionMs(0)
          setDurationMs(0)
        }
      }
      audioRef.current = audio
      audio.play()
      setCurrentIndex(index)
      setIsPlaying(true)
      webTimerRef.current = setInterval(() => {
        if (!isSeeking.current) {
          setPositionMs(audio.currentTime * 1000)
        }
      }, 250)
    } else {
      try {
        const { Audio } = require('expo-av')
        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true, rate: speed, shouldCorrectPitch: true },
          (status: any) => {
            if (!status.isLoaded) return
            if (!isSeeking.current) {
              setPositionMs(status.positionMillis ?? 0)
            }
            if (status.durationMillis) {
              setDurationMs(status.durationMillis)
            }
            if (status.didJustFinish) {
              const nextIdx = index + 1
              if (nextIdx < audios.length) {
                play(audios[nextIdx].audio_url, nextIdx, audios)
              } else {
                setIsPlaying(false)
                setCurrentIndex(null)
                setPositionMs(0)
                setDurationMs(0)
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
  }, [speed, stopWebTimer])

  const togglePlayPause = useCallback(async (index: number, url: string, audios: any[]) => {
    if (currentIndex === index && isPlaying) {
      if (Platform.OS === 'web') {
        audioRef.current?.pause()
        stopWebTimer()
      } else {
        await audioRef.current?.pauseAsync?.()
      }
      setIsPlaying(false)
    } else if (currentIndex === index && !isPlaying) {
      if (Platform.OS === 'web') {
        audioRef.current?.play()
        webTimerRef.current = setInterval(() => {
          if (!isSeeking.current && audioRef.current) {
            setPositionMs(audioRef.current.currentTime * 1000)
          }
        }, 250)
      } else {
        await audioRef.current?.playAsync?.()
      }
      setIsPlaying(true)
    } else {
      await play(url, index, audios)
    }
  }, [currentIndex, isPlaying, play, stopWebTimer])

  const changeSpeed = useCallback(async (s: number) => {
    setSpeed(s)
    if (audioRef.current) {
      if (Platform.OS === 'web') {
        audioRef.current.playbackRate = s
      } else {
        await audioRef.current.setRateAsync?.(s, true)
      }
    }
  }, [])

  const seek = useCallback(async (ratio: number) => {
    if (audioRef.current && durationMs > 0) {
      const seekTo = ratio * durationMs
      if (Platform.OS === 'web') {
        audioRef.current.currentTime = seekTo / 1000
      } else {
        await audioRef.current.setPositionAsync?.(seekTo)
      }
      setPositionMs(seekTo)
    }
    isSeeking.current = false
  }, [durationMs])

  const startSeeking = useCallback(() => {
    isSeeking.current = true
  }, [])

  const progress = durationMs > 0 ? positionMs / durationMs : 0

  return { currentIndex, isPlaying, speed, positionMs, durationMs, progress, play, togglePlayPause, changeSpeed, seek, startSeeking }
}

export default function AudioPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const colors = useThemeColors()
  const { data, isLoading } = useAudioLawDetail(id!)
  const { currentIndex, isPlaying, speed, positionMs, durationMs, progress, play, togglePlayPause, changeSpeed, seek, startSeeking } = useAudioPlayer()
  const [activeTab, setActiveTab] = useState<TabKey>('audio')

  const audios = data?.audios ?? []

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
            {/* Speed control */}
            <View className="flex-row items-center justify-center py-2 gap-1 mb-2">
              {SPEED_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => changeSpeed(s)}
                  className={`px-3 py-1.5 rounded-full ${speed === s ? 'bg-accent' : 'bg-dark-surfaceLight'}`}
                >
                  <Text className={`text-xs font-semibold ${speed === s ? 'text-dark-bg' : 'text-darkText-muted'}`}>
                    {s}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {audios.length > 0 && (
              <>
                <Text className="text-sm font-semibold text-darkText mb-3">
                  {t('audio.title')} ({audios.length})
                </Text>
                {audios.map((audio, i) => (
                  <View
                    key={audio.id}
                    className={`mb-2.5 rounded-2xl overflow-hidden border ${
                      currentIndex === i
                        ? 'border-accent bg-accent/10'
                        : 'border-darkBorder bg-dark-surface'
                    }`}
                  >
                    <TouchableOpacity
                      onPress={() => togglePlayPause(i, audio.audio_url, audios)}
                      className="flex-row items-center px-4 py-3"
                    >
                      <View className={`w-10 h-10 rounded-full items-center justify-center ${
                        currentIndex === i && isPlaying ? 'bg-accent' : 'bg-dark-surfaceLight'
                      }`}>
                        <Ionicons
                          name={currentIndex === i && isPlaying ? 'pause' : 'play'}
                          size={18}
                          color={currentIndex === i && isPlaying ? colors.text : '#60a5fa'}
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

                    {/* Progress bar with draggable thumb */}
                    {currentIndex === i && (
                      <AudioSeekBar
                        progress={progress}
                        positionMs={positionMs}
                        durationMs={durationMs}
                        onSeekStart={startSeeking}
                        onSeek={seek}
                      />
                    )}
                  </View>
                ))}

                {audios.length > 1 && (
                  <TouchableOpacity
                    onPress={() => play(audios[0].audio_url, 0, audios)}
                    className="mt-2 bg-accent rounded-2xl py-3.5 items-center"
                  >
                    <Text className="text-dark-bg font-semibold text-sm">
                      Reproduzir todos sequencialmente
                    </Text>
                  </TouchableOpacity>
                )}
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
          <Ionicons name="help-circle-outline" size={20} color={colors.text} />
          <Text className="text-dark-bg font-semibold text-sm ml-2">
            Responder questões ({questions.length})
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (isFinished) {
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
          <Text className="text-dark-bg font-bold">Ver resultado</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
