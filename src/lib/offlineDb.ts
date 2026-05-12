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

export interface OfflineCourseRecord {
  id: string
  nome: string
  imagem: string | null
  descricao: string | null
  preco: number | null
  taxa_superclasse: number | null
  average_rating: number | null
  professor_id: string | null
  professor_user_id: string | null
  professor_nome: string | null
  professor_foto: string | null
  snapshot_at: string
}

export interface OfflineModuleRecord {
  id: string
  course_id: string
  nome: string
  sort_order: number
}

export interface OfflineLessonRecord {
  id: string
  module_id: string
  course_id: string
  titulo: string
  descricao: string | null
  sort_order: number
  is_liberado: number
  is_degustacao: number
  imagem_capa: string | null
  pdf_url: string | null
  video_url: string | null
  texto_aula: string | null
}

export interface OfflineAudioRecord {
  id: string
  lesson_id: string
  titulo: string | null
  audio_url: string
  created_at: string
}

export interface OfflineTextRecord {
  id: string
  lesson_id: string
  texto: string
}

export interface OfflineQuestionRecord {
  id: string
  lesson_id: string
  pergunta: string
  resposta: string
  alternativas: string | null
  video: string | null
  resposta_escrita: number
  sort_order: number
}

export interface OfflineFlashcardRecord {
  id: string
  lesson_id: string
  pergunta: string
  resposta: string
  professor_id: string | null
}

export interface OfflineProgressRecord {
  lesson_id: string
  user_id: string
  is_completed: number
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

