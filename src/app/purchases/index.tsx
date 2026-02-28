import { View, Text, FlatList, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { usePurchaseHistory } from '@/hooks/usePayment'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' }> = {
  pending: { label: 'Pendente', variant: 'warning' },
  paid: { label: 'Pago', variant: 'success' },
  failed: { label: 'Recusado', variant: 'default' },
  refunded: { label: 'Reembolsado', variant: 'primary' },
  cancelled: { label: 'Cancelado', variant: 'default' },
}

export default function PurchaseHistoryScreen() {
  const router = useRouter()
  const { data: purchases, isLoading, refetch, isRefetching } = usePurchaseHistory()

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Minhas compras</Text>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : !purchases?.length ? (
        <EmptyState
          title="Nenhuma compra"
          description="Suas compras aparecerão aqui."
          icon={<Ionicons name="receipt-outline" size={48} color="#9ca3af" />}
        />
      ) : (
        <FlatList
          data={purchases}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const s = STATUS_MAP[item.status ?? 'pending'] ?? STATUS_MAP.pending
            return (
              <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
                <View className="flex-row items-start justify-between mb-2">
                  <Text className="text-sm font-semibold text-gray-900 flex-1 mr-2" numberOfLines={2}>
                    {item.nome_curso ?? 'Compra'}
                  </Text>
                  <Badge variant={s.variant}>{s.label}</Badge>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-bold text-blue-600">
                    R$ {(item.valor ?? 0).toFixed(2)}
                  </Text>
                  <Text className="text-xs text-gray-400">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '—'}
                  </Text>
                </View>
              </View>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}
