import { View, Text } from 'react-native'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-16 px-6">
      {icon && <View className="mb-4 opacity-40">{icon}</View>}
      <Text className="text-lg font-semibold text-gray-500 text-center">{title}</Text>
      {description && (
        <Text className="text-sm text-gray-400 text-center mt-2">{description}</Text>
      )}
    </View>
  )
}
