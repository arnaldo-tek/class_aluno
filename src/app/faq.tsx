import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { t } from '@/i18n'

function useFaq() {
  return useQuery({
    queryKey: ['faq'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faq')
        .select('id, pergunta, resposta')
        .order('sort_order')

      if (error) throw error
      return data ?? []
    },
  })
}

export default function FaqScreen() {
  const router = useRouter()
  const { data: items, isLoading } = useFaq()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (isLoading) return <LoadingSpinner />

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900 flex-1">{t('faq.title')}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState
            title={t('faq.noFaq')}
            icon={<Ionicons name="help-circle-outline" size={48} color="#9ca3af" />}
          />
        }
        renderItem={({ item }) => {
          const isExpanded = expandedId === item.id
          return (
            <TouchableOpacity
              onPress={() => setExpandedId(isExpanded ? null : item.id)}
              className="bg-white rounded-xl mb-3 border border-gray-100 overflow-hidden"
            >
              <View className="flex-row items-center px-4 py-4">
                <Text className="flex-1 text-base font-medium text-gray-900">{item.pergunta}</Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#9ca3af"
                />
              </View>
              {isExpanded && (
                <View className="px-4 pb-4 border-t border-gray-50">
                  <Text className="text-sm text-gray-600 leading-6 pt-3">{item.resposta}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        }}
      />
    </SafeAreaView>
  )
}
