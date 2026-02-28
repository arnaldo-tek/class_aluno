import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { WebView } from 'react-native-webview'
import { useNoticeDetail, useToggleNoticeFavorite } from '@/hooks/useNotices'
import { useIsFavorite } from '@/hooks/useNews'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { t } from '@/i18n'

export default function NoticeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data: notice, isLoading } = useNoticeDetail(id!)
  const { data: isFavorite } = useIsFavorite('edital', id!)
  const toggleFavorite = useToggleNoticeFavorite()

  const [viewMode, setViewMode] = useState<'summary' | 'complete'>('summary')

  if (isLoading) return <LoadingSpinner />
  if (!notice) return null

  function handleToggleFavorite() {
    toggleFavorite.mutate({ referenciaId: id!, isFavorite: !!isFavorite })
  }

  const hasPdf = !!(notice as any).pdf

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900 flex-1" numberOfLines={1}>
          {t('notices.title')}
        </Text>
        <TouchableOpacity onPress={handleToggleFavorite}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? '#dc2626' : '#6b7280'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-4 pt-4">
          <Text className="text-xl font-bold text-gray-900">{notice.titulo}</Text>

          <View className="flex-row items-center mt-2 flex-wrap gap-2">
            {(notice as any).categorias?.nome && (
              <Badge>{(notice as any).categorias.nome}</Badge>
            )}
            {notice.estado && <Badge>{notice.estado}</Badge>}
            {notice.orgao && <Badge>{notice.orgao}</Badge>}
          </View>

          {(notice as any).professor_profiles?.nome_professor && (
            <Text className="text-sm text-gray-500 mt-2">
              {t('notices.professor')}: {(notice as any).professor_profiles.nome_professor}
            </Text>
          )}

          {/* Toggle Resumo / Completo */}
          {notice.resumo && notice.descricao && (
            <View className="flex-row mt-4 bg-gray-100 rounded-xl p-1">
              <TouchableOpacity
                onPress={() => setViewMode('summary')}
                className={`flex-1 py-2 rounded-lg items-center ${viewMode === 'summary' ? 'bg-white' : ''}`}
              >
                <Text className={`text-sm font-medium ${viewMode === 'summary' ? 'text-gray-900' : 'text-gray-500'}`}>
                  {t('notices.summary')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewMode('complete')}
                className={`flex-1 py-2 rounded-lg items-center ${viewMode === 'complete' ? 'bg-white' : ''}`}
              >
                <Text className={`text-sm font-medium ${viewMode === 'complete' ? 'text-gray-900' : 'text-gray-500'}`}>
                  {t('notices.complete')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Text className="text-sm text-gray-700 leading-6 mt-4">
            {viewMode === 'summary' ? (notice.resumo ?? notice.descricao) : (notice.descricao ?? notice.resumo)}
          </Text>

          {/* PDF */}
          {hasPdf && (
            <View className="mt-6">
              <Text className="text-sm font-semibold text-gray-900 mb-2">{t('notices.downloadPdf')}</Text>
              <View style={{ height: 600 }}>
                <WebView
                  source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent((notice as any).pdf)}` }}
                  style={{ flex: 1 }}
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
