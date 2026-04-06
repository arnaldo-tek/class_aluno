import * as FileSystem from 'expo-file-system/legacy'
import { Platform } from 'react-native'
import type { QueryClient } from '@tanstack/react-query'

const CACHE_FILE = `${FileSystem.documentDirectory}query_cache_v1.json`
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

let saveTimer: ReturnType<typeof setTimeout> | null = null

export async function restoreQueryCache(queryClient: QueryClient): Promise<void> {
  if (Platform.OS === 'web') return
  try {
    const info = await FileSystem.getInfoAsync(CACHE_FILE)
    if (!info.exists) return

    const raw = await FileSystem.readAsStringAsync(CACHE_FILE)
    const { savedAt, entries } = JSON.parse(raw) as {
      savedAt: number
      entries: Array<{ queryKey: unknown[]; data: unknown }>
    }

    if (Date.now() - savedAt > MAX_AGE_MS) return

    for (const entry of entries) {
      queryClient.setQueryData(entry.queryKey, entry.data)
    }
  } catch {
    // Corrupt or missing cache — ignore
  }
}

export function scheduleQueryCacheSave(queryClient: QueryClient): void {
  if (Platform.OS === 'web') return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveQueryCache(queryClient).catch(() => {})
  }, 3000)
}

async function saveQueryCache(queryClient: QueryClient): Promise<void> {
  try {
    const entries = queryClient
      .getQueryCache()
      .getAll()
      .filter((q) => q.state.status === 'success')
      .map((q) => ({ queryKey: q.queryKey, data: q.state.data }))

    await FileSystem.writeAsStringAsync(
      CACHE_FILE,
      JSON.stringify({ savedAt: Date.now(), entries }),
    )
  } catch {
    // Disk full or other error — ignore
  }
}
