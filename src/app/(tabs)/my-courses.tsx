import { View, Text, FlatList, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { t } from '@/i18n'
import { useMyEnrollments } from '@/hooks/useEnrollments'
import { CourseCard } from '@/components/CourseCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Ionicons } from '@expo/vector-icons'

export default function MyCoursesScreen() {
  const { data: enrollments, isLoading, refetch, isRefetching } = useMyEnrollments()

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-4">
        <Text className="text-2xl font-bold text-gray-900">{t('tabs.myCourses')}</Text>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : !enrollments?.length ? (
        <EmptyState
          title="Nenhum curso matriculado"
          description="Explore o catálogo e matricule-se em cursos."
          icon={<Ionicons name="school-outline" size={48} color="#9ca3af" />}
        />
      ) : (
        <FlatList
          data={enrollments}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const curso = item.curso as any
            if (!curso) return null
            return (
              <CourseCard
                id={curso.id}
                nome={curso.nome}
                imagem={curso.imagem}
                preco={curso.preco ?? 0}
                professor_nome={curso.professor?.nome_professor}
              />
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}
