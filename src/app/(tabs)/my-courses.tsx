import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { t } from '@/i18n'
import { useMyEnrollments } from '@/hooks/useEnrollments'
import { CourseCard } from '@/components/CourseCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColors } from '@/hooks/useThemeColors'

export default function MyCoursesScreen() {
  const router = useRouter()
  const colors = useThemeColors()
  const { data: enrollments, isLoading, refetch, isRefetching } = useMyEnrollments()

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center px-4 pt-4 pb-3 bg-dark-surface border-b border-darkBorder-subtle">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-darkText">{t('tabs.myCourses')}</Text>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : !enrollments?.length ? (
        <EmptyState
          title="Nenhum curso matriculado"
          description="Explore o catalogo e matricule-se em cursos."
          icon={<Ionicons name="school-outline" size={48} color={colors.textMuted} />}
        />
      ) : (
        <FlatList
          data={enrollments}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor="#2563eb"
              colors={['#2563eb']}
            />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const curso = item.curso as any
            if (!curso) return null
            const prog = (item as any).progress
            const percentage = prog?.total_lessons > 0
              ? (prog.completed_lessons / prog.total_lessons) * 100
              : null
            return (
              <CourseCard
                id={curso.id}
                nome={curso.nome}
                imagem={curso.imagem}
                preco={curso.preco ?? 0}
                professor_nome={curso.professor?.nome_professor}
                progress={percentage ?? 0}
              />
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}
