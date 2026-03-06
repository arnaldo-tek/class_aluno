import { useState, useRef, useCallback, useEffect } from 'react'
import { View, Text, ScrollView, FlatList, TouchableOpacity, Dimensions, Platform, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Video, ResizeMode } from 'expo-av'
import { Animated as RNAnimated } from 'react-native'
import { WebView } from 'react-native-webview'
import { useLessonDetail, useLessonTexts, useLessonAudios, useLessonQuestions, useLessonProgress, useMarkLessonComplete } from '@/hooks/useLesson'
import { useLessonFlashcards } from '@/hooks/useFlashcards'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { DownloadButton } from '@/components/DownloadButton'
import { AudioPlayerList, AudioSpeedControl } from '@/components/AudioPlayer'
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
      {activeTab === 'flashcards' ? (
        <View className="flex-1">
          <FlashcardsTab
            aulaId={id!}
            cursoId={(lesson.curso as any)?.id ?? lesson.curso_id}
          />
          {/* Mark as complete */}
          <View className="px-4 pb-4">
            {progress?.is_completed ? (
              <View className="flex-row items-center justify-center py-3 bg-success/10 rounded-2xl border border-success/30">
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
                className="bg-primary rounded-2xl py-3 items-center"
              >
                <Text className="text-white font-bold text-base">
                  {markComplete.isPending ? 'Salvando...' : 'Marcar a aula como concluída'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
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
      )}
    </SafeAreaView>
  )
}

// --- Video Tab ---

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
          <AudioSpeedControl speed={speed} onSpeedChange={(s) => { setSpeed(s); videoRef.current?.setRateAsync?.(s, true) }} />
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

// --- Audio Tab ---

function AudioTab({ audios }: { audios: Array<{ id: string; titulo: string | null; audio_url: string }> }) {
  return (
    <View className="px-4 pt-5">
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#f7f6f3' }}>
          Áudios ({audios.length})
        </Text>
      </View>
      <AudioPlayerList audios={audios} accentColor="#3b82f6" />
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

function FlashcardsTab({ aulaId, cursoId }: { aulaId: string; cursoId?: string }) {
  const colors = useThemeColors()
  const { data: cards = [], isLoading } = useLessonFlashcards(aulaId)
  const [currentIndex, setCurrentIndex] = useState(0)

  if (isLoading) return <LoadingSpinner />

  if (cards.length === 0) {
    return (
      <View className="items-center py-12">
        <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
          <Ionicons name="layers-outline" size={32} color="#2563eb" />
        </View>
        <Text style={{ color: colors.text }} className="text-base font-semibold">Nenhum flashcard</Text>
        <Text style={{ color: colors.textMuted }} className="text-sm mt-1 text-center px-8">
          O professor ainda não adicionou flashcards a esta aula
        </Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, paddingTop: 8 }}>
      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
          setCurrentIndex(index)
        }}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 16, flex: 1 }}>
            <FlipCard pergunta={item.pergunta} resposta={item.resposta} />
          </View>
        )}
      />

      {/* Counter */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>
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
  const touchStartRef = useRef({ x: 0, y: 0 })

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
    <View
      style={{ flex: 1 }}
      onTouchStart={(e) => { touchStartRef.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY } }}
      onTouchEnd={(e) => {
        const dx = Math.abs(e.nativeEvent.pageX - touchStartRef.current.x)
        const dy = Math.abs(e.nativeEvent.pageY - touchStartRef.current.y)
        if (dx < 10 && dy < 10) flip()
      }}
    >
      <View style={{ flex: 1, position: 'relative' }}>
        {/* Front - Frente */}
        <RNAnimated.View pointerEvents={isFlipped ? 'none' : 'auto'} style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: [{ rotateY: frontRotate }] }}>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSubtle, padding: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(37,99,235,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#3b82f6' }}>F</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#3b82f6', marginLeft: 8, letterSpacing: 1.5 }}>FRENTE</Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="sync-outline" size={16} color={colors.textMuted} />
            </View>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator nestedScrollEnabled>
              <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, textAlign: 'justify' }}>{pergunta}</Text>
            </ScrollView>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderSubtle, marginTop: 12 }}>
              <Ionicons name="sync-outline" size={14} color={colors.textMuted} />
              <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 6 }}>Toque para virar</Text>
            </View>
          </View>
        </RNAnimated.View>

        {/* Back - Verso */}
        <RNAnimated.View pointerEvents={isFlipped ? 'auto' : 'none'} style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: [{ rotateY: backRotate }] }}>
          <View style={{ flex: 1, backgroundColor: colors.surfaceLight, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(96,165,250,0.3)', padding: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(96,165,250,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#60a5fa' }}>V</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#60a5fa', marginLeft: 8, letterSpacing: 1.5 }}>VERSO</Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="sync-outline" size={16} color={colors.textMuted} />
            </View>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator nestedScrollEnabled>
              <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, textAlign: 'justify' }}>{resposta}</Text>
            </ScrollView>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderSubtle, marginTop: 12 }}>
              <Ionicons name="sync-outline" size={14} color={colors.textMuted} />
              <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 6 }}>Toque para virar</Text>
            </View>
          </View>
        </RNAnimated.View>
      </View>
    </View>
  )
}
