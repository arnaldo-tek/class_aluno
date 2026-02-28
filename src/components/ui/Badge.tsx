import { Text, View } from 'react-native'

const variants = {
  default: 'bg-dark-surfaceLight',
  primary: 'bg-primary-50',
  success: 'bg-success-dark',
  warning: 'bg-warning-dark',
} as const

const textVariants = {
  default: 'text-darkText-secondary',
  primary: 'text-primary-light',
  success: 'text-success',
  warning: 'text-warning',
} as const

interface BadgeProps {
  children: string
  variant?: keyof typeof variants
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <View className={`px-2.5 py-1 rounded-full ${variants[variant]}`}>
      <Text className={`text-xs font-semibold ${textVariants[variant]}`}>{children}</Text>
    </View>
  )
}
