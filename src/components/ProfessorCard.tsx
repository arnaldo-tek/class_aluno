import { View, Text, Image, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

interface ProfessorCardProps {
  id: string
  nome: string
  foto?: string | null
  average_rating?: number | null
}

export function ProfessorCard({ id, nome, foto, average_rating }: ProfessorCardProps) {
  const router = useRouter()

  return (
    <TouchableOpacity
      onPress={() => router.push(`/professor/${id}`)}
      className="items-center mr-4 w-20"
      activeOpacity={0.7}
    >
      {foto ? (
        <Image source={{ uri: foto }} className="w-16 h-16 rounded-full" />
      ) : (
        <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center">
          <Ionicons name="person" size={24} color="#2563eb" />
        </View>
      )}
      <Text className="text-xs font-medium text-gray-900 text-center mt-2" numberOfLines={2}>
        {nome}
      </Text>
      {average_rating != null && average_rating > 0 && (
        <View className="flex-row items-center mt-0.5">
          <Ionicons name="star" size={10} color="#f59e0b" />
          <Text className="text-[10px] text-gray-500 ml-0.5">{average_rating.toFixed(1)}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}
