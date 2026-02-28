import { View, Text, ScrollView, Image, TouchableOpacity, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useProfessorDetail, useProfessorCourses, useProfessorReviews } from '@/hooks/useProfessor'
import { useIsFollowing, useToggleFollow } from '@/hooks/useFavorites'
import { useStartChat } from '@/hooks/useChat'
import { CourseCard } from '@/components/CourseCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { t } from '@/i18n'

export default function ProfessorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const { data: professor, isLoading } = useProfessorDetail(id!)
  const { data: courses } = useProfessorCourses(id!)
  const { data: reviews } = useProfessorReviews(id!)
  const { data: isFollowing } = useIsFollowing(id!)
  const toggleFollow = useToggleFollow()
  const startChat = useStartChat()

  async function handleChat() {
    if (!professor) return
    try {
      const chatId = await startChat.mutateAsync(professor.user_id)
      router.push({ pathname: '/chat/[id]', params: { id: chatId, name: professor.nome_professor, photo: professor.foto_perfil ?? '' } })
    } catch {}
  }

  if (isLoading) return <LoadingSpinner />
  if (!professor) return null

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <View className="relative">
          {professor.foto_capa ? (
            <Image source={{ uri: professor.foto_capa }} className="w-full h-40" resizeMode="cover" />
          ) : (
            <View className="w-full h-40 bg-blue-50" />
          )}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-3 left-3 w-10 h-10 rounded-full bg-black/40 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
        </View>

        {/* Avatar + Name */}
        <View className="items-center -mt-12 px-4">
          {professor.foto_perfil ? (
            <Image source={{ uri: professor.foto_perfil }} className="w-24 h-24 rounded-full border-4 border-white" />
          ) : (
            <View className="w-24 h-24 rounded-full border-4 border-white bg-blue-100 items-center justify-center">
              <Ionicons name="person" size={36} color="#2563eb" />
            </View>
          )}
          <Text className="text-xl font-bold text-gray-900 mt-2">{professor.nome_professor}</Text>

          {/* Rating */}
          <View className="flex-row items-center mt-1">
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text className="text-sm font-medium text-gray-700 ml-1">
              {(professor.average_rating ?? 0).toFixed(1)}
            </Text>
            {reviews && (
              <Text className="text-sm text-gray-400 ml-1">({reviews.length} {t('courses.reviews').toLowerCase()})</Text>
            )}
          </View>

          {/* Social links */}
          <View className="flex-row gap-4 mt-3">
            {professor.instagram && (
              <Ionicons name="logo-instagram" size={22} color="#6b7280" />
            )}
            {professor.youtube && (
              <Ionicons name="logo-youtube" size={22} color="#6b7280" />
            )}
            {professor.facebook && (
              <Ionicons name="logo-facebook" size={22} color="#6b7280" />
            )}
            {professor.tiktok && (
              <Ionicons name="logo-tiktok" size={22} color="#6b7280" />
            )}
          </View>

          {/* Follow + Chat buttons */}
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              onPress={() => toggleFollow.mutate({ professorId: id!, isFollowing: !!isFollowing })}
              className={`px-6 py-2.5 rounded-full ${isFollowing ? 'bg-gray-200' : 'bg-blue-600'}`}
              disabled={toggleFollow.isPending}
            >
              <Text className={`text-sm font-semibold ${isFollowing ? 'text-gray-700' : 'text-white'}`}>
                {isFollowing ? 'Seguindo' : 'Seguir'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleChat}
              className="px-5 py-2.5 rounded-full border border-blue-600"
              disabled={startChat.isPending}
            >
              <Ionicons name="chatbubble-outline" size={16} color="#2563eb" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bio */}
        {professor.descricao && (
          <View className="px-4 mt-4">
            <Text className="text-sm text-gray-700 leading-6">{professor.descricao}</Text>
          </View>
        )}

        {professor.biografia && (
          <View className="px-4 mt-3">
            <Text className="text-xs font-semibold text-gray-500 uppercase mb-1">Biografia</Text>
            <Text className="text-sm text-gray-600 leading-5">{professor.biografia}</Text>
          </View>
        )}

        {/* Courses */}
        {courses && courses.length > 0 && (
          <View className="mt-6">
            <SectionHeader title={`${t('courses.title')} (${courses.length})`} />
            {courses.map((c) => (
              <CourseCard
                key={c.id}
                id={c.id}
                nome={c.nome}
                imagem={c.imagem}
                preco={c.preco ?? 0}
                average_rating={c.average_rating}
              />
            ))}
          </View>
        )}

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <View className="mt-4 px-4 pb-8">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              {t('courses.reviews')} ({reviews.length})
            </Text>
            {reviews.map((review: any) => (
              <View key={review.id} className="mb-3 pb-3 border-b border-gray-50">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-gray-900">
                    {review.user?.display_name ?? 'Aluno'}
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="star" size={12} color="#f59e0b" />
                    <Text className="text-xs text-gray-600 ml-1">{review.rating}</Text>
                  </View>
                </View>
                {review.comentario && (
                  <Text className="text-sm text-gray-600 mt-1">{review.comentario}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  )
}
