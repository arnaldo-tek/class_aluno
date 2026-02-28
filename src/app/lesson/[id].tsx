import { useState, useRef, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Video, ResizeMode, Audio } from 'expo-av'
import { WebView } from 'react-native-webview'
import { useLessonDetail, useLessonTexts, useLessonAudios, useLessonQuestions, useLessonProgress, useMarkLessonComplete } from '@/hooks/useLesson'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { t } from '@/i18n'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

type Tab = 'video' | 'text' | 'audio' | 'pdf' | 'quiz'

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

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

  const [activeTab, setActiveTab] = useState<Tab>('video')

  if (isLoading) return <LoadingSpinner />
  if (!lesson) return null

  const tabLabels: Record<Tab, string> = {
    video: 'Video',
    text: 'Texto',
    audio: 'Audio',
    pdf: 'PDF',
    quiz: 'Questoes',
  }

  const tabIcons: Record<Tab, string> = {
    video: 'videocam',
    text: 'document-text',
    audio: 'musical-notes',
    pdf: 'document',
    quiz: 'help-circle',
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder-subtle">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-base font-bold text-darkText" numberOfLines={1}>
            {lesson.titulo}
          </Text>
          <Text className="text-xs text-darkText-muted" numberOfLines={1}>
            {(lesson.modulo as any)?.nome} • {(lesson.curso as any)?.nome}
          </Text>
        </View>
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
                    color={activeTab === tab ? '#ffffff' : '#6b7280'}
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
        {activeTab === 'video' && <VideoTab lesson={lesson} />}
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
                {markComplete.isPending ? 'Salvando...' : 'Marcar como concluida'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// --- Video Tab ---

function VideoTab({ lesson }: { lesson: any }) {
  const videoRef = useRef<Video>(null)

  const videoUrl = lesson.imagem_capa
  const hasVideo = videoUrl && (videoUrl.includes('.mp4') || videoUrl.includes('video') || videoUrl.includes('youtube') || videoUrl.includes('vimeo'))

  return (
    <View>
      {hasVideo ? (
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 9 / 16, backgroundColor: '#000' }}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          shouldPlay={false}
        />
      ) : (
        <View className="w-full bg-black items-center justify-center" style={{ height: SCREEN_WIDTH * 9 / 16 }}>
          <Ionicons name="videocam-off-outline" size={48} color="#9ca3af" />
          <Text className="text-sm text-darkText-muted mt-2">Nenhum video disponivel</Text>
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

// --- Audio Tab ---

function AudioTab({ audios }: { audios: Array<{ id: string; titulo: string | null; audio_url: string }> }) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const soundRef = useRef<Audio.Sound | null>(null)

  const playAudio = useCallback(async (index: number) => {
    if (soundRef.current) {
      await soundRef.current.stopAsync()
      await soundRef.current.unloadAsync()
      soundRef.current = null
    }

    const audio = audios[index]
    if (!audio) return

    const { sound } = await Audio.Sound.createAsync(
      { uri: audio.audio_url },
      { shouldPlay: true },
      (status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          const nextIndex = index + 1
          if (nextIndex < audios.length) {
            playAudio(nextIndex)
          } else {
            setIsPlaying(false)
            setCurrentIndex(null)
          }
        }
      },
    )

    soundRef.current = sound
    setCurrentIndex(index)
    setIsPlaying(true)
  }, [audios])

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

  return (
    <View className="px-4 pt-5">
      <Text className="text-sm font-bold text-darkText mb-4">
        Audios ({audios.length})
      </Text>
      {audios.map((audio, i) => (
        <TouchableOpacity
          key={audio.id}
          onPress={() => togglePlayPause(i)}
          className={`flex-row items-center px-4 py-3.5 mb-2.5 rounded-2xl ${
            currentIndex === i ? 'bg-primary-50 border border-primary/30' : 'bg-dark-surface'
          }`}
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
              {audio.titulo ?? `Audio ${i + 1}`}
            </Text>
          </View>
          {currentIndex === i && (
            <Ionicons name="musical-notes" size={16} color="#fbbf24" />
          )}
        </TouchableOpacity>
      ))}

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
    <View style={{ height: 600 }}>
      <WebView
        source={{ uri: viewerUrl }}
        style={{ flex: 1, backgroundColor: '#f7f6f3' }}
        startInLoadingState
        renderLoading={() => <LoadingSpinner />}
      />
    </View>
  )
}
