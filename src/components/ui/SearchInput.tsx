import { View, TextInput, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { t } from '@/i18n'
import { useThemeColors } from '@/hooks/useThemeColors'

interface SearchInputProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  className?: string
  style?: ViewStyle
}

export function SearchInput({ value, onChangeText, placeholder, className, style }: SearchInputProps) {
  const colors = useThemeColors()
  return (
    <View className={className ?? "flex-row items-center bg-dark-surfaceLight rounded-xl px-3 mx-4 mb-3"} style={style ?? { height: 36 }}>
      <Ionicons name="search" size={16} color={colors.textMuted} />
      <TextInput
        className="flex-1 ml-2 text-sm text-darkText"
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
