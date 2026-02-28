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
      onPress={() => router.push({ pathname: '/professor/[id]', params: { id } })}
      className="items-center mr-4 w-20"
      activeOpacity={0.7}
    >
      {foto ? (
        <View className="rounded-full border-2 border-accent/30">
          <Image source={{ uri: foto }} className="w-16 h-16 rounded-full" />
        </View>
      ) : (
        <View className="w-16 h-16 rounded-full bg-primary-50 items-center justify-center border-2 border-accent/30">
          <Ionicons name="person" size={24} color="#60a5fa" />
        </View>
      )}
      <Text className="text-xs font-medium text-darkText text-center mt-2" numberOfLines={2}>
        {nome}
      </Text>
      {average_rating != null && average_rating > 0 && (
        <View className="flex-row items-center mt-0.5">
          <Ionicons name="star" size={10} color="#fbbf24" />
          <Text className="text-[10px] text-accent-light ml-0.5 font-medium">{average_rating.toFixed(1)}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}
