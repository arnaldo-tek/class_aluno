import { View, Text, TouchableOpacity } from 'react-native'
import { t } from '@/i18n'

interface SectionHeaderProps {
  title: string
  onSeeAll?: () => void
}

export function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 mb-3">
      <Text className="text-lg font-bold text-gray-900">{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text className="text-sm font-medium text-blue-600">{t('common.seeAll')}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