    CREATE TABLE IF NOT EXISTS offline_courses (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      imagem TEXT,
      descricao TEXT,
      preco REAL,
      taxa_superclasse REAL,
      average_rating REAL,
      professor_id TEXT,
      professor_user_id TEXT,
      professor_nome TEXT,
      professor_foto TEXT,
      snapshot_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS offline_modules (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      nome TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (course_id) REFERENCES offline_courses(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_offline_modules_course ON offline_modules(course_id);

    CREATE TABLE IF NOT EXISTS offline_lessons (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      titulo TEXT NOT NULL,
      descricao TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_liberado INTEGER NOT NULL DEFAULT 0,
      is_degustacao INTEGER NOT NULL DEFAULT 0,
      imagem_capa TEXT,
      pdf_url TEXT,
      video_url TEXT,
      texto_aula TEXT,
      FOREIGN KEY (module_id) REFERENCES offline_modules(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_offline_lessons_module ON offline_lessons(module_id);
    CREATE INDEX IF NOT EXISTS idx_offline_lessons_course ON offline_lessons(course_id);

    CREATE TABLE IF NOT EXISTS offline_audios (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL,
      titulo TEXT,
      audio_url TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_offline_audios_lesson ON offline_audios(lesson_id);

    CREATE TABLE IF NOT EXISTS offline_texts (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL,
      texto TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_offline_texts_lesson ON offline_texts(lesson_id);

    CREATE TABLE IF NOT EXISTS offline_questions (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL,
      pergunta TEXT NOT NULL,
      resposta TEXT NOT NULL,
      alternativas TEXT,
      video TEXT,
      resposta_escrita INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_offline_questions_lesson ON offline_questions(lesson_id);

    CREATE TABLE IF NOT EXISTS offline_flashcards (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL,
      pergunta TEXT NOT NULL,
      resposta TEXT NOT NULL,
      professor_id TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_offline_flashcards_lesson ON offline_flashcards(lesson_id);

    CREATE TABLE IF NOT EXISTS offline_progress (
      lesson_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (lesson_id, user_id)
    );
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
  // Limpa metadata offline (manualmente, pois CASCADE pode não ser ativado)
  const lessonIds = `SELECT id FROM offline_lessons WHERE course_id = ?`
  await database.runAsync(`DELETE FROM offline_audios WHERE lesson_id IN (${lessonIds})`, courseId)
  await database.runAsync(`DELETE FROM offline_texts WHERE lesson_id IN (${lessonIds})`, courseId)
  await database.runAsync(`DELETE FROM offline_questions WHERE lesson_id IN (${lessonIds})`, courseId)
  await database.runAsync(`DELETE FROM offline_flashcards WHERE lesson_id IN (${lessonIds})`, courseId)
  await database.runAsync(`DELETE FROM offline_progress WHERE lesson_id IN (${lessonIds})`, courseId)
  await database.runAsync(`DELETE FROM offline_lessons WHERE course_id = ?`, courseId)
  await database.runAsync(`DELETE FROM offline_modules WHERE course_id = ?`, courseId)
  await database.runAsync(`DELETE FROM offline_courses WHERE id = ?`, courseId)
  return records.filter((r: any) => r.file_uri).map((r: any) => r.file_uri!)
}

export async function clearFailedDownloads(): Promise<void> {
  if (Platform.OS === 'web') return
  const database = await getDb()
  await database.runAsync(`DELETE FROM downloads WHERE status = 'failed'`)
}

export async function updateFileSize(id: string, fileSize: number): Promise<void> {
  const database = await getDb()
  await database.runAsync(`UPDATE downloads SET file_size = ? WHERE id = ?`, fileSize, id)
}

export async function getStorageUsed(): Promise<number> {
  if (Platform.OS === 'web') return 0
  const database = await getDb()
  const result = (await database.getFirstAsync(
    `SELECT COALESCE(SUM(file_size), 0) as total FROM downloads WHERE status = 'completed'`,
  )) as { total: number } | null
  return result?.total ?? 0
}

export async function getDownloadCount(): Promise<number> {
  if (Platform.OS === 'web') return 0
  const database = await getDb()
  const result = (await database.getFirstAsync(
    `SELECT COUNT(*) as count FROM downloads WHERE status = 'completed'`,
  )) as { count: number } | null
  return result?.count ?? 0
}

// ========================
// Offline metadata CRUD
// ========================

export async function upsertOfflineCourse(record: Omit<OfflineCourseRecord, 'snapshot_at'>): Promise<void> {
  if (Platform.OS === 'web') return
  const database = await getDb()
  await database.runAsync(
    `INSERT INTO offline_courses
      (id, nome, imagem, descricao, preco, taxa_superclasse, average_rating,
       professor_id, professor_user_id, professor_nome, professor_foto)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       nome = excluded.nome,
       imagem = excluded.imagem,
       descricao = excluded.descricao,
       preco = excluded.preco,
       taxa_superclasse = excluded.taxa_superclasse,
       average_rating = excluded.average_rating,
       professor_id = excluded.professor_id,
       professor_user_id = excluded.professor_user_id,
       professor_nome = excluded.professor_nome,
       professor_foto = excluded.professor_foto,
       snapshot_at = datetime('now')`,
    record.id, record.nome, record.imagem ?? null, record.descricao ?? null,
    record.preco ?? null, record.taxa_superclasse ?? null, record.average_rating ?? null,
    record.professor_id ?? null, record.professor_user_id ?? null,
    record.professor_nome ?? null, record.professor_foto ?? null,
  )
}

export async function upsertOfflineModule(record: OfflineModuleRecord): Promise<void> {
  if (Platform.OS === 'web') return
  const database = await getDb()
  await database.runAsync(
    `INSERT INTO offline_modules (id, course_id, nome, sort_order)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       course_id = excluded.course_id,
       nome = excluded.nome,
       sort_order = excluded.sort_order`,
    record.id, record.course_id, record.nome, record.sort_order,
  )
}

export async function upsertOfflineLesson(record: OfflineLessonRecord): Promise<void> {
  if (Platform.OS === 'web') return
  const database = await getDb()
  await database.runAsync(
    `INSERT INTO offline_lessons
      (id, module_id, course_id, titulo, descricao, sort_order,
       is_liberado, is_degustacao, imagem_capa, pdf_url, video_url, texto_aula)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       module_id = excluded.module_id,
       course_id = excluded.course_id,
       titulo = excluded.titulo,
       descricao = excluded.descricao,
       sort_order = excluded.sort_order,
       is_liberado = excluded.is_liberado,
       is_degustacao = excluded.is_degustacao,
       imagem_capa = excluded.imagem_capa,
       pdf_url = excluded.pdf_url,
       video_url = excluded.video_url,
       texto_aula = excluded.texto_aula`,
    record.id, record.module_id, record.course_id, record.titulo,
    record.descricao ?? null, record.sort_order,
    record.is_liberado, record.is_degustacao,
    record.imagem_capa ?? null, record.pdf_url ?? null,
    record.video_url ?? null, record.texto_aula ?? null,
  )
}

export async function getOfflineCourse(courseId: string): Promise<OfflineCourseRecord | null> {
  if (Platform.OS === 'web') return null
  const database = await getDb()
  return database.getFirstAsync(
    `SELECT * FROM offline_courses WHERE id = ?`, courseId,
  ) as Promise<OfflineCourseRecord | null>
}

export async function getOfflineCoursesWithDownloads(): Promise<OfflineCourseRecord[]> {
  if (Platform.OS === 'web') return []
  const database = await getDb()
  return database.getAllAsync(
    `SELECT DISTINCT oc.* FROM offline_courses oc
     INNER JOIN downloads d ON d.course_id = oc.id
     WHERE d.status = 'completed'`,
  ) as Promise<OfflineCourseRecord[]>
}

export async function getOfflineModulesWithLessons(courseId: string): Promise<
  Array<OfflineModuleRecord & { aulas: OfflineLessonRecord[] }>
> {
  if (Platform.OS === 'web') return []
  const database = await getDb()
  const modules = (await database.getAllAsync(
    `SELECT * FROM offline_modules WHERE course_id = ? ORDER BY sort_order`, courseId,
  )) as OfflineModuleRecord[]
  const lessons = (await database.getAllAsync(
    `SELECT * FROM offline_lessons WHERE course_id = ? ORDER BY sort_order`, courseId,
  )) as OfflineLessonRecord[]
  return modules.map((mod: OfflineModuleRecord) => ({
    ...mod,
    aulas: lessons.filter((l: OfflineLessonRecord) => l.module_id === mod.id),
  }))
}

export async function upsertOfflineAudio(record: Omit<OfflineAudioRecord, 'created_at'>): Promise<void> {
  if (Platform.OS === 'web') return
  const database = await getDb()
  await database.runAsync(
    `INSERT INTO offline_audios (id, lesson_id, titulo, audio_url)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       lesson_id = excluded.lesson_id,
       titulo = excluded.titulo,
       audio_url = excluded.audio_url`,
    record.id, record.lesson_id, record.titulo ?? null, record.audio_url,
  )
}

export async function getOfflineAudios(lessonId: string): Promise<OfflineAudioRecord[]> {
  if (Platform.OS === 'web') return []
  const database = await getDb()
  return database.getAllAsync<OfflineAudioRecord>(
    `SELECT * FROM offline_audios WHERE lesson_id = ? ORDER BY created_at`, lessonId,
  )
}

export async function getOfflineLesson(lessonId: string): Promise<OfflineLessonRecord | null> {
  if (Platform.OS === 'web') return null
  const database = await getDb()
  return database.getFirstAsync(
    `SELECT * FROM offline_lessons WHERE id = ?`, lessonId,
  ) as Promise<OfflineLessonRecord | null>
}

export async function upsertOfflineText(record: OfflineTextRecord): Promise<void> {
  if (Platform.OS === 'web') return
  const database = await getDb()
  await database.runAsync(
    `INSERT INTO offline_texts (id, lesson_id, texto) VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET lesson_id = excluded.lesson_id, texto = excluded.texto`,
    record.id, record.lesson_id, record.texto,
  )
}

export async function getOfflineTexts(lessonId: string): Promise<OfflineTextRecord[]> {
  if (Platform.OS === 'web') return []
  const database = await getDb()
  return database.getAllAsync<OfflineTextRecord>(
    `SELECT * FROM offline_texts WHERE lesson_id = ?`, lessonId,
  )
}

export async function upsertOfflineQuestion(record: OfflineQuestionRecord): Promise<void> {
  if (Platform.OS === 'web') return
  const database = await getDb()
  await database.runAsync(
    `INSERT INTO offline_questions (id, lesson_id, pergunta, resposta, alternativas, video, resposta_escrita, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       lesson_id = excluded.lesson_id, pergunta = excluded.pergunta, resposta = excluded.resposta,
       alternativas = excluded.alternativas, video = excluded.video,
       resposta_escrita = excluded.resposta_escrita, sort_order = excluded.sort_order`,
    record.id, record.lesson_id, record.pergunta, record.resposta,
    record.alternativas ?? null, record.video ?? null,
    record.resposta_escrita, record.sort_order,
  )
}

export async function getOfflineQuestions(lessonId: string): Promise<OfflineQuestionRecord[]> {
  if (Platform.OS === 'web') return []
  const database = await getDb()
  const rows = await database.getAllAsync<OfflineQuestionRecord>(
    `SELECT * FROM offline_questions WHERE lesson_id = ? ORDER BY sort_order`, lessonId,
  )
  return rows.map((r) => ({
    ...r,
    alternativas: r.alternativas ? JSON.parse(r.alternativas) : null,
  }))
}

export async function upsertOfflineFlashcard(record: OfflineFlashcardRecord): Promise<void> {
  if (Platform.OS === 'web') return
  const database = await getDb()
  await database.runAsync(
    `INSERT INTO offline_flashcards (id, lesson_id, pergunta, resposta, professor_id)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       lesson_id = excluded.lesson_id, pergunta = excluded.pergunta,
       resposta = excluded.resposta, professor_id = excluded.professor_id`,
    record.id, record.lesson_id, record.pergunta, record.resposta, record.professor_id ?? null,
  )
}

export async function getOfflineFlashcards(lessonId: string): Promise<OfflineFlashcardRecord[]> {
  if (Platform.OS === 'web') return []
  const database = await getDb()
  return database.getAllAsync<OfflineFlashcardRecord>(
    `SELECT * FROM offline_flashcards WHERE lesson_id = ?`, lessonId,
  )
}

export async function upsertOfflineProgress(record: OfflineProgressRecord): Promise<void> {
  if (Platform.OS === 'web') return
  const database = await getDb()
  await database.runAsync(
    `INSERT INTO offline_progress (lesson_id, user_id, is_completed) VALUES (?, ?, ?)
     ON CONFLICT(lesson_id, user_id) DO UPDATE SET is_completed = excluded.is_completed`,
    record.lesson_id, record.user_id, record.is_completed,
  )
}

export async function getOfflineProgress(lessonId: string, userId: string): Promise<OfflineProgressRecord | null> {
  if (Platform.OS === 'web') return null
  const database = await getDb()
  return database.getFirstAsync<OfflineProgressRecord>(
    `SELECT * FROM offline_progress WHERE lesson_id = ? AND user_id = ?`, lessonId, userId,
  )
}

export async function deleteOfflineCourse(courseId: string): Promise<void> {
  if (Platform.OS === 'web') return
  const database = await getDb()
  // Manually delete children first (expo-sqlite may not enforce FK CASCADE)
  const lessonIds = `SELECT id FROM offline_lessons WHERE course_id = ?`
  await database.runAsync(`DELETE FROM offline_audios WHERE lesson_id IN (${lessonIds})`, courseId)
  await database.runAsync(`DELETE FROM offline_texts WHERE lesson_id IN (${lessonIds})`, courseId)
  await database.runAsync(`DELETE FROM offline_questions WHERE lesson_id IN (${lessonIds})`, courseId)
  await database.runAsync(`DELETE FROM offline_flashcards WHERE lesson_id IN (${lessonIds})`, courseId)
  await database.runAsync(`DELETE FROM offline_progress WHERE lesson_id IN (${lessonIds})`, courseId)
  await database.runAsync(`DELETE FROM offline_lessons WHERE course_id = ?`, courseId)
  await database.runAsync(`DELETE FROM offline_modules WHERE course_id = ?`, courseId)
  await database.runAsync(`DELETE FROM offline_courses WHERE id = ?`, courseId)
}

export async function getDownloadsByLesson(lessonId: string): Promise<DownloadRecord[]> {
  if (Platform.OS === 'web') return []
  const database = await getDb()
  const rows = await database.getAllAsync(
    `SELECT * FROM downloads WHERE lesson_id = ?`, lessonId,
  )
  return rows as DownloadRecord[]
}

export async function courseHasCompletedDownload(courseId: string): Promise<boolean> {
  if (Platform.OS === 'web') return false
  const database = await getDb()
  const result = (await database.getFirstAsync(
    `SELECT COUNT(*) as count FROM downloads WHERE course_id = ? AND status = 'completed'`, courseId,
  )) as { count: number } | null
  return (result?.count ?? 0) > 0
}
