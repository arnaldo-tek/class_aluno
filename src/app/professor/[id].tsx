import { View, Text, ScrollView, Image, TouchableOpacity, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useProfessorDetail, useProfessorCourses, useProfessorReviews } from '@/hooks/useProfessor'
import { useIsFollowing, useToggleFollow } from '@/hooks/useFavorites'
import { useStartChat } from '@/hooks/useChat'
import { CourseCard } from '@/components/CourseCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
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

  const socialLinks = [
    { key: 'instagram', icon: 'logo-instagram' as const, url: professor.instagram },
    { key: 'youtube', icon: 'logo-youtube' as const, url: professor.youtube },
    { key: 'facebook', icon: 'logo-facebook' as const, url: professor.facebook },
    { key: 'tiktok', icon: 'logo-tiktok' as const, url: professor.tiktok },
  ].filter((s) => !!s.url)

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <View className="relative">
          {professor.foto_capa ? (
            <Image source={{ uri: professor.foto_capa }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
          ) : (
            <View style={{ width: '100%', height: 160, backgroundColor: '#dbeafe' }} />
          )}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              position: 'absolute', top: 12, left: 12,
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.9)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#1a1a2e" />
          </TouchableOpacity>
        </View>

        {/* Avatar + Info */}
        <View className="items-center -mt-12 px-4">
          {professor.foto_perfil ? (
            <Image
              source={{ uri: professor.foto_perfil }}
              style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: '#f7f6f3' }}
            />
          ) : (
            <View style={{
              width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: '#f7f6f3',
              backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="person" size={36} color="#60a5fa" />
            </View>
          )}

          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginTop: 10, textAlign: 'center' }}>
            {professor.nome_professor}
          </Text>

          {/* Rating */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#4b5563', marginLeft: 4 }}>
              {(professor.average_rating ?? 0).toFixed(1)}
            </Text>
            {reviews && (
              <Text style={{ fontSize: 13, color: '#9ca3af', marginLeft: 4 }}>
                ({reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'})
              </Text>
            )}
          </View>

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
              {socialLinks.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => Linking.openURL(s.url!)}
                  style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: '#f0efec', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Ionicons name={s.icon} size={20} color="#6b7280" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, width: '100%', justifyContent: 'center' }}>
            <TouchableOpacity
              onPress={() => toggleFollow.mutate({ professorId: id!, isFollowing: !!isFollowing })}
              disabled={toggleFollow.isPending}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16,
                backgroundColor: isFollowing ? '#f0efec' : '#60a5fa',
              }}
            >
              <Ionicons
                name={isFollowing ? 'checkmark-circle' : 'person-add-outline'}
                size={16}
                color={isFollowing ? '#6b7280' : '#ffffff'}
              />
              <Text style={{
                fontSize: 14, fontWeight: '600',
                color: isFollowing ? '#6b7280' : '#ffffff',
              }}>
                {isFollowing ? 'Seguindo' : 'Seguir'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleChat}
              disabled={startChat.isPending}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16,
                borderWidth: 1, borderColor: '#60a5fa',
              }}
            >
              <Ionicons name="chatbubble-outline" size={16} color="#60a5fa" />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#60a5fa' }}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bio / Descrição */}
        {(professor.descricao || professor.biografia) && (
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <View style={{
              backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
              borderWidth: 1, borderColor: '#e5e4e1',
            }}>
              {professor.descricao && (
                <Text style={{ fontSize: 14, color: '#4b5563', lineHeight: 22 }}>
                  {professor.descricao}
                </Text>
              )}
              {professor.descricao && professor.biografia && (
                <View style={{ height: 1, backgroundColor: '#e5e4e1', marginVertical: 12 }} />
              )}
              {professor.biografia && (
                <>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                    Biografia
                  </Text>
                  <Text style={{ fontSize: 14, color: '#4b5563', lineHeight: 22 }}>
                    {professor.biografia}
                  </Text>
                </>
              )}
            </View>
          </View>
        )}

        {/* Cursos */}
        {courses && courses.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1a1a2e', paddingHorizontal: 16, marginBottom: 12 }}>
              {t('courses.title')} ({courses.length})
            </Text>
            <View style={{ paddingHorizontal: 16 }}>
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
          </View>
        )}

        {/* Avaliações */}
        {reviews && reviews.length > 0 && (
          <View style={{ marginTop: 24, paddingHorizontal: 16, paddingBottom: 32 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 }}>
              {t('courses.reviews')} ({reviews.length})
            </Text>
            {reviews.map((review: any) => (
              <View key={review.id} style={{
                backgroundColor: '#ffffff', borderRadius: 12, padding: 14,
                borderWidth: 1, borderColor: '#e5e4e1', marginBottom: 8,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a1a2e' }}>
                    {review.user?.display_name ?? 'Aluno'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < (review.rating ?? 0) ? 'star' : 'star-outline'}
                        size={12}
                        color="#f59e0b"
                      />
                    ))}
                  </View>
                </View>
                {review.comentario && (
                  <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 6, lineHeight: 20 }}>
                    {review.comentario}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  )
}
