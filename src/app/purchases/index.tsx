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
    <SafeAreaView className="flex-1 bg-dark-bg">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-3 bg-dark-surface border-b border-darkBorder">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-darkText">Minhas compras</Text>
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
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor="#6b7280"
            />
          }
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const s = STATUS_MAP[item.status ?? 'pending'] ?? STATUS_MAP.pending
            return (
              <View className="bg-dark-surface rounded-2xl p-4 mb-3 border border-darkBorder">
                <View className="flex-row items-start justify-between mb-2">
                  <Text className="text-sm font-semibold text-darkText flex-1 mr-2" numberOfLines={2}>
                    {item.nome_curso ?? 'Compra'}
                  </Text>
                  <Badge variant={s.variant}>{s.label}</Badge>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-bold text-primary-light">
                    R$ {(item.valor ?? 0).toFixed(2)}
                  </Text>
                  <Text className="text-xs text-darkText-muted">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '—'}
                  </Text>
                </View>
                {item.status === 'paid' && (
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: `/refund/${item.id}`, params: { nome: item.nome_curso ?? 'Compra' } })}
                    className="mt-2 pt-2 border-t border-darkBorder-subtle"
                  >
                    <Text className="text-xs text-error text-center">Solicitar reembolso</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}
