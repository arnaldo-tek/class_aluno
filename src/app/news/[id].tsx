import { View, Text, ScrollView, TouchableOpacity, Image, Share } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { WebView } from 'react-native-webview'
import { useNewsDetail, useIsFavorite, useToggleNewsFavorite } from '@/hooks/useNews'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { t } from '@/i18n'

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: news, isLoading } = useNewsDetail(id!)
  const { data: isFavorite } = useIsFavorite('noticia', id!)
  const toggleFavorite = useToggleNewsFavorite()

  if (isLoading) return <LoadingSpinner />
  if (!news) return null

  function handleShare() {
    Share.share({ message: `${news!.titulo}\n\n${news!.descricao ?? ''}` })
  }

  function handleToggleFavorite() {
    toggleFavorite.mutate({ referenciaId: id!, isFavorite: !!isFavorite })
  }

  const hasPdf = !!(news as any).pdf

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder-subtle">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-darkText flex-1" numberOfLines={1}>
          {t('news.title')}
        </Text>
        <TouchableOpacity onPress={handleToggleFavorite} className="mr-3 p-1">
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? '#f87171' : '#6b7280'}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} className="p-1">
          <Ionicons name="share-outline" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {news.imagem && (
          <Image source={{ uri: news.imagem }} className="w-full h-52" resizeMode="cover" />
        )}

        <View className="px-4 pt-5">
          <Text className="text-xl font-bold text-darkText">{news.titulo}</Text>

          <View className="flex-row items-center mt-3 flex-wrap gap-2">
            {news.created_at && (
              <Text className="text-xs text-darkText-muted">
                {format(new Date(news.created_at), 'dd/MM/yyyy')}
              </Text>
            )}
            {(news as any).categorias?.nome && (
              <Badge>{(news as any).categorias.nome}</Badge>
            )}
            {news.estado && <Badge>{news.estado}</Badge>}
            {news.orgao && <Badge>{news.orgao}</Badge>}
            {news.disciplina && <Badge>{news.disciplina}</Badge>}
          </View>

          {news.descricao && (
            <Text className="text-base text-darkText-secondary leading-7 mt-5">{news.descricao}</Text>
          )}

          {hasPdf && (
            <View className="mt-6">
              <Text className="text-sm font-bold text-darkText mb-2">{t('news.viewPdf')}</Text>
              <View style={{ height: 600 }}>
                <WebView
                  source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent((news as any).pdf)}` }}
                  style={{ flex: 1, backgroundColor: '#f7f6f3' }}
                  startInLoadingState
                  renderLoading={() => <LoadingSpinner />}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
