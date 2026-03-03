import { View, Text, TouchableOpacity, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { t } from '@/i18n'
import { useTheme } from '@/contexts/ThemeContext'
import { useThemeColors } from '@/hooks/useThemeColors'

export default function SettingsScreen() {
  const router = useRouter()
  const { isDark, toggleTheme } = useTheme()
  const colors = useThemeColors()

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder bg-dark-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-base font-bold text-darkText flex-1">{t('settings.title')}</Text>
      </View>

      <View className="px-4 pt-4">
        {/* Dark mode toggle */}
        <View className="bg-dark-surfaceLight rounded-2xl overflow-hidden">
          <View className="flex-row items-center px-4 py-3.5">
            <Ionicons name={isDark ? 'moon' : 'moon-outline'} size={20} color={colors.textSecondary} />
            <Text className="flex-1 text-base text-darkText ml-3">Modo escuro</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#374151', true: '#3b82f6' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Change password */}
        <TouchableOpacity
          onPress={() => router.push('/profile/change-password')}
          className="flex-row items-center bg-dark-surfaceLight rounded-2xl px-4 py-3.5 mt-4"
        >
          <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
          <Text className="flex-1 text-base text-darkText ml-3">{t('profile.changePassword')}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
