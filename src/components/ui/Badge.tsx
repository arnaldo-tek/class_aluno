import { Text, View } from 'react-native'

const variants = {
  default: 'bg-gray-100',
  primary: 'bg-blue-100',
  success: 'bg-green-100',
  warning: 'bg-yellow-100',
} as const

const textVariants = {
  default: 'text-gray-700',
  primary: 'text-blue-700',
  success: 'text-green-700',
  warning: 'text-yellow-700',
} as const

interface BadgeProps {
  children: string
  variant?: keyof typeof variants
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <View className={`px-2 py-0.5 rounded-full ${variants[variant]}`}>
      <Text className={`text-xs font-medium ${textVariants[variant]}`}>{children}</Text>
    </View>
  )
}
