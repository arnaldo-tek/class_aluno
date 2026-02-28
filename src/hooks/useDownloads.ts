import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAllDownloads,
  getDownloadByLessonAndType,
  getStorageUsed,
  getDownloadCount,
  getDownloadsByCourse,
  deleteDownloadsByCourse,
  type ContentType,
} from '@/lib/offlineDb'
import {
  startDownload as dmStart,
  pauseDownload as dmPause,
  resumeDownload as dmResume,
  cancelDownload as dmCancel,
  downloadAllCourse as dmDownloadAll,
  setProgressCallback,
  setStatusCallback,
  getOfflineUri,
} from '@/lib/downloadManager'
import * as FileSystem from 'expo-file-system'

const DOWNLOAD_KEYS = {
  all: ['downloads'] as const,
  list: () => [...DOWNLOAD_KEYS.all, 'list'] as const,
  course: (courseId: string) => [...DOWNLOAD_KEYS.all, 'course', courseId] as const,
  item: (lessonId: string, type: ContentType) => [...DOWNLOAD_KEYS.all, 'item', lessonId, type] as const,
  storage: () => [...DOWNLOAD_KEYS.all, 'storage'] as const,
  count: () => [...DOWNLOAD_KEYS.all, 'count'] as const,
}

export function useDownloadListeners() {
  const qc = useQueryClient()

  useEffect(() => {
    setProgressCallback((_id, _progress) => {
      qc.invalidateQueries({ queryKey: DOWNLOAD_KEYS.all })
    })
    setStatusCallback((_id, _status) => {
      qc.invalidateQueries({ queryKey: DOWNLOAD_KEYS.all })
    })
    return () => {
      setProgressCallback(null)
      setStatusCallback(null)
    }
  }, [qc])
}

export function useAllDownloads() {
  return useQuery({
    queryKey: DOWNLOAD_KEYS.list(),
    queryFn: getAllDownloads,
    refetchInterval: 3000,
  })
}

export function useCourseDownloads(courseId: string) {
  return useQuery({
    queryKey: DOWNLOAD_KEYS.course(courseId),
    queryFn: () => getDownloadsByCourse(courseId),
    enabled: !!courseId,
    refetchInterval: 3000,
  })
}

export function useDownloadStatus(lessonId: string, contentType: ContentType) {
  return useQuery({
    queryKey: DOWNLOAD_KEYS.item(lessonId, contentType),
    queryFn: () => getDownloadByLessonAndType(lessonId, contentType),
    enabled: !!lessonId,
    refetchInterval: 2000,
  })
}

export function useStorageInfo() {
  return useQuery({
    queryKey: DOWNLOAD_KEYS.storage(),
    queryFn: getStorageUsed,
  })
}

export function useDownloadCount() {
  return useQuery({
    queryKey: DOWNLOAD_KEYS.count(),
    queryFn: getDownloadCount,
  })
}

export function useStartDownload() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: dmStart,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DOWNLOAD_KEYS.all })
    },
  })
}

export function usePauseDownload() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: dmPause,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DOWNLOAD_KEYS.all })
    },
  })
}

export function useResumeDownload() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: dmResume,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DOWNLOAD_KEYS.all })
    },
  })
}

export function useCancelDownload() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: dmCancel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DOWNLOAD_KEYS.all })
    },
  })
}

export function useDownloadAllCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: dmDownloadAll,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DOWNLOAD_KEYS.all })
    },
  })
}

export function useClearCourseDownloads() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (courseId: string) => {
      const fileUris = await deleteDownloadsByCourse(courseId)
      for (const uri of fileUris) {
        try { await FileSystem.deleteAsync(uri, { idempotent: true }) } catch { /* ignore */ }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DOWNLOAD_KEYS.all })
    },
  })
}

export function useOfflineUri(lessonId: string | undefined, contentType: ContentType) {
  return useQuery({
    queryKey: ['offline-uri', lessonId, contentType],
    queryFn: () => getOfflineUri(lessonId!, contentType),
    enabled: !!lessonId,
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
