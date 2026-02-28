import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { usePackageDetail, useHasPackageAccess } from '@/hooks/usePackages'
import { CourseCard } from '@/components/CourseCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { t } from '@/i18n'

export default function PackageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: pkg, isLoading } = usePackageDetail(id!)
  const { data: hasAccess } = useHasPackageAccess(id!)

  if (isLoading) return <LoadingSpinner />
  if (!pkg) return null

  const courses = (pkg as any).pacote_cursos ?? []

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900 flex-1" numberOfLines={1}>
          {pkg.nome}
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero image */}
        {pkg.imagem ? (
          <Image source={{ uri: pkg.imagem }} className="w-full h-48" resizeMode="cover" />
        ) : (
          <View className="w-full h-48 bg-blue-50 items-center justify-center">
            <Ionicons name="cube-outline" size={48} color="#2563eb" />
          </View>
        )}

        <View className="px-4 pt-4">
          <Text className="text-xl font-bold text-gray-900">{pkg.nome}</Text>

          {pkg.descricao && (
            <Text className="text-sm text-gray-600 leading-6 mt-2">{pkg.descricao}</Text>
          )}

          <View className="flex-row items-center mt-4">
            <Text className="text-2xl font-bold text-blue-600">
              R$ {((pkg.preco ?? 0) / 100).toFixed(2)}
            </Text>
            <Text className="text-sm text-gray-400 ml-1">{t('packages.perMonth')}</Text>
          </View>

          {/* Courses list */}
          <Text className="text-lg font-bold text-gray-900 mt-6 mb-3">
            {t('packages.includes')} ({courses.length})
          </Text>

          {courses.map((pc: any) => {
            const course = pc.cursos
            if (!course) return null
            return (
              <CourseCard
                key={pc.curso_id}
                id={course.id}
                nome={course.nome}
                imagem={course.imagem}
                preco={course.preco ?? 0}
                professor_nome={course.professor?.nome_professor}
              />
            )
          })}
        </View>
      </ScrollView>

      {/* Bottom action */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 pb-8">
        {hasAccess ? (
          <Badge variant="success">{t('packages.subscribed')}</Badge>
        ) : (
          <TouchableOpacity
            onPress={() => router.push(`/checkout/${id}?type=pacote`)}
            className="bg-blue-600 rounded-xl py-4 items-center"
          >
            <Text className="text-white font-bold text-base">{t('packages.subscribe')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}
