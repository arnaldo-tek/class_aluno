import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, Alert, Platform, FlatList, KeyboardAvoidingView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useState, useRef, useEffect } from 'react'
import { t } from '@/i18n'
import { useCourseDetail, useCourseModules, useCourseReviews } from '@/hooks/useCourses'
import { useIsEnrolled } from '@/hooks/useEnrollments'
import { useSubmitReview } from '@/hooks/useFavorites'
import { useStartChat, useChatMessages, useSendMessage } from '@/hooks/useChat'
import { useAuthContext } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { DownloadAllButton } from '@/components/DownloadAllButton'
import { useThemeColors } from '@/hooks/useThemeColors'

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'info' | 'modules' | 'reviews' | 'chat'>('info')
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState('')

  const colors = useThemeColors()
  const { user } = useAuthContext()
  const { data: course, isLoading } = useCourseDetail(id!)
  const { data: modules } = useCourseModules(id!)
  const { data: reviews } = useCourseReviews(id!)
  const { data: isEnrolled } = useIsEnrolled(id!)
  const submitReview = useSubmitReview()

  if (isLoading) return <LoadingSpinner />
  if (!course) return null

  const professor = course.professor as any
  const totalAulas = modules?.reduce((acc, m) => acc + ((m.aulas as any[])?.length ?? 0), 0) ?? 0

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header image */}
        <View className="relative">
          {course.imagem ? (
            <Image source={{ uri: course.imagem }} className="w-full h-56" resizeMode="cover" />
          ) : (
            <View className="w-full h-56 bg-dark-surfaceLight items-center justify-center">
              <Ionicons name="book-outline" size={48} color={colors.textMuted} />
            </View>
          )}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-3 left-3 w-10 h-10 rounded-full bg-black/50 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
        </View>

        {/* Course info */}
        <View className="px-4 pt-5">
          <Text className="text-xl font-bold text-darkText">{course.nome}</Text>

          {/* Professor */}
          {professor && (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/professor/[id]', params: { id: professor.id } })}
              className="flex-row items-center mt-3"
            >
              {professor.foto_perfil ? (
                <Image source={{ uri: professor.foto_perfil }} className="w-8 h-8 rounded-full" />
              ) : (
                <View className="w-8 h-8 rounded-full bg-primary-50 items-center justify-center">
                  <Ionicons name="person" size={14} color="#60a5fa" />
                </View>
              )}
              <Text className="text-sm text-primary-light font-medium ml-2">
                {professor.nome_professor}
              </Text>
            </TouchableOpacity>
          )}

          {/* Stats */}
          <View className="flex-row items-center mt-4 gap-5">
            <View className="flex-row items-center">
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text className="text-sm font-semibold text-accent-light ml-1">
                {(course.average_rating ?? 0).toFixed(1)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="layers-outline" size={16} color={colors.textSecondary} />
              <Text className="text-sm text-darkText-secondary ml-1">{modules?.length ?? 0} {t('courses.modules')}</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="play-circle-outline" size={16} color={colors.textSecondary} />
              <Text className="text-sm text-darkText-secondary ml-1">{totalAulas} {t('courses.lessons')}</Text>
            </View>
          </View>

          {/* Price + CTA */}
          <View className="flex-row items-center justify-between mt-5 pb-5 border-b border-darkBorder-subtle">
            <Text className="text-2xl font-bold text-accent">
              {(course.preco ?? 0) > 0 ? `R$ ${(course.preco ?? 0).toFixed(2)}` : t('courses.free')}
            </Text>
            {isEnrolled ? (
              <Badge variant="success">{t('courses.enrolled')}</Badge>
            ) : (
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/checkout/[id]', params: { id: id!, type: 'curso' } })}
                className="bg-accent rounded-2xl px-7 py-3.5"
              >
                <Text className="text-darkText-inverse font-bold">{t('courses.enroll')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Download all */}
          {Platform.OS !== 'web' && isEnrolled && modules && modules.length > 0 && (
            <View className="mt-4">
              <DownloadAllButton
                courseId={id!}
                courseTitle={course.nome ?? ''}
                lessons={
                  modules.flatMap((mod) =>
                    ((mod.aulas as any[]) ?? []).map((aula: any) => ({
                      lessonId: aula.id,
                      lessonTitle: aula.titulo ?? '',
                      videoUrl: aula.imagem_capa?.includes('.mp4') || aula.imagem_capa?.includes('video') ? aula.imagem_capa : undefined,
                      audioUrl: undefined,
                      pdfUrl: aula.pdf ?? undefined,
                    }))
                  )
                }
              />
            </View>
          )}
        </View>

        {/* Tabs */}
        <View className="flex-row border-b border-darkBorder-subtle px-4 mt-3">
          {([
            { key: 'info' as const, label: t('courses.description') },
            { key: 'modules' as const, label: t('courses.modules') },
            { key: 'reviews' as const, label: t('courses.reviews') },
            ...(isEnrolled ? [{ key: 'chat' as const, label: 'Chat' }] : []),
          ]).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`pb-3.5 mr-6 ${activeTab === tab.key ? 'border-b-2 border-accent' : ''}`}
            >
              <Text className={`text-sm font-semibold ${activeTab === tab.key ? 'text-accent' : 'text-darkText-muted'}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        <View className="px-4 pt-5 pb-8">
          {activeTab === 'info' && (
            <Text className="text-base text-darkText-secondary leading-7">
              {course.descricao || 'Sem descricao disponivel.'}
            </Text>
          )}

          {activeTab === 'modules' && (
            <View>
              {!modules?.length ? (
                <Text className="text-sm text-darkText-muted">Nenhum modulo disponivel.</Text>
              ) : (
                modules.map((mod, i) => (
                  <View key={mod.id} className="mb-5">
                    <Text className="text-sm font-bold text-darkText mb-2.5">
                      {i + 1}. {mod.nome}
                    </Text>
                    {((mod.aulas as any[]) ?? []).map((aula: any) => {
                      const canAccess = isEnrolled || aula.is_liberado || aula.is_degustacao
                      return (
                      <TouchableOpacity
                        key={aula.id}
                        onPress={() => canAccess && router.push({ pathname: '/lesson/[id]', params: { id: aula.id } })}
                        disabled={!canAccess}
                        className="flex-row items-center py-3 pl-4 border-l-2 border-darkBorder ml-2"
                      >
                        <View className={`w-8 h-8 rounded-full items-center justify-center ${canAccess ? 'bg-primary-50' : 'bg-dark-surfaceLight'}`}>
                          <Ionicons
                            name={canAccess ? 'play' : 'lock-closed'}
                            size={14}
                            color={canAccess ? '#3b82f6' : colors.textMuted}
                          />
                        </View>
                        <Text className={`text-sm ml-3 flex-1 ${canAccess ? 'text-darkText' : 'text-darkText-muted'}`}>{aula.titulo}</Text>
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
              {/* Review form */}
              {isEnrolled && user && (
                <View className="mb-6 pb-6 border-b border-darkBorder-subtle">
                  <Text className="text-sm font-bold text-darkText mb-3">Deixe sua avaliação</Text>
                  <View className="flex-row gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                        <Ionicons
                          name={star <= reviewRating ? 'star' : 'star-outline'}
                          size={28}
                          color="#fbbf24"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    className="bg-dark-surface border border-darkBorder-subtle rounded-2xl px-4 py-3 text-sm text-darkText min-h-[80px]"
                    placeholder="Escreva um comentário (opcional)"
                    placeholderTextColor={colors.textMuted}
                    value={reviewText}
                    onChangeText={setReviewText}
                    multiline
                    textAlignVertical="top"
                  />
                  <TouchableOpacity
                    onPress={async () => {
                      if (reviewRating === 0) {
                        Alert.alert('Avaliação', 'Selecione pelo menos 1 estrela.')
                        return
                      }
                      await submitReview.mutateAsync({
                        rating: reviewRating,
                        comentario: reviewText || undefined,
                        curso_id: id!,
                        professor_id: (course.professor as any)?.id,
                      })
                      setReviewRating(0)
                      setReviewText('')
                      Alert.alert('Obrigado!', 'Sua avaliação foi enviada.')
                    }}
                    disabled={submitReview.isPending || reviewRating === 0}
                    className={`mt-3 rounded-2xl py-3 items-center ${reviewRating > 0 ? 'bg-accent' : 'bg-dark-surfaceLight'}`}
                  >
                    <Text className={`font-bold text-sm ${reviewRating > 0 ? 'text-darkText-inverse' : 'text-darkText-muted'}`}>
                      {submitReview.isPending ? 'Enviando...' : 'Enviar avaliação'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {!reviews?.length ? (
                <Text className="text-sm text-darkText-muted">Nenhuma avaliação ainda.</Text>
              ) : (
                reviews.map((review: any) => (
                  <View key={review.id} className="mb-4 pb-4 border-b border-darkBorder-subtle">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-semibold text-darkText">
                        {review.user?.display_name ?? 'Aluno'}
                      </Text>
                      <View className="flex-row items-center">
                        <Ionicons name="star" size={12} color="#fbbf24" />
                        <Text className="text-xs text-accent-light ml-1 font-medium">{review.rating}</Text>
                      </View>
                    </View>
                    {review.comentario && (
                      <Text className="text-sm text-darkText-secondary mt-1.5">{review.comentario}</Text>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'chat' && isEnrolled && professor && (
            <CourseChatSection courseId={id!} professorUserId={professor.user_id} professorName={professor.nome_professor} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function CourseChatSection({ courseId, professorUserId, professorName }: {
  courseId: string; professorUserId: string; professorName: string
}) {
  const { user } = useAuthContext()
  const startChat = useStartChat()
  const [chatId, setChatId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !professorUserId) return
    startChat.mutateAsync(professorUserId).then((id) => {
      setChatId(id)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [professorUserId, user?.id])

  if (loading) return <LoadingSpinner />
  if (!chatId) return <Text className="text-sm text-darkText-muted">Não foi possível iniciar o chat.</Text>

  return <ChatMessages chatId={chatId} professorName={professorName} />
}

function ChatMessages({ chatId, professorName }: { chatId: string; professorName: string }) {
  const colors = useThemeColors()
  const { user } = useAuthContext()
  const { data: messages } = useChatMessages(chatId)
  const sendMessage = useSendMessage()
  const [text, setText] = useState('')
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    if (messages?.length) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages?.length])

  return (
    <View style={{ height: 400 }}>
      <FlatList
        ref={flatListRef}
        data={messages ?? []}
        keyExtractor={(item) => item.id}
        className="flex-1"
        contentContainerStyle={{ padding: 8 }}
        renderItem={({ item }) => {
          const isMe = item.user_id === user?.id
          return (
            <View className={`mb-2 max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}>
              <View className={`px-3.5 py-2.5 rounded-2xl ${isMe ? 'bg-primary' : 'bg-dark-surfaceLight'}`}>
                <Text className={`text-sm ${isMe ? 'text-white' : 'text-darkText'}`}>{item.text}</Text>
              </View>
            </View>
          )
        }}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Ionicons name="chatbubble-ellipses-outline" size={40} color={colors.textMuted} />
            <Text className="text-sm text-darkText-muted mt-2">Inicie uma conversa com {professorName}</Text>
          </View>
        }
      />
      <View className="flex-row items-center bg-dark-surfaceLight rounded-2xl px-3 py-2 mt-2">
        <TextInput
          className="flex-1 text-sm text-darkText"
          placeholder="Digite sua mensagem..."
          placeholderTextColor={colors.textSecondary}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity
          onPress={async () => {
            if (!text.trim()) return
            const msg = text.trim()
            setText('')
            await sendMessage.mutateAsync({ chatId, text: msg })
          }}
          disabled={!text.trim() || sendMessage.isPending}
          className="ml-2 p-2"
        >
          <Ionicons name="send" size={20} color={text.trim() ? '#3b82f6' : colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  )
}
