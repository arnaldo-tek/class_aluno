import { useState, useRef, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Video, ResizeMode, Audio } from 'expo-av'
import { WebView } from 'react-native-webview'
import { useLessonDetail, useLessonTexts, useLessonAudios, useLessonQuestions } from '@/hooks/useLesson'
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

  // Determine available tabs
  const availableTabs: Tab[] = []
  if (lesson?.imagem_capa || lesson?.texto_aula) availableTabs.push('video')
  if (texts && texts.length > 0) availableTabs.push('text')
  if (audios && audios.length > 0) availableTabs.push('audio')
  if (lesson?.pdf) availableTabs.push('pdf')
  if (questions && questions.length > 0) availableTabs.push('quiz')

  // Default to first available or 'video'
  const [activeTab, setActiveTab] = useState<Tab>('video')

  if (isLoading) return <LoadingSpinner />
  if (!lesson) return null

  const tabLabels: Record<Tab, string> = {
    video: 'Vídeo',
    text: 'Texto',
    audio: 'Áudio',
    pdf: 'PDF',
    quiz: 'Questões',
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
            {lesson.titulo}
          </Text>
          <Text className="text-xs text-gray-500" numberOfLines={1}>
            {(lesson.modulo as any)?.nome} • {(lesson.curso as any)?.nome}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      {availableTabs.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="border-b border-gray-100">
          <View className="flex-row px-4 py-2">
            {availableTabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`px-4 py-2 mr-2 rounded-full ${activeTab === tab ? 'bg-blue-600' : 'bg-gray-100'}`}
              >
                <Text className={`text-sm font-medium ${activeTab === tab ? 'text-white' : 'text-gray-600'}`}>
                  {tabLabels[tab]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
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
            className="mx-4 mt-4 bg-blue-600 rounded-xl py-4 items-center"
          >
            <Text className="text-white font-bold text-base">
              Iniciar Questões ({questions?.length ?? 0})
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// --- Video Tab ---

function VideoTab({ lesson }: { lesson: any }) {
  const videoRef = useRef<Video>(null)

  // Use imagem_capa as video URL if it looks like a video, otherwise show text
  const videoUrl = lesson.imagem_capa
  const hasVideo = videoUrl && (videoUrl.includes('.mp4') || videoUrl.includes('video') || videoUrl.includes('youtube') || videoUrl.includes('vimeo'))

  return (
    <View>
      {hasVideo ? (
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 9 / 16 }}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          shouldPlay={false}
        />
      ) : (
        <View className="w-full bg-gray-100 items-center justify-center" style={{ height: SCREEN_WIDTH * 9 / 16 }}>
          <Ionicons name="videocam-off-outline" size={48} color="#9ca3af" />
          <Text className="text-sm text-gray-400 mt-2">Nenhum vídeo disponível</Text>
        </View>
      )}

      {/* Lesson description */}
      {lesson.descricao && (
        <View className="px-4 pt-4">
          <Text className="text-sm font-semibold text-gray-900 mb-2">{t('courses.description')}</Text>
          <Text className="text-sm text-gray-700 leading-6">{lesson.descricao}</Text>
        </View>
      )}

      {lesson.texto_aula && (
        <View className="px-4 pt-4">
          <Text className="text-sm text-gray-700 leading-6">{lesson.texto_aula}</Text>
        </View>
      )}
    </View>
  )
}

// --- Text Tab ---

function TextTab({ texts, mainText }: { texts: Array<{ id: string; texto: string }>; mainText?: string | null }) {
  return (
    <View className="px-4 pt-4">
      {mainText && (
        <Text className="text-sm text-gray-700 leading-6 mb-4">{mainText}</Text>
      )}
      {texts.map((t, i) => (
        <View key={t.id} className="mb-4 pb-4 border-b border-gray-50">
          <Text className="text-sm text-gray-700 leading-6">{t.texto}</Text>
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
    // Stop current
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
          // Sequential playback: auto-play next
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
    <View className="px-4 pt-4">
      <Text className="text-sm font-semibold text-gray-900 mb-3">
        Áudios ({audios.length})
      </Text>
      {audios.map((audio, i) => (
        <TouchableOpacity
          key={audio.id}
          onPress={() => togglePlayPause(i)}
          className={`flex-row items-center px-4 py-3 mb-2 rounded-xl border ${
            currentIndex === i ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
          }`}
        >
          <View className={`w-10 h-10 rounded-full items-center justify-center ${
            currentIndex === i && isPlaying ? 'bg-blue-600' : 'bg-gray-100'
          }`}>
            <Ionicons
              name={currentIndex === i && isPlaying ? 'pause' : 'play'}
              size={18}
              color={currentIndex === i && isPlaying ? 'white' : '#2563eb'}
            />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-sm font-medium text-gray-900">
              {audio.titulo ?? `Áudio ${i + 1}`}
            </Text>
          </View>
          {currentIndex === i && (
            <Ionicons name="musical-notes" size={16} color="#2563eb" />
          )}
        </TouchableOpacity>
      ))}

      {/* Play all button */}
      {audios.length > 1 && (
        <TouchableOpacity
          onPress={() => playAudio(0)}
          className="mt-2 bg-blue-600 rounded-xl py-3 items-center"
        >
          <Text className="text-white font-semibold text-sm">Reproduzir todos sequencialmente</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// --- PDF Tab ---

function PdfTab({ url }: { url: string }) {
  // Use Google Docs viewer for PDF rendering
  const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`

  return (
    <View style={{ height: 600 }}>
      <WebView
        source={{ uri: viewerUrl }}
        style={{ flex: 1 }}
        startInLoadingState
        renderLoading={() => <LoadingSpinner />}
      />
    </View>
  )
}
