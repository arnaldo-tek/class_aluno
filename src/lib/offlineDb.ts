import { Platform } from 'react-native'

export type ContentType = 'video' | 'audio' | 'pdf'
export type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed' | 'paused'

export interface DownloadRecord {
  id: string
  lesson_id: string
  course_id: string
  course_title: string
  lesson_title: string
  content_type: ContentType
  remote_url: string
  file_uri: string | null
  file_size: number
  status: DownloadStatus
  progress: number
  created_at: string
}

let db: any = null

async function getDb(): Promise<any> {
  if (Platform.OS === 'web') throw new Error('SQLite not available on web')
  if (db) return db
  const SQLite = require('expo-sqlite')
  db = await SQLite.openDatabaseAsync('offline_downloads.db')
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS downloads (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      course_title TEXT NOT NULL DEFAULT '',
      lesson_title TEXT NOT NULL DEFAULT '',
      content_type TEXT NOT NULL CHECK(content_type IN ('video', 'audio', 'pdf')),
      remote_url TEXT NOT NULL,
      file_uri TEXT,
      file_size INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'downloading', 'completed', 'failed', 'paused')),
      progress REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_downloads_lesson ON downloads(lesson_id, content_type);
    CREATE INDEX IF NOT EXISTS idx_downloads_course ON downloads(course_id);
    CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status);
  `)
  return db
}

export async function insertDownload(record: Omit<DownloadRecord, 'created_at' | 'file_uri' | 'status' | 'progress'>): Promise<void> {
  const database = await getDb()
  await database.runAsync(
    `INSERT OR REPLACE INTO downloads (id, lesson_id, course_id, course_title, lesson_title, content_type, remote_url, file_size)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    record.id, record.lesson_id, record.course_id, record.course_title, record.lesson_title, record.content_type, record.remote_url, record.file_size,
  )
}

export async function updateDownloadProgress(id: string, progress: number): Promise<void> {
  const database = await getDb()
  await database.runAsync(
    `UPDATE downloads SET progress = ?, status = 'downloading' WHERE id = ?`,
    progress, id,
  )
}

export async function updateDownloadStatus(id: string, status: DownloadStatus, fileUri?: string): Promise<void> {
  const database = await getDb()
  if (fileUri) {
    await database.runAsync(
      `UPDATE downloads SET status = ?, file_uri = ?, progress = CASE WHEN ? = 'completed' THEN 100 ELSE progress END WHERE id = ?`,
      status, fileUri, status, id,
    )
  } else {
    await database.runAsync(
      `UPDATE downloads SET status = ? WHERE id = ?`,
      status, id,
    )
  }
}

export async function getDownload(id: string): Promise<DownloadRecord | null> {
  const database = await getDb()
  return database.getFirstAsync<DownloadRecord>(
    `SELECT * FROM downloads WHERE id = ?`, id,
  )
}

export async function getDownloadByLessonAndType(lessonId: string, contentType: ContentType): Promise<DownloadRecord | null> {
  if (Platform.OS === 'web') return null
  const database = await getDb()
  return database.getFirstAsync<DownloadRecord>(
    `SELECT * FROM downloads WHERE lesson_id = ? AND content_type = ?`, lessonId, contentType,
  )
}

export async function getDownloadsByCourse(courseId: string): Promise<DownloadRecord[]> {
  if (Platform.OS === 'web') return []
  const database = await getDb()
  return database.getAllAsync<DownloadRecord>(
    `SELECT * FROM downloads WHERE course_id = ? ORDER BY created_at`, courseId,
  )
}

export async function getAllDownloads(): Promise<DownloadRecord[]> {
  if (Platform.OS === 'web') return []
  const database = await getDb()
  return database.getAllAsync<DownloadRecord>(
    `SELECT * FROM downloads ORDER BY created_at DESC`,
  )
}

export async function deleteDownload(id: string): Promise<void> {
  const database = await getDb()
  await database.runAsync(`DELETE FROM downloads WHERE id = ?`, id)
}

export async function deleteDownloadsByCourse(courseId: string): Promise<string[]> {
  const database = await getDb()
  const records = await database.getAllAsync<{ file_uri: string | null }>(
    `SELECT file_uri FROM downloads WHERE course_id = ?`, courseId,
  )
  await database.runAsync(`DELETE FROM downloads WHERE course_id = ?`, courseId)
  return records.filter((r: any) => r.file_uri).map((r: any) => r.file_uri!)
}

export async function getStorageUsed(): Promise<number> {
  if (Platform.OS === 'web') return 0
  const database = await getDb()
  const result = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(file_size), 0) as total FROM downloads WHERE status = 'completed'`,
  )
  return result?.total ?? 0
}

export async function getDownloadCount(): Promise<number> {
  if (Platform.OS === 'web') return 0
  const database = await getDb()
  const result = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM downloads WHERE status = 'completed'`,
  )
  return result?.count ?? 0
}
