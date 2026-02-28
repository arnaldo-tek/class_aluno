import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import i18n, { t } from '@/i18n'

const LANGUAGES = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'ru', label: 'Русский' },
]

export default function SettingsScreen() {
  const router = useRouter()
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.locale)

  useEffect(() => {
    try {
      if (Platform.OS === 'web') {
        const lang = localStorage.getItem('app_language')
        if (lang) setSelectedLanguage(lang)
      } else {
        SecureStore.getItemAsync('app_language').then((lang) => {
          if (lang) setSelectedLanguage(lang)
        })
      }
    } catch {}
  }, [])

  async function handleLanguageChange(code: string) {
    setSelectedLanguage(code)
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('app_language', code)
      } else {
        await SecureStore.setItemAsync('app_language', code)
      }
    } catch {}
    i18n.locale = code
    Alert.alert('', t('settings.restartRequired'))
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900 flex-1">{t('settings.title')}</Text>
      </View>

      <View className="px-4 pt-4">
        {/* Language selector */}
        <Text className="text-sm font-semibold text-gray-900 mb-3">{t('settings.language')}</Text>
        <View className="bg-white rounded-2xl overflow-hidden">
          {LANGUAGES.map((lang, i) => (
            <TouchableOpacity
              key={lang.code}
              onPress={() => handleLanguageChange(lang.code)}
              className={`flex-row items-center px-4 py-3.5 ${
                i < LANGUAGES.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <Text className="flex-1 text-base text-gray-900">{lang.label}</Text>
              {selectedLanguage === lang.code && (
                <Ionicons name="checkmark-circle" size={22} color="#2563eb" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Change password */}
        <TouchableOpacity
          onPress={() => router.push('/profile/change-password')}
          className="flex-row items-center bg-white rounded-2xl px-4 py-3.5 mt-4"
        >
          <Ionicons name="lock-closed-outline" size={20} color="#6b7280" />
          <Text className="flex-1 text-base text-gray-900 ml-3">{t('profile.changePassword')}</Text>
          <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
