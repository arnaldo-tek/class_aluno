import { useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av'
import { Asset } from 'expo-asset'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { initSentry } from '@/lib/sentry'
import { clearFailedDownloads } from '@/lib/offlineDb'
import { restoreQueryCache, scheduleQueryCacheSave } from '@/lib/queryPersist'
import { Image } from 'expo-image'
import { cssInterop } from 'nativewind'
import '../../global.css'

// Enable NativeWind className support for expo-image
cssInterop(Image, { className: 'style' })

SplashScreen.preventAutoHideAsync()
initSentry()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24, // 24h — keeps data while offline
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
})

queryClient.getQueryCache().subscribe(() => {
  scheduleQueryCacheSave(queryClient)
})

const VIDEO_DURATION_MS = 3500 // video is 3.4s, +100ms buffer
const splashVideoAsset = Asset.fromModule(require('../../assets/splash-video.mp4'))

function AppContent() {
  const { isDark } = useTheme()
  const [cacheReady, setCacheReady] = useState(false)
  const [videoUri, setVideoUri] = useState<string | null>(null)
  const [videoFinished, setVideoFinished] = useState(false)
  const videoRef = useRef<Video>(null)
  const finishedRef = useRef(false)

  const markFinished = () => {
    if (finishedRef.current) return
    finishedRef.current = true
    setVideoFinished(true)
  }

  useEffect(() => {
    SplashScreen.hideAsync()

    // Preload video asset to get a local URI, then start fallback timer
    splashVideoAsset.downloadAsync().then(() => {
      setVideoUri(splashVideoAsset.localUri ?? splashVideoAsset.uri)
    }).catch(() => markFinished())

    // Fallback: advance after video duration even if callbacks don't fire
    const timer = setTimeout(markFinished, VIDEO_DURATION_MS)

    Promise.all([
      restoreQueryCache(queryClient).catch(() => {}),
      clearFailedDownloads().catch(() => {}),
    ]).finally(() => setCacheReady(true))

    return () => clearTimeout(timer)
  }, [])

  const showApp = cacheReady && videoFinished

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Splash video — shown while cache loads and video plays */}
      {!showApp && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]}>
          {videoUri && (
            <Video
              ref={videoRef}
              source={{ uri: videoUri }}
              style={StyleSheet.absoluteFill}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isMuted
              onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                if (status.isLoaded && status.didJustFinish) markFinished()
              }}
              onError={markFinished}
            />
          )}
        </View>
      )}

      {/* App only mounts after video ends + cache is restored */}
      {showApp && <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="course/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="professor/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="checkout/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="checkout/card" options={{ presentation: 'card' }} />
          <Stack.Screen name="checkout/pix" options={{ presentation: 'card' }} />
          <Stack.Screen name="checkout/success" options={{ presentation: 'card', gestureEnabled: false }} />
          <Stack.Screen name="checkout/failed" options={{ presentation: 'card', gestureEnabled: false }} />
          <Stack.Screen name="purchases/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="lesson/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="lesson/quiz" options={{ presentation: 'card' }} />
          <Stack.Screen name="flashcards/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="flashcards/blocks" options={{ presentation: 'card' }} />
          <Stack.Screen name="flashcards/cards" options={{ presentation: 'card' }} />
          <Stack.Screen name="flashcards/study" options={{ presentation: 'card', gestureEnabled: false }} />
          <Stack.Screen name="favorites/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="chat/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="notifications/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="support/index" options={{ presentation: 'card' }} />
          {/* Profile */}
          <Stack.Screen name="profile/edit" options={{ presentation: 'card' }} />
          <Stack.Screen name="profile/change-password" options={{ presentation: 'card' }} />
          {/* Packages */}
          <Stack.Screen name="packages/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="packages/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="packages/my" options={{ presentation: 'card' }} />
          {/* News */}
          <Stack.Screen name="news/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="news/[id]" options={{ presentation: 'card' }} />
          {/* Notices */}
          <Stack.Screen name="notices/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="notices/[id]" options={{ presentation: 'card' }} />
          {/* Audio */}
          <Stack.Screen name="audio/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="audio/folders/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="audio/laws/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="audio/player/[id]" options={{ presentation: 'card' }} />
          {/* Professors */}
          <Stack.Screen name="all-professors" options={{ presentation: 'card' }} />
          {/* Refund */}
          <Stack.Screen name="refund/[id]" options={{ presentation: 'card' }} />
          {/* Downloads */}
          <Stack.Screen name="downloads" options={{ presentation: 'card' }} />
          {/* Simple screens */}
          <Stack.Screen name="terms" options={{ presentation: 'card' }} />
          <Stack.Screen name="faq" options={{ presentation: 'card' }} />
          <Stack.Screen name="settings" options={{ presentation: 'card' }} />
          <Stack.Screen name="suggestion" options={{ presentation: 'card' }} />
          {/* Community */}
          <Stack.Screen name="community/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="community/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="community/rules/[id]" options={{ presentation: 'card' }} />
          {/* Student area */}
          <Stack.Screen name="student-area" options={{ presentation: 'card' }} />
          {/* Onboarding */}
          <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        </Stack>}
    </>
  )
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  )
}
