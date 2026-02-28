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
  progress?: number | null
}

export function CourseCard({
  id, nome, imagem, preco, professor_nome, average_rating, horizontal, progress,
}: CourseCardProps) {
  const router = useRouter()

  if (horizontal) {
    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/course/[id]', params: { id } })}
        className="w-56 mr-3"
        activeOpacity={0.7}
      >
        <View className="bg-dark-surface rounded-2xl overflow-hidden" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
          <View className="relative">
            {imagem ? (
              <Image source={{ uri: imagem }} className="w-full h-32" resizeMode="cover" />
            ) : (
              <View className="w-full h-32 bg-dark-surfaceLight items-center justify-center">
                <Ionicons name="book-outline" size={28} color="#9ca3af" />
              </View>
            )}
            <View className="absolute bottom-2 right-2 bg-accent rounded-lg px-2.5 py-1">
              <Text className="text-xs font-bold text-white">
                {preco > 0 ? `R$ ${preco.toFixed(2)}` : t('courses.free')}
              </Text>
            </View>
          </View>
          <View className="p-3">
            <Text className="text-sm font-semibold text-darkText mb-1" numberOfLines={2}>{nome}</Text>
            {professor_nome && (
              <Text className="text-xs text-darkText-muted" numberOfLines={1}>{professor_nome}</Text>
            )}
            {average_rating != null && average_rating > 0 && (
              <View className="flex-row items-center mt-1.5">
                <Ionicons name="star" size={12} color="#f59e0b" />
                <Text className="text-xs text-darkText-secondary ml-1 font-medium">{average_rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  // List mode - horizontal card layout
  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/course/[id]', params: { id } })}
      className="mb-3 mx-4"
      activeOpacity={0.7}
    >
      <View
        className="bg-dark-surface rounded-2xl overflow-hidden flex-row"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}
      >
        <View className="relative">
          {imagem ? (
            <Image source={{ uri: imagem }} className="w-28 h-28" resizeMode="cover" />
          ) : (
            <View className="w-28 h-28 bg-dark-surfaceLight items-center justify-center">
              <Ionicons name="book-outline" size={28} color="#9ca3af" />
            </View>
          )}
        </View>
        <View className="flex-1 p-3.5 justify-between">
          <View>
            <Text className="text-sm font-bold text-darkText mb-1" numberOfLines={2}>{nome}</Text>
            {professor_nome && (
              <Text className="text-xs text-darkText-muted" numberOfLines={1}>{professor_nome}</Text>
            )}
          </View>
          {progress != null ? (
            <View className="mt-2">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs text-darkText-muted">{t('courses.progress') ?? 'Progresso'}</Text>
                <Text className="text-xs font-semibold text-primary-light">{Math.round(progress)}%</Text>
              </View>
              <View className="h-1.5 bg-dark-surfaceLight rounded-full overflow-hidden">
                <View className="h-full bg-primary rounded-full" style={{ width: `${Math.round(progress)}%` }} />
              </View>
            </View>
          ) : (
            <View className="flex-row items-center justify-between mt-2">
              {average_rating != null && average_rating > 0 ? (
                <View className="flex-row items-center">
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text className="text-xs text-darkText-secondary ml-1 font-medium">{average_rating.toFixed(1)}</Text>
                </View>
              ) : (
                <View />
              )}
              <View className="bg-accent rounded-lg px-2.5 py-1">
                <Text className="text-xs font-bold text-white">
                  {preco > 0 ? `R$ ${preco.toFixed(2)}` : t('courses.free')}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}
