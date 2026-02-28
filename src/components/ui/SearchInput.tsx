import { View, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { t } from '@/i18n'

interface SearchInputProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChangeText, placeholder }: SearchInputProps) {
  return (
    <View className="flex-row items-center bg-dark-surfaceLight rounded-2xl px-4 py-3 mx-4 mb-4">
      <Ionicons name="search" size={20} color="#9ca3af" />
      <TextInput
        className="flex-1 ml-3 text-base text-darkText"
        placeholder={placeholder ?? t('common.search')}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        returnKeyType="search"
      />
    </View>
  )
}
