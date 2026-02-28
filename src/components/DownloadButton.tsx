import { Pressable, View, Text, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useDownloadStatus, useStartDownload, usePauseDownload, useResumeDownload, useCancelDownload } from '@/hooks/useDownloads'
import type { ContentType } from '@/lib/offlineDb'
import { t } from '@/i18n'
import Svg, { Circle } from 'react-native-svg'

interface DownloadButtonProps {
  lessonId: string
  courseId: string
  courseTitle: string
  lessonTitle: string
  contentType: ContentType
  remoteUrl: string
  fileSize?: number
  size?: number
}

function CircularProgress({ progress, size }: { progress: number; size: number }) {
  const strokeWidth = 2.5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <Svg width={size} height={size} style={{ position: 'absolute' }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#e5e4e1"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#2563eb"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  )
}

export function DownloadButton({
  lessonId, courseId, courseTitle, lessonTitle, contentType, remoteUrl, fileSize, size = 32,
}: DownloadButtonProps) {
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
      case 'downloading':
        pauseDownload.mutate(`${lessonId}_${contentType}`)
        break
      case 'paused':
        resumeDownload.mutate(`${lessonId}_${contentType}`)
        break
      case 'failed':
        startDownload.mutate({ lessonId, courseId, courseTitle, lessonTitle, contentType, remoteUrl, fileSize })
        break
      case 'completed':
        break
      default:
        startDownload.mutate({ lessonId, courseId, courseTitle, lessonTitle, contentType, remoteUrl, fileSize })
    }
  }

  const handleLongPress = () => {
    if (status === 'completed') {
      Alert.alert(
        t('removeDownload'),
        t('removeDownloadConfirm'),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('remove'),
            style: 'destructive',
            onPress: () => cancelDownload.mutate(`${lessonId}_${contentType}`),
          },
        ],
      )
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
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      hitSlop={8}
      className="items-center justify-center"
      style={{ width: size, height: size }}
    >
      {status === 'downloading' && <CircularProgress progress={progress} size={size} />}
      <Ionicons name={getIcon()} size={iconSize} color={getColor()} />
    </Pressable>
  )
}
