import { useState, useRef, useCallback } from 'react'
import { View, Text, ScrollView, FlatList, TouchableOpacity, Dimensions, Platform, TextInput, Alert, PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Video, ResizeMode, Audio } from 'expo-av'
import { Animated as RNAnimated } from 'react-native'
import { WebView } from 'react-native-webview'
import { useLessonDetail, useLessonTexts, useLessonAudios, useLessonQuestions, useLessonProgress, useMarkLessonComplete } from '@/hooks/useLesson'
import { useLessonFlashcards } from '@/hooks/useFlashcards'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { DownloadButton } from '@/components/DownloadButton'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useOfflineUri } from '@/hooks/useDownloads'
import { t } from '@/i18n'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

type Tab = 'video' | 'text' | 'audio' | 'pdf' | 'quiz' | 'flashcards'

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const colors = useThemeColors()

  const { data: lesson, isLoading } = useLessonDetail(id!)
  const { data: texts } = useLessonTexts(id!)
  const { data: audios } = useLessonAudios(id!)
  const { data: questions } = useLessonQuestions(id!)
  const { data: progress } = useLessonProgress(id!)
  const markComplete = useMarkLessonComplete()

  // Determine available tabs
  const availableTabs: Tab[] = []
  if (lesson?.imagem_capa || lesson?.texto_aula) availableTabs.push('video')
  if (texts && texts.length > 0) availableTabs.push('text')
  if (audios && audios.length > 0) availableTabs.push('audio')
  if (lesson?.pdf) availableTabs.push('pdf')
  if (questions && questions.length > 0) availableTabs.push('quiz')
  availableTabs.push('flashcards')

  const [activeTab, setActiveTab] = useState<Tab>('video')

  if (isLoading) return <LoadingSpinner />
  if (!lesson) return null

  const tabLabels: Record<Tab, string> = {
    video: 'Video',
    text: 'Texto',
    audio: 'Audio',
    pdf: 'PDF',
    quiz: 'Questoes',
    flashcards: 'Flashcards',
  }

  const tabIcons: Record<Tab, string> = {
    video: 'videocam',
    text: 'document-text',
    audio: 'musical-notes',
    pdf: 'document',
    quiz: 'help-circle',
    flashcards: 'layers',
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder-subtle">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-base font-bold text-darkText" numberOfLines={1}>
            {lesson.titulo}
          </Text>
          <Text className="text-xs text-darkText-muted" numberOfLines={1}>
            {(lesson.modulo as any)?.nome} • {(lesson.curso as any)?.nome}
          </Text>
        </View>
        {Platform.OS !== 'web' && (
          <View className="flex-row items-center gap-1">
            {(lesson.video_url || (lesson.imagem_capa && (lesson.imagem_capa.includes('.mp4') || lesson.imagem_capa.includes('video')))) && (
              <DownloadButton
                lessonId={id!}
                courseId={(lesson.curso as any)?.id ?? lesson.curso_id ?? ''}
                courseTitle={(lesson.curso as any)?.nome ?? ''}
                lessonTitle={lesson.titulo ?? ''}
                contentType="video"
                remoteUrl={lesson.video_url || lesson.imagem_capa}
              />
            )}
            {audios && audios.length > 0 && audios[0]?.audio_url && (
              <DownloadButton
                lessonId={id!}
                courseId={(lesson.curso as any)?.id ?? lesson.curso_id ?? ''}
                courseTitle={(lesson.curso as any)?.nome ?? ''}
                lessonTitle={lesson.titulo ?? ''}
                contentType="audio"
                remoteUrl={audios[0].audio_url}
              />
            )}
            {lesson.pdf && (
              <DownloadButton
                lessonId={id!}
                courseId={(lesson.curso as any)?.id ?? lesson.curso_id ?? ''}
                courseTitle={(lesson.curso as any)?.nome ?? ''}
                lessonTitle={lesson.titulo ?? ''}
                contentType="pdf"
                remoteUrl={lesson.pdf}
              />
            )}
          </View>
        )}
      </View>

      {/* Tabs */}
      {availableTabs.length > 1 && (
        <View className="border-b border-darkBorder-subtle">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row px-4 py-3 gap-2">
              {availableTabs.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className={`flex-row items-center px-4 py-2.5 rounded-full ${activeTab === tab ? 'bg-primary' : 'bg-dark-surfaceLight'}`}
                >
                  <Ionicons
                    name={tabIcons[tab] as any}
                    size={14}
                    color={activeTab === tab ? '#ffffff' : colors.textSecondary}
                  />
                  <Text className={`text-sm font-semibold ml-1.5 ${activeTab === tab ? 'text-white' : 'text-darkText-secondary'}`}>
                    {tabLabels[tab]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Content */}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'video' && <VideoTab lesson={lesson} lessonId={id!} />}
        {activeTab === 'text' && <TextTab texts={texts ?? []} mainText={lesson.texto_aula} />}
        {activeTab === 'audio' && <AudioTab audios={audios ?? []} />}
        {activeTab === 'pdf' && lesson.pdf && <PdfTab url={lesson.pdf} />}
        {activeTab === 'quiz' && (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/lesson/quiz', params: { lesson_id: id! } })}
            className="mx-4 mt-6 bg-accent rounded-2xl py-4 items-center"
          >
            <Text className="text-darkText-inverse font-bold text-base">
              Iniciar Questoes ({questions?.length ?? 0})
            </Text>
          </TouchableOpacity>
        )}
        {activeTab === 'flashcards' && (
          <FlashcardsTab
            aulaId={id!}
            cursoId={(lesson.curso as any)?.id ?? lesson.curso_id}
          />
        )}

        {/* Mark as complete */}
        <View className="px-4 mt-6">
          {progress?.is_completed ? (
            <View className="flex-row items-center justify-center py-3.5 bg-success/10 rounded-2xl border border-success/30">
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <Text className="text-success font-semibold ml-2">Aula concluida</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                const cursoId = (lesson.curso as any)?.id ?? lesson.curso_id
                if (cursoId) markComplete.mutate({ aulaId: id!, cursoId })
              }}
              disabled={markComplete.isPending}
              className="bg-primary rounded-2xl py-3.5 items-center"
            >
              <Text className="text-white font-bold text-base">
                {markComplete.isPending ? 'Salvando...' : 'Marcar a aula como concluída'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// --- Video Tab ---

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2]

function VideoTab({ lesson, lessonId }: { lesson: any; lessonId: string }) {
  const colors = useThemeColors()
  const videoRef = useRef<Video>(null)
  const { data: offlineVideoUri } = useOfflineUri(lessonId, 'video')
  const [speed, setSpeed] = useState(1)

  const videoUrl = offlineVideoUri ?? lesson.video_url ?? lesson.imagem_capa
  const hasVideo = videoUrl && (videoUrl.includes('.mp4') || videoUrl.includes('video') || videoUrl.includes('youtube') || videoUrl.includes('vimeo') || videoUrl.startsWith('file://'))

  return (
    <View>
      {hasVideo ? (
        <View>
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 9 / 16, backgroundColor: '#000' }}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            shouldPlay={false}
            rate={speed}
          />
          <SpeedControl speed={speed} onSpeedChange={(s) => { setSpeed(s); videoRef.current?.setRateAsync?.(s, true) }} />
        </View>
      ) : (
        <View className="w-full bg-black items-center justify-center" style={{ height: SCREEN_WIDTH * 9 / 16 }}>
          <Ionicons name="videocam-off-outline" size={48} color={colors.textMuted} />
          <Text className="text-sm text-darkText-muted mt-2">Nenhum vídeo disponível</Text>
        </View>
      )}

      {/* Lesson description */}
      {lesson.descricao && (
        <View className="px-5 pt-5">
          <Text className="text-sm font-bold text-darkText mb-2">{t('courses.description')}</Text>
          <Text className="text-base text-darkText-secondary leading-7">{lesson.descricao}</Text>
        </View>
      )}

      {lesson.texto_aula && (
        <View className="px-5 pt-5">
          <Text className="text-base text-darkText-secondary leading-7">{lesson.texto_aula}</Text>
        </View>
      )}
    </View>
  )
}

// --- Text Tab ---

function TextTab({ texts, mainText }: { texts: Array<{ id: string; texto: string }>; mainText?: string | null }) {
  return (
    <View className="px-5 pt-5">
      {mainText && (
        <Text className="text-base text-darkText-secondary leading-7 mb-5">{mainText}</Text>
      )}
      {texts.map((t) => (
        <View key={t.id} className="mb-5 pb-5 border-b border-darkBorder-subtle">
          <Text className="text-base text-darkText-secondary leading-7">{t.texto}</Text>
        </View>
      ))}
    </View>
  )
}

// --- Speed Control ---

function SpeedControl({ speed, onSpeedChange }: { speed: number; onSpeedChange: (s: number) => void }) {
  return (
    <View className="flex-row items-center justify-center py-2 gap-1">
      {SPEED_OPTIONS.map((s) => (
        <TouchableOpacity
          key={s}
          onPress={() => onSpeedChange(s)}
          className={`px-3 py-1.5 rounded-full ${speed === s ? 'bg-primary' : 'bg-dark-surfaceLight'}`}
        >
          <Text className={`text-xs font-semibold ${speed === s ? 'text-white' : 'text-darkText-muted'}`}>
            {s}x
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// --- Audio Tab ---

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const THUMB_SIZE = 16
const TRACK_H = 6
const SEEK_BAR_HORIZONTAL_PADDING = 16

function AudioSeekBar({ progress, positionMs, durationMs, onSeekStart, onSeek }: {
  progress: number
  positionMs: number
  durationMs: number
  onSeekStart: () => void
  onSeek: (ratio: number) => void
}) {
  const barWidth = SCREEN_WIDTH - 32 - SEEK_BAR_HORIZONTAL_PADDING * 2 // card px-4 + inner px-4
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
        {/* Track background */}
        <View
          className="bg-dark-surfaceLight rounded-full"
          style={{ height: TRACK_H, width: '100%' }}
        >
          {/* Track fill */}
          <View
            className="bg-primary rounded-full"
            style={{ height: TRACK_H, width: `${displayProgress * 100}%` }}
          />
        </View>

        {/* Thumb */}
        <View
          style={{
            position: 'absolute',
            left: displayProgress * barWidth - THUMB_SIZE / 2,
            top: (THUMB_SIZE + 8 - THUMB_SIZE) / 2,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            backgroundColor: '#3b82f6',
            borderWidth: 2,
            borderColor: '#ffffff',
            ...(dragging ? {
              transform: [{ scale: 1.25 }],
              shadowColor: '#3b82f6',
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

function AudioTab({ audios }: { audios: Array<{ id: string; titulo: string | null; audio_url: string }> }) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [positionMs, setPositionMs] = useState(0)
  const [durationMs, setDurationMs] = useState(0)
  const soundRef = useRef<Audio.Sound | null>(null)
  const isSeeking = useRef(false)

  const playAudio = useCallback(async (index: number) => {
    if (soundRef.current) {
      await soundRef.current.stopAsync()
      await soundRef.current.unloadAsync()
      soundRef.current = null
    }

    setPositionMs(0)
    setDurationMs(0)

    const audio = audios[index]
    if (!audio) return

    const { sound } = await Audio.Sound.createAsync(
      { uri: audio.audio_url },
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
          const nextIndex = index + 1
          if (nextIndex < audios.length) {
            playAudio(nextIndex)
          } else {
            setIsPlaying(false)
            setCurrentIndex(null)
            setPositionMs(0)
            setDurationMs(0)
          }
        }
      },
    )

    soundRef.current = sound
    setCurrentIndex(index)
    setIsPlaying(true)
  }, [audios, speed])

  const togglePlayPause = useCallback(async (index: number) => {
    if (currentIndex === index && isPlaying) {
      await soundRef.current?.pauseAsync()
      setIsPlaying(false)
    } else if (currentIndex === index && !isPlaying) {
      await soundRef.current?.playAsync()
      setIsPlaying(true)
    } else {
      await playAudio(index)
    }
  }, [currentIndex, isPlaying, playAudio])

  async function handleSpeedChange(s: number) {
    setSpeed(s)
    if (soundRef.current) {
      await soundRef.current.setRateAsync(s, true)
    }
  }

  const handleSeek = useCallback(async (ratio: number) => {
    if (soundRef.current && durationMs > 0) {
      const seekTo = ratio * durationMs
      await soundRef.current.setPositionAsync(seekTo)
      setPositionMs(seekTo)
    }
    isSeeking.current = false
  }, [durationMs])

  const progress = durationMs > 0 ? positionMs / durationMs : 0

  return (
    <View className="px-4 pt-5">
      <Text className="text-sm font-bold text-darkText mb-2">
        Áudios ({audios.length})
      </Text>
      <SpeedControl speed={speed} onSpeedChange={handleSpeedChange} />
      <View className="mt-2">
        {audios.map((audio, i) => (
          <View key={audio.id} className={`mb-2.5 rounded-2xl overflow-hidden ${
            currentIndex === i ? 'bg-primary-50 border border-primary/30' : 'bg-dark-surface'
          }`}>
            <TouchableOpacity
              onPress={() => togglePlayPause(i)}
              className="flex-row items-center px-4 py-3.5"
            >
              <View className={`w-10 h-10 rounded-full items-center justify-center ${
                currentIndex === i && isPlaying ? 'bg-primary' : 'bg-dark-surfaceLight'
              }`}>
                <Ionicons
                  name={currentIndex === i && isPlaying ? 'pause' : 'play'}
                  size={18}
                  color={currentIndex === i && isPlaying ? 'white' : '#3b82f6'}
                />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-sm font-medium text-darkText">
                  {audio.titulo ?? `Áudio ${i + 1}`}
                </Text>
              </View>
              {currentIndex === i && (
                <Ionicons name="musical-notes" size={16} color="#fbbf24" />
              )}
            </TouchableOpacity>

            {/* Progress bar - shown for current audio */}
            {currentIndex === i && (
              <AudioSeekBar
                progress={progress}
                positionMs={positionMs}
                durationMs={durationMs}
                onSeekStart={() => { isSeeking.current = true }}
                onSeek={handleSeek}
              />
            )}
          </View>
        ))}
      </View>

      {/* Play all button */}
      {audios.length > 1 && (
        <TouchableOpacity
          onPress={() => playAudio(0)}
          className="mt-3 bg-primary rounded-2xl py-3.5 items-center"
        >
          <Text className="text-white font-bold text-sm">Reproduzir todos sequencialmente</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// --- PDF Tab ---

function PdfTab({ url }: { url: string }) {
  const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`

  return (
    <View className="px-4 pt-4">
      <View style={{ height: 500 }} className="rounded-xl overflow-hidden">
        <WebView
          source={{ uri: viewerUrl }}
          style={{ flex: 1 }}
          startInLoadingState
          renderLoading={() => <LoadingSpinner />}
          javaScriptEnabled
          nestedScrollEnabled
        />
      </View>
      <TouchableOpacity
        onPress={() => {
          const { Linking } = require('react-native')
          Linking.openURL(url)
        }}
        className="flex-row items-center justify-center bg-primary rounded-2xl py-3.5 mt-3"
      >
        <Ionicons name="download-outline" size={18} color="#ffffff" />
        <Text className="text-sm font-bold text-white ml-2">Baixar PDF</Text>
      </TouchableOpacity>
    </View>
  )
}

// --- Flashcards Tab ---

// Card height: screen minus header (~56), tabs (~52), "mark complete" area (~80), padding
const CARD_HEIGHT = SCREEN_HEIGHT - 240

function FlashcardsTab({ aulaId, cursoId }: { aulaId: string; cursoId?: string }) {
  const { data: cards = [], isLoading } = useLessonFlashcards(aulaId)
  const [currentIndex, setCurrentIndex] = useState(0)

  if (isLoading) return <LoadingSpinner />

  if (cards.length === 0) {
    return (
      <View className="items-center py-12">
        <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
          <Ionicons name="layers-outline" size={32} color="#2563eb" />
        </View>
        <Text className="text-base font-semibold text-darkText">Nenhum flashcard</Text>
        <Text className="text-sm text-darkText-muted mt-1 text-center px-8">
          O professor ainda não adicionou flashcards a esta aula
        </Text>
      </View>
    )
  }

  return (
    <View className="pt-4">
      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
          setCurrentIndex(index)
        }}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}>
            <FlipCard pergunta={item.pergunta} resposta={item.resposta} />
          </View>
        )}
      />

      {/* Counter */}
      <View className="flex-row items-center justify-center mt-3">
        <Text className="text-sm font-semibold text-darkText-secondary">
          {currentIndex + 1} / {cards.length}
        </Text>
      </View>
    </View>
  )
}

function FlipCard({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  const colors = useThemeColors()
  const [isFlipped, setIsFlipped] = useState(false)
  const animValue = useRef(new RNAnimated.Value(0)).current

  const flip = useCallback(() => {
    RNAnimated.timing(animValue, {
      toValue: isFlipped ? 0 : 1,
      duration: 400,
      useNativeDriver: true,
    }).start()
    setIsFlipped(!isFlipped)
  }, [isFlipped, animValue])

  const frontRotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  })

  const backRotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  })

  return (
    <TouchableOpacity onPress={flip} activeOpacity={0.95} style={{ height: CARD_HEIGHT }}>
      <View className="flex-1 relative">
        {/* Front - Frente */}
        <RNAnimated.View style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: [{ rotateY: frontRotate }] }}>
          <View className="flex-1 bg-dark-surface rounded-2xl border border-darkBorder-subtle p-6">
            <View className="flex-row items-center mb-4">
              <View className="w-7 h-7 rounded-full bg-primary/15 items-center justify-center">
                <Text className="text-xs font-bold text-primary">F</Text>
              </View>
              <Text className="text-xs font-bold text-primary ml-2 tracking-wider">FRENTE</Text>
            </View>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <Text className="text-base text-darkText leading-6" style={{ textAlign: 'justify' }}>{pergunta}</Text>
            </ScrollView>
            <View className="flex-row items-center justify-center pt-3 border-t border-darkBorder-subtle mt-3">
              <Ionicons name="sync-outline" size={14} color={colors.textMuted} />
              <Text className="text-xs text-darkText-muted ml-1.5">Toque para virar</Text>
            </View>
          </View>
        </RNAnimated.View>

        {/* Back - Verso */}
        <RNAnimated.View style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: [{ rotateY: backRotate }] }}>
          <View className="flex-1 bg-dark-surfaceLight rounded-2xl border border-accent/30 p-6">
            <View className="flex-row items-center mb-4">
              <View className="w-7 h-7 rounded-full bg-accent/20 items-center justify-center">
                <Text className="text-xs font-bold text-accent">V</Text>
              </View>
              <Text className="text-xs font-bold text-accent ml-2 tracking-wider">VERSO</Text>
            </View>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <Text className="text-base text-darkText leading-6" style={{ textAlign: 'justify' }}>{resposta}</Text>
            </ScrollView>
            <View className="flex-row items-center justify-center pt-3 border-t border-darkBorder-subtle mt-3">
              <Ionicons name="sync-outline" size={14} color={colors.textMuted} />
              <Text className="text-xs text-darkText-muted ml-1.5">Toque para virar</Text>
            </View>
          </View>
        </RNAnimated.View>
      </View>
    </TouchableOpacity>
  )
}
