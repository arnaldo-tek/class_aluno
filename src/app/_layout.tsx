import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { initSentry } from '@/lib/sentry'
import '../../global.css'

SplashScreen.preventAutoHideAsync()
initSentry()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
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
          <Stack.Screen name="chat/index" options={{ presentation: 'card' }} />
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
          <Stack.Screen name="professors/index" options={{ presentation: 'card' }} />
          {/* Refund */}
          <Stack.Screen name="refund/[id]" options={{ presentation: 'card' }} />
          {/* Simple screens */}
          <Stack.Screen name="terms" options={{ presentation: 'card' }} />
          <Stack.Screen name="faq" options={{ presentation: 'card' }} />
          <Stack.Screen name="settings" options={{ presentation: 'card' }} />
          <Stack.Screen name="suggestion" options={{ presentation: 'card' }} />
          {/* Community */}
          <Stack.Screen name="community/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="community/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="community/rules/[id]" options={{ presentation: 'card' }} />
          {/* Onboarding */}
          <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  )
}
