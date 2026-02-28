import * as FileSystem from 'expo-file-system'
import {
  insertDownload,
  updateDownloadProgress,
  updateDownloadStatus,
  getDownload,
  deleteDownload as dbDelete,
  getDownloadsByCourse,
  type ContentType,
  type DownloadRecord,
} from './offlineDb'

const OFFLINE_DIR = `${FileSystem.documentDirectory}offline/`
const MAX_CONCURRENT = 2

type ProgressCallback = (id: string, progress: number) => void
type StatusCallback = (id: string, status: string) => void

const activeDownloads = new Map<string, FileSystem.DownloadResumable>()
const queue: string[] = []
let activeCount = 0
let onProgress: ProgressCallback | null = null
let onStatusChange: StatusCallback | null = null

export function setProgressCallback(cb: ProgressCallback | null) {
  onProgress = cb
}

export function setStatusCallback(cb: StatusCallback | null) {
  onStatusChange = cb
}

async function ensureDir(contentType: ContentType) {
  const dir = `${OFFLINE_DIR}${contentType}/`
  const info = await FileSystem.getInfoAsync(dir)
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true })
  }
  return dir
}

function getFileExtension(url: string, contentType: ContentType): string {
  const urlPath = url.split('?')[0]
  const ext = urlPath.split('.').pop()?.toLowerCase()
  if (ext && ['mp4', 'mp3', 'pdf', 'webm', 'mov', 'm4a', 'aac', 'wav'].includes(ext)) {
    return ext
  }
  switch (contentType) {
    case 'video': return 'mp4'
    case 'audio': return 'mp3'
    case 'pdf': return 'pdf'
  }
}

async function processQueue() {
  while (activeCount < MAX_CONCURRENT && queue.length > 0) {
    const id = queue.shift()!
    activeCount++
    executeDownload(id).finally(() => {
      activeCount--
      processQueue()
    })
  }
}

async function executeDownload(id: string) {
  const record = await getDownload(id)
  if (!record) return

  try {
    const dir = await ensureDir(record.content_type)
    const ext = getFileExtension(record.remote_url, record.content_type)
    const fileUri = `${dir}${id}.${ext}`

    await updateDownloadStatus(id, 'downloading')
    onStatusChange?.(id, 'downloading')

    const downloadResumable = FileSystem.createDownloadResumable(
      record.remote_url,
      fileUri,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesExpectedToWrite > 0
          ? (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
          : 0
        updateDownloadProgress(id, progress)
        onProgress?.(id, progress)
      },
    )

    activeDownloads.set(id, downloadResumable)
    const result = await downloadResumable.downloadAsync()
    activeDownloads.delete(id)

    if (result) {
      const fileInfo = await FileSystem.getInfoAsync(result.uri)
      const fileSize = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : record.file_size
      await updateDownloadStatus(id, 'completed', result.uri)
      if (fileSize !== record.file_size) {
        const db = await import('./offlineDb').then(m => m.getDb())
        const database = await db
        await database.runAsync(`UPDATE downloads SET file_size = ? WHERE id = ?`, fileSize, id)
      }
      onStatusChange?.(id, 'completed')
    }
  } catch (error: unknown) {
    activeDownloads.delete(id)
    if (error instanceof Error && error.message?.includes('cancelled')) {
      return
    }
    await updateDownloadStatus(id, 'failed')
    onStatusChange?.(id, 'failed')
  }
}

export async function startDownload(params: {
  lessonId: string
  courseId: string
  courseTitle: string
  lessonTitle: string
  contentType: ContentType
  remoteUrl: string
  fileSize?: number
}): Promise<string> {
  const id = `${params.lessonId}_${params.contentType}`

  const existing = await getDownload(id)
  if (existing?.status === 'completed') return id
  if (existing?.status === 'downloading') return id

  await insertDownload({
    id,
    lesson_id: params.lessonId,
    course_id: params.courseId,
    course_title: params.courseTitle,
    lesson_title: params.lessonTitle,
    content_type: params.contentType,
    remote_url: params.remoteUrl,
    file_size: params.fileSize ?? 0,
  })

  queue.push(id)
  processQueue()
  return id
}

export async function pauseDownload(id: string) {
  const resumable = activeDownloads.get(id)
  if (resumable) {
    await resumable.pauseAsync()
    activeDownloads.delete(id)
    activeCount = Math.max(0, activeCount - 1)
  }
  await updateDownloadStatus(id, 'paused')
  onStatusChange?.(id, 'paused')
  processQueue()
}

export async function resumeDownload(id: string) {
  const record = await getDownload(id)
  if (!record || record.status !== 'paused') return

  await updateDownloadStatus(id, 'pending')
  queue.push(id)
  processQueue()
}

export async function cancelDownload(id: string) {
  const resumable = activeDownloads.get(id)
  if (resumable) {
    try { await resumable.cancelAsync() } catch { /* ignore */ }
    activeDownloads.delete(id)
    activeCount = Math.max(0, activeCount - 1)
  }

  const record = await getDownload(id)
  if (record?.file_uri) {
    try { await FileSystem.deleteAsync(record.file_uri, { idempotent: true }) } catch { /* ignore */ }
  }

  await dbDelete(id)
  onStatusChange?.(id, 'deleted')
  processQueue()
}

export async function downloadAllCourse(params: {
  courseId: string
  courseTitle: string
  lessons: Array<{
    lessonId: string
    lessonTitle: string
    videoUrl?: string
    audioUrl?: string
    pdfUrl?: string
  }>
}) {
  for (const lesson of params.lessons) {
    if (lesson.videoUrl) {
      await startDownload({
        lessonId: lesson.lessonId,
        courseId: params.courseId,
        courseTitle: params.courseTitle,
        lessonTitle: lesson.lessonTitle,
        contentType: 'video',
        remoteUrl: lesson.videoUrl,
      })
    }
    if (lesson.audioUrl) {
      await startDownload({
        lessonId: lesson.lessonId,
        courseId: params.courseId,
        courseTitle: params.courseTitle,
        lessonTitle: lesson.lessonTitle,
        contentType: 'audio',
        remoteUrl: lesson.audioUrl,
      })
    }
    if (lesson.pdfUrl) {
      await startDownload({
        lessonId: lesson.lessonId,
        courseId: params.courseId,
        courseTitle: params.courseTitle,
        lessonTitle: lesson.lessonTitle,
        contentType: 'pdf',
        remoteUrl: lesson.pdfUrl,
      })
    }
  }
}

export async function getOfflineUri(lessonId: string, contentType: ContentType): Promise<string | null> {
  const record = await getDownload(`${lessonId}_${contentType}`)
  if (record?.status === 'completed' && record.file_uri) {
    const info = await FileSystem.getInfoAsync(record.file_uri)
    if (info.exists) return record.file_uri
    await updateDownloadStatus(record.id, 'failed')
  }
  return null
}
