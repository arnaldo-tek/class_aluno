import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Linking, Dimensions, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { Video, ResizeMode } from 'expo-av'
import { WebView } from 'react-native-webview'
import { supabase } from '@/lib/supabase'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { t } from '@/i18n'
import { useThemeColors } from '@/hooks/useThemeColors'

const SCREEN_WIDTH = Dimensions.get('window').width

function useFaq() {
  return useQuery({
    queryKey: ['faq'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faq')
        .select('id, pergunta, resposta, video')
        .order('sort_order')

      if (error) throw error
      return data ?? []
    },
  })
}

export default function FaqScreen() {
  const router = useRouter()
  const colors = useThemeColors()
  const { data: items, isLoading } = useFaq()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (isLoading) return <LoadingSpinner />

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder-subtle bg-dark-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-base font-bold text-darkText flex-1">{t('faq.title')}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState
            title={t('faq.noFaq')}
            icon={<Ionicons name="help-circle-outline" size={48} color={colors.textMuted} />}
          />
        }
        renderItem={({ item }) => {
          const isExpanded = expandedId === item.id
          return (
            <View className="bg-dark-surface rounded-2xl mb-3 overflow-hidden">
              <TouchableOpacity
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
                className="flex-row items-center px-4 py-4"
                activeOpacity={0.7}
              >
                <Text className="flex-1 text-base font-medium text-darkText">{item.pergunta}</Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
              {isExpanded && (
                <View className="px-4 pb-4 border-t border-darkBorder-subtle">
                  <Text className="text-sm text-darkText-secondary leading-6 pt-3">{item.resposta}</Text>
                  {item.video && (
                    <View className="mt-3 rounded-xl overflow-hidden">
                      <FaqVideo url={item.video} />
                    </View>
                  )}
                </View>
              )}
            </View>
          )
        }}
      />
    </SafeAreaView>
  )
}

function isEmbeddable(url: string) {
  return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')
}

function getEmbedUrl(url: string): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return url
}

function FaqVideo({ url }: { url: string }) {
  const videoHeight = (SCREEN_WIDTH - 48) * 9 / 16

  if (isEmbeddable(url)) {
    if (Platform.OS === 'web') {
      return (
        <iframe
          src={getEmbedUrl(url)}
          style={{ width: '100%', height: videoHeight, border: 'none', borderRadius: 12 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )
    }
    return (
      <WebView
        source={{ uri: getEmbedUrl(url) }}
        style={{ width: '100%', height: videoHeight }}
        allowsFullscreenVideo
        javaScriptEnabled
      />
    )
  }

  return (
    <Video
      source={{ uri: url }}
      useNativeControls
      resizeMode={ResizeMode.CONTAIN}
      style={{ width: '100%', height: videoHeight }}
    />
  )
}
