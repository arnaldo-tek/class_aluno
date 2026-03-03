import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Linking, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { WebView } from 'react-native-webview'
import { useNoticeDetail, useToggleNoticeFavorite } from '@/hooks/useNotices'
import { useIsFavorite } from '@/hooks/useNews'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { t } from '@/i18n'
import { useThemeColors } from '@/hooks/useThemeColors'

export default function NoticeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const colors = useThemeColors()
  const { data: notice, isLoading } = useNoticeDetail(id!)
  const { data: isFavorite } = useIsFavorite('edital', id!)
  const toggleFavorite = useToggleNoticeFavorite()

  const [viewMode, setViewMode] = useState<'summary' | 'complete'>('summary')
  const [pdfFullscreen, setPdfFullscreen] = useState(false)

  if (isLoading) return <LoadingSpinner />
  if (!notice) return null

  function handleToggleFavorite() {
    toggleFavorite.mutate({ referenciaId: id!, isFavorite: !!isFavorite })
  }

  const hasPdf = !!(notice as any).pdf

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder-subtle">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-base font-bold text-darkText flex-1" numberOfLines={1}>
          {t('notices.title')}
        </Text>
        <TouchableOpacity onPress={handleToggleFavorite} className="p-1">
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? '#f87171' : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-4 pt-5">
          <Text className="text-xl font-bold text-darkText">{notice.titulo}</Text>

          <View className="flex-row items-center mt-3 flex-wrap gap-2">
            {(notice as any).categorias?.nome && (
              <Badge>{(notice as any).categorias.nome}</Badge>
            )}
            {notice.estado && <Badge>{notice.estado}</Badge>}
            {notice.orgao && <Badge>{notice.orgao}</Badge>}
          </View>

          {(notice as any).professor_profiles?.nome_professor && (
            <Text className="text-sm text-darkText-secondary mt-2">
              {t('notices.professor')}: {(notice as any).professor_profiles.nome_professor}
            </Text>
          )}

          {/* Toggle Resumo / Completo */}
          {notice.resumo && notice.descricao && (
            <View className="flex-row mt-5 bg-dark-surfaceLight rounded-2xl p-1">
              <TouchableOpacity
                onPress={() => setViewMode('summary')}
                className={`flex-1 py-2.5 rounded-xl items-center ${viewMode === 'summary' ? 'bg-dark-surface' : ''}`}
              >
                <Text className={`text-sm font-semibold ${viewMode === 'summary' ? 'text-darkText' : 'text-darkText-muted'}`}>
                  {t('notices.summary')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewMode('complete')}
                className={`flex-1 py-2.5 rounded-xl items-center ${viewMode === 'complete' ? 'bg-dark-surface' : ''}`}
              >
                <Text className={`text-sm font-semibold ${viewMode === 'complete' ? 'text-darkText' : 'text-darkText-muted'}`}>
                  {t('notices.complete')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Content text */}
          <Text className="text-base text-darkText-secondary leading-7 mt-5">
            {viewMode === 'summary' ? (notice.resumo ?? notice.descricao) : (notice.descricao ?? notice.resumo)}
          </Text>

          {/* PDF actions */}
          {hasPdf && viewMode === 'complete' && (
            <View className="flex-row mt-6 gap-3">
              <TouchableOpacity
                onPress={() => setPdfFullscreen(true)}
                className="flex-1 flex-row items-center justify-center bg-primary rounded-2xl py-3.5"
              >
                <Ionicons name="document-text-outline" size={18} color="#ffffff" />
                <Text className="text-sm font-bold text-white ml-2">Visualizar PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Linking.openURL((notice as any).pdf)}
                className="flex-row items-center justify-center bg-dark-surfaceLight rounded-2xl py-3.5 px-4 border border-darkBorder"
              >
                <Ionicons name="download-outline" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* PDF Fullscreen Modal */}
      {hasPdf && (
        <Modal visible={pdfFullscreen} animationType="slide" presentationStyle="fullScreen">
          <SafeAreaView className="flex-1 bg-dark-bg">
            <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder-subtle bg-dark-surface">
              <TouchableOpacity onPress={() => setPdfFullscreen(false)} className="mr-3 p-1">
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text className="text-base font-bold text-darkText flex-1" numberOfLines={1}>
                {notice.titulo}
              </Text>
              <TouchableOpacity onPress={() => Linking.openURL((notice as any).pdf)} className="p-1">
                <Ionicons name="download-outline" size={22} color="#60a5fa" />
              </TouchableOpacity>
            </View>
            <WebView
              source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent((notice as any).pdf)}` }}
              style={{ flex: 1 }}
              startInLoadingState
              renderLoading={() => <LoadingSpinner />}
              javaScriptEnabled
              scalesPageToFit
            />
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  )
}
