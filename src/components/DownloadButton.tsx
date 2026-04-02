import { useEffect, useRef } from 'react'
import { Pressable, View, Text, Alert, Platform, ToastAndroid } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useDownloadStatus, useStartDownload, usePauseDownload, useResumeDownload, useCancelDownload } from '@/hooks/useDownloads'
import type { ContentType } from '@/lib/offlineDb'
import { t } from '@/i18n'
import Svg, { Circle } from 'react-native-svg'

// --- Types ---

interface DownloadBaseProps {
  lessonId: string
  courseId: string
  courseTitle: string
  lessonTitle: string
  contentType: ContentType
  remoteUrl: string
  fileSize?: number
}

interface DownloadButtonProps extends DownloadBaseProps {
  size?: number
}

interface DownloadRowProps extends DownloadBaseProps {
  icon: keyof typeof Ionicons.glyphMap
  label: string
}

interface DownloadSectionProps {
  lessonId: string
  courseId: string
  courseTitle: string
  lessonTitle: string
  videoUrl?: string | null
  audioUrl?: string | null
  pdfUrl?: string | null
}

// --- Helpers ---

function showToast(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT)
  }
}

// --- Circular progress (used in DownloadButton) ---

function CircularProgress({ progress, size }: { progress: number; size: number }) {
  const strokeWidth = 2.5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <Svg width={size} height={size} style={{ position: 'absolute' }}>
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e4e1" strokeWidth={strokeWidth} fill="none" />
      <Circle
        cx={size / 2} cy={size / 2} r={radius} stroke="#2563eb" strokeWidth={strokeWidth} fill="none"
        strokeDasharray={`${circumference}`} strokeDashoffset={strokeDashoffset}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  )
}

// --- DownloadButton (compact icon, used in audio player) ---

export function DownloadButton({ lessonId, courseId, courseTitle, lessonTitle, contentType, remoteUrl, fileSize, size = 32 }: DownloadButtonProps) {
  const { data: download } = useDownloadStatus(lessonId, contentType)
  const startDownload = useStartDownload()
  const pauseDownload = usePauseDownload()
  const resumeDownload = useResumeDownload()
  const cancelDownload = useCancelDownload()

  const status = download?.status
  const progress = download?.progress ?? 0
  const iconSize = size * 0.55

  const handlePress = () => {
    switch (status) {
      case 'downloading': pauseDownload.mutate(`${lessonId}_${contentType}`); break
      case 'paused': resumeDownload.mutate(`${lessonId}_${contentType}`); break
      case 'failed':
      default: startDownload.mutate({ lessonId, courseId, courseTitle, lessonTitle, contentType, remoteUrl, fileSize })
    }
  }

  const handleLongPress = () => {
    if (status === 'completed') {
      Alert.alert(t('removeDownload'), t('removeDownloadConfirm'), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('remove'), style: 'destructive', onPress: () => cancelDownload.mutate(`${lessonId}_${contentType}`) },
      ])
    }
  }

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'downloading': return 'pause'
      case 'paused': return 'play'
      case 'completed': return 'checkmark-circle'
      case 'failed': return 'refresh'
      default: return 'arrow-down-circle-outline'
    }
  }

  const getColor = () => {
    switch (status) {
      case 'completed': return '#34d399'
      case 'failed': return '#f87171'
      case 'downloading': return '#2563eb'
      case 'paused': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  return (
    <Pressable onPress={handlePress} onLongPress={handleLongPress} hitSlop={8}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {status === 'downloading' && <CircularProgress progress={progress} size={size} />}
      <Ionicons name={getIcon()} size={iconSize} color={getColor()} />
    </Pressable>
  )
}

// --- DownloadRow (full row, used in lesson screen) ---

export function DownloadRow({ lessonId, courseId, courseTitle, lessonTitle, contentType, remoteUrl, fileSize, icon, label }: DownloadRowProps) {
  const { data: download } = useDownloadStatus(lessonId, contentType)
  const startDownload = useStartDownload()
  const pauseDownload = usePauseDownload()
  const resumeDownload = useResumeDownload()
  const cancelDownload = useCancelDownload()
  const prevStatusRef = useRef<string | undefined>(undefined)

  const status = download?.status
  const progress = Math.round(download?.progress ?? 0)
  const fileSizeLabel = download?.file_size && download.file_size > 0
    ? `${(download.file_size / 1024 / 1024).toFixed(1)} MB`
    : null

  useEffect(() => {
    const prev = prevStatusRef.current
    prevStatusRef.current = status
    if (prev !== undefined && prev !== status && status === 'completed') {
      showToast(`${label} salvo para assistir offline`)
    }
  }, [status, label])

  const typeColor = contentType === 'video' ? '#3b82f6' : contentType === 'audio' ? '#a855f7' : '#f59e0b'

  const handleAction = () => {
    switch (status) {
      case 'downloading': pauseDownload.mutate(`${lessonId}_${contentType}`); break
      case 'paused': resumeDownload.mutate(`${lessonId}_${contentType}`); break
      case 'failed':
      default: startDownload.mutate({ lessonId, courseId, courseTitle, lessonTitle, contentType, remoteUrl, fileSize })
    }
  }

  const handleDelete = () => {
    Alert.alert('Remover download', `Remover ${label} salvo offline?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: () => {
          cancelDownload.mutate(`${lessonId}_${contentType}`)
          showToast(`${label} removido`)
        },
      },
    ])
  }

  const statusText = () => {
    switch (status) {
      case 'downloading': return `Baixando... ${progress}%`
      case 'paused': return 'Pausado — toque para continuar'
      case 'completed': return fileSizeLabel ? `Salvo • ${fileSizeLabel}` : 'Salvo'
      case 'failed': return 'Erro ao baixar — toque para tentar novamente'
      default: return 'Toque para baixar'
    }
  }

  const statusColor = status === 'completed' ? '#34d399' : status === 'failed' ? '#f87171' : '#9ca3af'

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Icon */}
        <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: `${typeColor}20`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Ionicons name={icon} size={18} color={typeColor} />
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#f7f6f3' }}>{label}</Text>
          <Text style={{ fontSize: 12, color: statusColor, marginTop: 2 }}>{statusText()}</Text>
          {status === 'downloading' && (
            <View style={{ height: 3, borderRadius: 99, backgroundColor: '#1e2a3a', marginTop: 6, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${progress}%`, backgroundColor: typeColor, borderRadius: 99 }} />
            </View>
          )}
        </View>

        {/* Action */}
        {status === 'completed' ? (
          <Pressable onPress={handleDelete} hitSlop={10} style={{ padding: 4 }}>
            <Ionicons name="trash-outline" size={18} color="#4b5563" />
          </Pressable>
        ) : status === 'downloading' ? (
          <Pressable onPress={handleAction} hitSlop={10} style={{ padding: 4 }}>
            <Ionicons name="pause-circle-outline" size={26} color={typeColor} />
          </Pressable>
        ) : (
          <Pressable onPress={handleAction} hitSlop={10} style={{ padding: 4 }}>
            <Ionicons
              name={status === 'paused' ? 'play-circle-outline' : status === 'failed' ? 'refresh-circle-outline' : 'arrow-down-circle-outline'}
              size={26}
              color={status === 'failed' ? '#f87171' : '#4b5563'}
            />
          </Pressable>
        )}
      </View>
    </View>
  )
}

