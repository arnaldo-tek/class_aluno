import { useState, useEffect, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Alert, Platform, ToastAndroid, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Video, ResizeMode } from 'expo-av'
import { useAudioLawDetail, useAudioLawQuestions } from '@/hooks/useAudio'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AudioPlayerList } from '@/components/AudioPlayer'
import { t } from '@/i18n'
import { useThemeColors } from '@/hooks/useThemeColors'
import {
  useDownloadStatus,
  useStartDownload,
  usePauseDownload,
  useResumeDownload,
  useCancelDownload,
  useAllDownloads,
  useClearCourseDownloads,
} from '@/hooks/useDownloads'
import type { AudioItem } from '@/components/AudioPlayer'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

type TabKey = 'audio' | 'text' | 'questions'

// ---------------------------------------------------------------------------
// AudioDownloadChip — ícone de status por faixa
// ---------------------------------------------------------------------------

interface AudioDownloadChipProps {
  audioId: string
  audioUrl: string
  title: string
  courseId: string
  courseTitle: string
}

function AudioDownloadChip({ audioId, audioUrl, title, courseId, courseTitle }: AudioDownloadChipProps) {
  const colors = useThemeColors()
  const { data: download } = useDownloadStatus(audioId, 'audio')
  const startDownload = useStartDownload()
  const pauseDownload = usePauseDownload()
  const resumeDownload = useResumeDownload()
  const cancelDownload = useCancelDownload()
  const prevStatusRef = useRef<string | undefined>(undefined)

  const status = download?.status
  const progress = Math.round(download?.progress ?? 0)
  const downloadId = `${audioId}_audio`

  useEffect(() => {
    const prev = prevStatusRef.current
    prevStatusRef.current = status
    if (prev !== undefined && prev !== status && status === 'completed') {
      if (Platform.OS === 'android') {
        ToastAndroid.show(`${title} salvo offline`, ToastAndroid.SHORT)
      }
    }
  }, [status, title])

  const handleDownload = () => startDownload.mutate({
    lessonId: audioId,
    courseId,
    courseTitle,
    lessonTitle: title,
    contentType: 'audio',
    remoteUrl: audioUrl,
  })

  if (status === 'completed') {
    return (
      <TouchableOpacity
        onPress={() => Alert.alert('Remover download', `Remover "${title}" dos downloads?`, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Remover', style: 'destructive', onPress: () => cancelDownload.mutate(downloadId) },
        ])}
        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#34d39920', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 }}
        activeOpacity={0.7}
      >
        <Ionicons name="checkmark-circle" size={12} color="#34d399" />
        <Text style={{ fontSize: 11, color: '#34d399', fontWeight: '600', marginLeft: 3 }}>Salvo</Text>
      </TouchableOpacity>
    )
  }

  if (status === 'downloading') {
    return (
      <TouchableOpacity
        onPress={() => pauseDownload.mutate(downloadId)}
        style={{ marginLeft: 8, alignItems: 'center', justifyContent: 'center', minWidth: 36 }}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 11, color: '#93c5fd', fontWeight: '700' }}>{progress}%</Text>
      </TouchableOpacity>
    )
  }

  if (status === 'paused') {
    return (
      <TouchableOpacity onPress={() => resumeDownload.mutate(downloadId)} style={{ marginLeft: 8 }} activeOpacity={0.7}>
        <Ionicons name="play-circle-outline" size={24} color="#93c5fd" />
      </TouchableOpacity>
    )
  }

  if (status === 'failed') {
    return (
      <TouchableOpacity onPress={handleDownload} style={{ marginLeft: 8 }} activeOpacity={0.7}>
        <Ionicons name="refresh-circle-outline" size={24} color="#f87171" />
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity onPress={handleDownload} style={{ marginLeft: 8 }} activeOpacity={0.7}>
      <Ionicons name="arrow-down-circle-outline" size={24} color={colors.textSecondary} />
    </TouchableOpacity>
  )
}

// ---------------------------------------------------------------------------
// AudioDownloadHeader — "X/Y salvos", "Baixar tudo", "Remover tudo"
// ---------------------------------------------------------------------------

interface AudioDownloadHeaderProps {
  audios: AudioItem[]
  leiId: string
  leiNome: string
}

