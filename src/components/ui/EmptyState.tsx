import { View, Text } from 'react-native'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-20 px-8">
      {icon && <View className="mb-5 opacity-50">{icon}</View>}
      <Text className="text-lg font-semibold text-darkText-secondary text-center">{title}</Text>
      {description && (
        <Text className="text-sm text-darkText-muted text-center mt-2 leading-5">{description}</Text>
      )}
    </View>
  )
}
