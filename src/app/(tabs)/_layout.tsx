import { Redirect, Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthContext } from '@/contexts/AuthContext'
import { useSessionGuard } from '@/hooks/useSessionGuard'
import { View, ActivityIndicator, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { t } from '@/i18n'
import { useThemeColors } from '@/hooks/useThemeColors'
import { OfflineBanner } from '@/components/OfflineBanner'

export default function TabsLayout() {
  const { user, isLoading } = useAuthContext()
  const colors = useThemeColors()
  const insets = useSafeAreaInsets()
  useSessionGuard()

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-bg">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#fef200',
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.tabBarBg,
            borderTopWidth: 0,
            paddingBottom: Platform.OS === 'ios' ? 24 : 16,
            paddingTop: 8,
            height: Platform.OS === 'ios' ? 90 : 72,
            marginHorizontal: 16,
            marginBottom: Platform.OS === 'ios' ? 8 : Math.max(insets.bottom, 12) + 16,
            borderRadius: 24,
            position: 'absolute',
            shadowColor: colors.tabBarShadow,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 10,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.2,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: t('tabs.home'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="courses"
          options={{
            title: 'Catálogo',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'book' : 'book-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="packages"
          options={{
            title: 'Assinaturas',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'card' : 'card-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="professors"
          options={{
            title: 'Professores',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'school' : 'school-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'Mais opções',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
            ),
          }}
        />
        {/* Hidden tabs - keep routes but hide from tab bar */}
        <Tabs.Screen name="my-courses" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>
    </View>
  )
}