function AudioDownloadHeader({ audios, leiId, leiNome }: AudioDownloadHeaderProps) {
  const colors = useThemeColors()
  const { data: allDownloads = [] } = useAllDownloads()
  const startDownload = useStartDownload()
  const clearCourseDownloads = useClearCourseDownloads()

  const total = audios.length

  const savedCount = allDownloads.filter(
    (d) => audios.some((a) => a.id === d.lesson_id) && d.content_type === 'audio' && d.status === 'completed',
  ).length

  const allSaved = savedCount === total && total > 0

  function handleDownloadAll() {
    audios.forEach((audio) => {
      const existing = allDownloads.find((d) => d.lesson_id === audio.id && d.content_type === 'audio')
      if (!existing || existing.status === 'failed') {
        startDownload.mutate({
          lessonId: audio.id,
          courseId: leiId,
          courseTitle: leiNome,
          lessonTitle: audio.titulo ?? '',
          contentType: 'audio',
          remoteUrl: audio.audio_url,
        })
      }
    })
  }

  function handleRemoveAll() {
    Alert.alert('Remover todos', `Remover ${savedCount} áudios salvos offline?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => clearCourseDownloads.mutate(leiId) },
    ])
  }

  if (total === 0) return null

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
          {t('audio.title')} ({total})
        </Text>
        {savedCount > 0 && (
          <View style={{ backgroundColor: '#34d39920', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontSize: 11, color: '#34d399', fontWeight: '600' }}>{savedCount}/{total} salvos</Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        {!allSaved && (
          <TouchableOpacity
            onPress={handleDownloadAll}
            style={{ backgroundColor: '#93c5fd20', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            activeOpacity={0.7}
          >
            <Ionicons name="cloud-download-outline" size={14} color="#93c5fd" />
            <Text style={{ fontSize: 12, color: '#93c5fd', fontWeight: '600' }}>Baixar tudo</Text>
          </TouchableOpacity>
        )}
        {savedCount > 0 && (
          <TouchableOpacity onPress={handleRemoveAll} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={14} color={colors.textMuted} />
            <Text style={{ fontSize: 12, color: colors.textMuted }}>Remover tudo</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// AudioPlayerScreen
// ---------------------------------------------------------------------------

export default function AudioPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const colors = useThemeColors()
  const { data, isLoading } = useAudioLawDetail(id!)
  const { data: allDownloads = [] } = useAllDownloads()
  const { data: questions } = useAudioLawQuestions(id!)
  const [activeTab, setActiveTab] = useState<TabKey>('text')

  const lei = data?.lei
  const audios: AudioItem[] = (data?.audios ?? []).map((a: any) => ({
    id: a.id,
    titulo: a.titulo,
    audio_url: a.audio_url,
  }))

  const hasText = !!lei?.texto
  const hasAudio = audios.length > 0
  const hasQuestions = (questions?.length ?? 0) > 0

  const visibleTabs = ([
    hasText    ? { key: 'text'      as TabKey, label: 'Texto',    icon: 'document-text' } : null,
    hasAudio   ? { key: 'audio'     as TabKey, label: 'Áudio',    icon: 'musical-notes' } : null,
    hasQuestions ? { key: 'questions' as TabKey, label: 'Questões', icon: 'help-circle'  } : null,
  ].filter(Boolean)) as { key: TabKey; label: string; icon: string }[]

  // Quando os dados carregam, ajusta activeTab para a primeira aba visível
  useEffect(() => {
    if (!isLoading && visibleTabs.length > 0 && !visibleTabs.find((t) => t.key === activeTab)) {
      setActiveTab(visibleTabs[0].key)
    }
  }, [isLoading, hasText, hasAudio, hasQuestions])

  // Substitui audio_url pelo arquivo local quando disponível
  const offlineMap: Record<string, string> = {}
  allDownloads.forEach((dl) => {
    if (dl.content_type === 'audio' && dl.status === 'completed' && dl.file_uri) {
      offlineMap[dl.lesson_id] = dl.file_uri
    }
  })
  const resolvedAudios = audios.map((a) => ({
    ...a,
    audio_url: offlineMap[a.id] ?? a.audio_url,
  }))

  if (isLoading) return <LoadingSpinner />
  if (!lei) return null

  const tabs = visibleTabs

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

      <View className="flex-row border-b border-darkBorder-subtle px-4">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className={`flex-row items-center pb-3 pt-3 mr-6 ${activeTab === tab.key ? 'border-b-2 border-primary' : ''}`}
          >
            <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.key ? '#93c5fd' : colors.textSecondary} />
            <Text className={`text-sm font-semibold ml-1.5 ${activeTab === tab.key ? 'text-primary-light' : 'text-darkText-muted'}`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'audio' && (
          <View className="px-4 pt-4">
            {resolvedAudios.length > 0 && (
              <>
                <AudioDownloadHeader audios={audios} leiId={lei.id ?? ''} leiNome={lei.nome ?? ''} />
                <AudioPlayerList
                  audios={resolvedAudios}
                  accentColor="#93c5fd"
                  renderItemRight={(audio, i) => (
                    <AudioDownloadChip
                      audioId={audio.id}
                      audioUrl={audios.find((a) => a.id === audio.id)?.audio_url ?? audio.audio_url}
                      title={audio.titulo ?? `Áudio ${i + 1}`}
                      courseId={lei.id ?? ''}
                      courseTitle={lei.nome ?? ''}
                    />
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
                {lei.pdf && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(lei.pdf!)}
                    className="flex-row items-center mt-4 px-4 py-3 rounded-2xl border border-darkBorder-subtle bg-dark-surface"
                    activeOpacity={0.7}
                  >
                    <View className="w-10 h-10 rounded-xl bg-red-500/10 items-center justify-center">
                      <Ionicons name="document-text" size={20} color="#ef4444" />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-sm font-medium text-darkText">PDF para download</Text>
                      <Text className="text-xs text-darkText-muted mt-0.5">Toque para abrir o PDF</Text>
                    </View>
                    <Ionicons name="download-outline" size={20} color="#93c5fd" />
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View className="items-center py-12">
                <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
                <Text className="text-sm text-darkText-muted mt-2">Nenhum texto disponível</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'questions' && <AudioQuizSection leiId={id!} />}
      </ScrollView>
    </SafeAreaView>
  )
}

// ---------------------------------------------------------------------------
// AudioQuizSection — não modificado
// ---------------------------------------------------------------------------

function AudioQuizSection({ leiId }: { leiId: string }) {
  const colors = useThemeColors()
  const { data: questions, isLoading: loadingQuestions, error: questionsError } = useAudioLawQuestions(leiId)

  const [started, setStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [finished, setFinished] = useState(false)

  if (loadingQuestions) {
    return <LoadingSpinner />
  }

  if (questionsError) {
    return (
      <View className="items-center py-12 px-4">
        <Ionicons name="alert-circle-outline" size={40} color="#f87171" />
        <Text className="text-sm text-error mt-2">Erro ao carregar questões</Text>
      </View>
    )
  }

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
