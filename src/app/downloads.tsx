import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { t } from '@/i18n'
import {
  useAllDownloads,
  useStorageInfo,
  useCancelDownload,
  usePauseDownload,
  useResumeDownload,
  useClearCourseDownloads,
  formatFileSize,
  useDownloadListeners,
} from '@/hooks/useDownloads'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import type { ContentType } from '@/lib/offlineDb'

const typeIcons: Record<ContentType, keyof typeof Ionicons.glyphMap> = {
  video: 'videocam',
  audio: 'musical-notes',
  pdf: 'document-text',
}

const typeColors: Record<ContentType, string> = {
  video: '#2563eb',
  audio: '#f59e0b',
  pdf: '#ef4444',
}

export default function DownloadsScreen() {
  const router = useRouter()
  const { data: downloads = [], isLoading } = useAllDownloads()
  const { data: storageUsed = 0 } = useStorageInfo()
  const cancelDownload = useCancelDownload()
  const pauseDownload = usePauseDownload()
  const resumeDownload = useResumeDownload()
  const clearCourse = useClearCourseDownloads()

  useDownloadListeners()

  // Group by course
  const grouped = downloads.reduce<Record<string, { title: string; items: DownloadRecord[] }>>((acc, d) => {
    if (!acc[d.course_id]) acc[d.course_id] = { title: d.course_title || 'Sem curso', items: [] }
    acc[d.course_id].items.push(d)
    return acc
  }, {})

  const handleRemove = (id: string) => {
    Alert.alert(t('removeDownload'), t('removeDownloadConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('remove'), style: 'destructive', onPress: () => cancelDownload.mutate(id) },
    ])
  }

  const handleClearCourse = (courseId: string, title: string) => {
    Alert.alert(t('clearAll'), `${t('removeDownloadConfirm')}\n\n${title}`, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('remove'), style: 'destructive', onPress: () => clearCourse.mutate(courseId) },
    ])
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder-subtle bg-dark-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-darkText flex-1">{t('downloads')}</Text>
      </View>

      {/* Storage info */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-dark-surface border-b border-darkBorder-subtle">
        <View className="flex-row items-center">
          <Ionicons name="folder-outline" size={18} color="#6b7280" />
          <Text className="text-sm text-darkText-secondary ml-2">
            {t('storageUsed')}: {formatFileSize(storageUsed)}
          </Text>
        </View>
        <Text className="text-xs text-darkText-muted">
          {downloads.filter(d => d.status === 'completed').length} {t('downloaded').toLowerCase()}
        </Text>
      </View>

      {downloads.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="download-outline" size={48} color="#9ca3af" />}
          title={t('noDownloads')}
          description={t('noDownloadsDesc')}
        />
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
          {Object.entries(grouped).map(([courseId, { title, items }]) => (
            <View key={courseId} className="mt-4">
              {/* Course header */}
              <View className="flex-row items-center justify-between px-4 mb-2">
                <Text className="text-sm font-bold text-darkText flex-1" numberOfLines={1}>
                  {title}
                </Text>
                <TouchableOpacity
                  onPress={() => handleClearCourse(courseId, title)}
                  hitSlop={8}
                  className="ml-2"
                >
                  <Ionicons name="trash-outline" size={16} color="#f87171" />
                </TouchableOpacity>
              </View>

              {/* Items */}
              {items.map((item) => (
                <View
                  key={item.id}
                  className="flex-row items-center mx-4 mb-2 px-4 py-3 bg-dark-surface rounded-xl"
                >
                  <View
                    className="w-8 h-8 rounded-lg items-center justify-center"
                    style={{ backgroundColor: `${typeColors[item.content_type]}15` }}
                  >
                    <Ionicons
                      name={typeIcons[item.content_type]}
                      size={16}
                      color={typeColors[item.content_type]}
                    />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-sm font-medium text-darkText" numberOfLines={1}>
                      {item.lesson_title || item.id}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                      <Text className="text-xs text-darkText-muted">
                        {item.content_type.toUpperCase()} • {formatFileSize(item.file_size)}
                      </Text>
                      {item.status === 'downloading' && (
                        <Text className="text-xs text-primary ml-2">{Math.round(item.progress)}%</Text>
                      )}
                      {item.status === 'paused' && (
                        <Text className="text-xs text-accent ml-2">{t('paused')}</Text>
                      )}
                      {item.status === 'failed' && (
                        <Text className="text-xs text-error ml-2">{t('downloadFailed')}</Text>
                      )}
                    </View>
                    {(item.status === 'downloading' || item.status === 'paused') && (
                      <View className="mt-1.5 h-1 rounded-full bg-gray-200 overflow-hidden">
                        <View
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${item.progress}%` }}
                        />
                      </View>
                    )}
                  </View>

                  {/* Actions */}
                  <View className="flex-row items-center ml-2 gap-2">
                    {item.status === 'downloading' && (
                      <TouchableOpacity onPress={() => pauseDownload.mutate(item.id)} hitSlop={8}>
                        <Ionicons name="pause-circle-outline" size={22} color="#6b7280" />
                      </TouchableOpacity>
                    )}
                    {item.status === 'paused' && (
                      <TouchableOpacity onPress={() => resumeDownload.mutate(item.id)} hitSlop={8}>
                        <Ionicons name="play-circle-outline" size={22} color="#2563eb" />
                      </TouchableOpacity>
                    )}
                    {item.status === 'completed' && (
                      <Ionicons name="checkmark-circle" size={22} color="#34d399" />
                    )}
                    <TouchableOpacity onPress={() => handleRemove(item.id)} hitSlop={8}>
                      <Ionicons name="close-circle-outline" size={22} color="#f87171" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
