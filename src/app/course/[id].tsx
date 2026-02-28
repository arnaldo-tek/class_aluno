import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { t } from '@/i18n'
import { useCourseDetail, useCourseModules, useCourseReviews } from '@/hooks/useCourses'
import { useIsEnrolled } from '@/hooks/useEnrollments'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'info' | 'modules' | 'reviews'>('info')

  const { data: course, isLoading } = useCourseDetail(id!)
  const { data: modules } = useCourseModules(id!)
  const { data: reviews } = useCourseReviews(id!)
  const { data: isEnrolled } = useIsEnrolled(id!)

  if (isLoading) return <LoadingSpinner />
  if (!course) return null

  const professor = course.professor as any
  const totalAulas = modules?.reduce((acc, m) => acc + ((m.aulas as any[])?.length ?? 0), 0) ?? 0

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header image */}
        <View className="relative">
          {course.imagem ? (
            <Image source={{ uri: course.imagem }} className="w-full h-52" resizeMode="cover" />
          ) : (
            <View className="w-full h-52 bg-gray-200 items-center justify-center">
              <Ionicons name="book-outline" size={48} color="#9ca3af" />
            </View>
          )}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-3 left-3 w-10 h-10 rounded-full bg-black/40 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
        </View>

        {/* Course info */}
        <View className="px-4 pt-4">
          <Text className="text-xl font-bold text-gray-900">{course.nome}</Text>

          {/* Professor */}
          {professor && (
            <TouchableOpacity
              onPress={() => router.push(`/professor/${professor.id}`)}
              className="flex-row items-center mt-2"
            >
              {professor.foto_perfil ? (
                <Image source={{ uri: professor.foto_perfil }} className="w-8 h-8 rounded-full" />
              ) : (
                <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center">
                  <Ionicons name="person" size={14} color="#2563eb" />
                </View>
              )}
              <Text className="text-sm text-blue-600 font-medium ml-2">
                {professor.nome_professor}
              </Text>
            </TouchableOpacity>
          )}

          {/* Stats */}
          <View className="flex-row items-center mt-3 gap-4">
            <View className="flex-row items-center">
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text className="text-sm font-medium text-gray-700 ml-1">
                {(course.average_rating ?? 0).toFixed(1)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="layers-outline" size={16} color="#6b7280" />
              <Text className="text-sm text-gray-600 ml-1">{modules?.length ?? 0} {t('courses.modules')}</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="play-circle-outline" size={16} color="#6b7280" />
              <Text className="text-sm text-gray-600 ml-1">{totalAulas} {t('courses.lessons')}</Text>
            </View>
          </View>

          {/* Price + CTA */}
          <View className="flex-row items-center justify-between mt-4 pb-4 border-b border-gray-100">
            <Text className="text-2xl font-bold text-blue-600">
              {(course.preco ?? 0) > 0 ? `R$ ${(course.preco ?? 0).toFixed(2)}` : t('courses.free')}
            </Text>
            {isEnrolled ? (
              <Badge variant="success">{t('courses.enrolled')}</Badge>
            ) : (
              <TouchableOpacity
                onPress={() => router.push({ pathname: `/checkout/${id}`, params: { type: 'curso' } })}
                className="bg-blue-600 rounded-xl px-6 py-3"
              >
                <Text className="text-white font-semibold">{t('courses.enroll')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row border-b border-gray-100 px-4 mt-2">
          {(['info', 'modules', 'reviews'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`pb-3 mr-6 ${activeTab === tab ? 'border-b-2 border-blue-600' : ''}`}
            >
              <Text className={`text-sm font-medium ${activeTab === tab ? 'text-blue-600' : 'text-gray-500'}`}>
                {tab === 'info' ? t('courses.description') : tab === 'modules' ? t('courses.modules') : t('courses.reviews')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        <View className="px-4 pt-4 pb-8">
          {activeTab === 'info' && (
            <Text className="text-sm text-gray-700 leading-6">
              {course.descricao || 'Sem descrição disponível.'}
            </Text>
          )}

          {activeTab === 'modules' && (
            <View>
              {!modules?.length ? (
                <Text className="text-sm text-gray-400">Nenhum módulo disponível.</Text>
              ) : (
                modules.map((mod, i) => (
                  <View key={mod.id} className="mb-4">
                    <Text className="text-sm font-semibold text-gray-900 mb-2">
                      {i + 1}. {mod.nome}
                    </Text>
                    {((mod.aulas as any[]) ?? []).map((aula: any, j: number) => {
                      const canAccess = isEnrolled || aula.is_liberado || aula.is_degustacao
                      return (
                      <TouchableOpacity
                        key={aula.id}
                        onPress={() => canAccess && router.push(`/lesson/${aula.id}`)}
                        disabled={!canAccess}
                        className="flex-row items-center py-2 pl-4 border-l-2 border-gray-200 ml-2"
                      >
                        <Ionicons
                          name={canAccess ? 'play-circle-outline' : 'lock-closed-outline'}
                          size={16}
                          color={aula.is_liberado || aula.is_degustacao ? '#2563eb' : '#9ca3af'}
                        />
                        <Text className="text-sm text-gray-700 ml-2 flex-1">{aula.titulo}</Text>
                        {aula.is_degustacao && <Badge variant="primary">Free</Badge>}
                      </TouchableOpacity>
                      )
                    })}
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'reviews' && (
            <View>
              {!reviews?.length ? (
                <Text className="text-sm text-gray-400">Nenhuma avaliação ainda.</Text>
              ) : (
                reviews.map((review: any) => (
                  <View key={review.id} className="mb-4 pb-4 border-b border-gray-50">
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
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
