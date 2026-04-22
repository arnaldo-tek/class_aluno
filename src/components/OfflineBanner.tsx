import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useIsOnline } from '@/hooks/useIsOnline'

export function OfflineBanner() {
  const isOnline = useIsOnline()
  if (isOnline) return null

  return (
    <View className="bg-amber-600 flex-row items-center justify-center px-4 py-2 gap-2">
      <Ionicons name="cloud-offline-outline" size={16} color="white" />
      <Text className="text-white text-xs font-semibold">
        Modo offline — exibindo conteúdo baixado
      </Text>
    </View>
  )
}