// --- DownloadSection (full section with all content types) ---

export function DownloadSection({ lessonId, courseId, courseTitle, lessonTitle, videoUrl, audioUrl, pdfUrl }: DownloadSectionProps) {
  if (!videoUrl && !audioUrl && !pdfUrl) return null

  const items = [
    videoUrl ? { contentType: 'video' as ContentType, url: videoUrl, icon: 'videocam' as const, label: 'Vídeo' } : null,
    audioUrl ? { contentType: 'audio' as ContentType, url: audioUrl, icon: 'musical-notes' as const, label: 'Áudio' } : null,
    pdfUrl ? { contentType: 'pdf' as ContentType, url: pdfUrl, icon: 'document-text' as const, label: 'PDF' } : null,
  ].filter(Boolean) as Array<{ contentType: ContentType; url: string; icon: keyof typeof Ionicons.glyphMap; label: string }>

  return (
    <View style={{ marginHorizontal: 16, marginTop: 20, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#1e2a3a', backgroundColor: '#0d1b2a' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e2a3a' }}>
        <Ionicons name="save-outline" size={14} color="#6b7280" />
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#6b7280', marginLeft: 6, letterSpacing: 0.8, textTransform: 'uppercase' }}>
          Salvar para assistir offline
        </Text>
      </View>

      {items.map((item, idx) => (
        <View key={item.contentType}>
          {idx > 0 && <View style={{ height: 1, backgroundColor: '#1e2a3a', marginLeft: 66 }} />}
          <DownloadRow
            lessonId={lessonId}
            courseId={courseId}
            courseTitle={courseTitle}
            lessonTitle={lessonTitle}
            contentType={item.contentType}
            remoteUrl={item.url}
            icon={item.icon}
            label={item.label}
          />
        </View>
      ))}
    </View>
  )
}
