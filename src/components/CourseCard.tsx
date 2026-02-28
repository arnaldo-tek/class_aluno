import { View, Text, Image, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { t } from '@/i18n'

interface CourseCardProps {
  id: string
  nome: string
  imagem?: string | null
  preco: number
  professor_nome?: string | null
  average_rating?: number | null
  horizontal?: boolean
}

export function CourseCard({
  id, nome, imagem, preco, professor_nome, average_rating, horizontal,
}: CourseCardProps) {
  const router = useRouter()

  return (
    <TouchableOpacity
      onPress={() => router.push(`/course/${id}`)}
      className={horizontal ? 'w-56 mr-3' : 'mb-3 mx-4'}
      activeOpacity={0.7}
    >
      <View className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
        {imagem ? (
          <Image source={{ uri: imagem }} className="w-full h-32" resizeMode="cover" />
        ) : (
          <View className="w-full h-32 bg-gray-200 items-center justify-center">
            <Ionicons name="book-outline" size={32} color="#9ca3af" />
          </View>
        )}
        <View className="p-3">
          <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={2}>
            {nome}
          </Text>
          {professor_nome && (
            <Text className="text-xs text-gray-500 mb-1" numberOfLines={1}>
              {professor_nome}
            </Text>
          )}
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-blue-600">
              {preco > 0 ? `R$ ${preco.toFixed(2)}` : t('courses.free')}
            </Text>
            {average_rating != null && average_rating > 0 && (
              <View className="flex-row items-center">
                <Ionicons name="star" size={12} color="#f59e0b" />
                <Text className="text-xs text-gray-600 ml-1">{average_rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}
