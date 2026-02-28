import { useEffect, useState } from 'react'
import { Redirect } from 'expo-router'
import { useAuthContext } from '@/contexts/AuthContext'
import { View, ActivityIndicator, Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

async function getOnboardingDone(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('onboarding_done') === 'true'
    }
    const value = await SecureStore.getItemAsync('onboarding_done')
    return value === 'true'
  } catch {
    return false
  }
}

export default function Index() {
  const { user, isLoading } = useAuthContext()
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null)

  useEffect(() => {
    getOnboardingDone().then(setOnboardingDone)
  }, [])

  if (isLoading || onboardingDone === null) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  if (!onboardingDone) {
    return <Redirect href="/onboarding" />
  }

  if (user) {
    return <Redirect href="/(tabs)/home" />
  }

  return <Redirect href="/(auth)/login" />
}
