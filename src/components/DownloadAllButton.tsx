import { Pressable, View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useCourseDownloads, useDownloadAllCourse, useClearCourseDownloads } from '@/hooks/useDownloads'
import { t } from '@/i18n'

interface Lesson {
  lessonId: string
  lessonTitle: string
  videoUrl?: string
  audioUrl?: string
  pdfUrl?: string
}

interface DownloadAllButtonProps {
  courseId: string
  courseTitle: string
  lessons: Lesson[]
}

export function DownloadAllButton({ courseId, courseTitle, lessons }: DownloadAllButtonProps) {
  const { data: downloads = [] } = useCourseDownloads(courseId)
  const downloadAll = useDownloadAllCourse()
  const clearAll = useClearCourseDownloads()

  const completed = downloads.filter(d => d.status === 'completed').length
  const downloading = downloads.filter(d => d.status === 'downloading' || d.status === 'pending').length
  const total = downloads.length
  const isDownloading = downloading > 0
  const allCompleted = total > 0 && completed === total

  const totalItems = lessons.reduce((acc, l) => {
    if (l.videoUrl) acc++
    if (l.audioUrl) acc++
    if (l.pdfUrl) acc++
    return acc
  }, 0)

  const overallProgress = total > 0
    ? downloads.reduce((sum, d) => sum + (d.progress ?? 0), 0) / total
    : 0

  const handlePress = () => {
    if (allCompleted) return
    if (isDownloading) return
    downloadAll.mutate({ courseId, courseTitle, lessons })
  }

  if (totalItems === 0) return null

  return (
    <Pressable
      onPress={handlePress}
      className={`flex-row items-center rounded-xl px-4 py-3 ${
        allCompleted ? 'bg-emerald-50' : isDownloading ? 'bg-blue-50' : 'bg-gray-50'
      }`}
    >
      <Ionicons
        name={allCompleted ? 'checkmark-circle' : isDownloading ? 'cloud-download' : 'download-outline'}
        size={22}
        color={allCompleted ? '#34d399' : isDownloading ? '#2563eb' : '#6b7280'}
      />
      <View className="ml-3 flex-1">
        <Text className="text-sm font-medium" style={{ color: '#1a1a2e' }}>
          {allCompleted
            ? t('downloaded')
            : isDownloading
            ? `${t('downloading')}... ${completed}/${total}`
            : `${t('downloadAll')} (${totalItems})`}
        </Text>
        {isDownloading && (
          <View className="mt-1.5 h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <View
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${overallProgress}%` }}
            />
          </View>
        )}
      </View>
      {allCompleted && (
        <Pressable
          onPress={() => clearAll.mutate(courseId)}
          hitSlop={8}
          className="ml-2"
        >
          <Ionicons name="trash-outline" size={18} color="#f87171" />
        </Pressable>
      )}
    </Pressable>
  )
}
