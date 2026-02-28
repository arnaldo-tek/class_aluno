import { View, Text, FlatList, RefreshControl, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { usePurchaseHistory } from '@/hooks/usePayment'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: 'Pendente', color: '#d97706', bg: 'bg-yellow-100', icon: 'time-outline' },
  paid: { label: 'Aprovado', color: '#16a34a', bg: 'bg-green-100', icon: 'checkmark-circle' },
  failed: { label: 'Recusado', color: '#dc2626', bg: 'bg-red-100', icon: 'close-circle' },
  refunded: { label: 'Reembolsado', color: '#6b7280', bg: 'bg-gray-100', icon: 'arrow-undo' },
  canceled: { label: 'Cancelado', color: '#6b7280', bg: 'bg-gray-100', icon: 'ban' },
}

export default function PurchaseHistoryScreen() {
  const router = useRouter()
  const { data: purchases, isLoading, refetch, isRefetching } = usePurchaseHistory()

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-3 border-b border-darkBorder-subtle">
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
          description="Suas compras de cursos e pacotes aparecerão aqui."
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
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item }) => {
            const s = STATUS_CONFIG[item.status ?? 'pending'] ?? STATUS_CONFIG.pending
            const date = item.created_at
              ? new Date(item.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })
              : '—'

            return (
              <View className="bg-dark-surface rounded-2xl mb-3 overflow-hidden border border-darkBorder-subtle">
                <View className="flex-row">
                  {/* Thumbnail */}
                  {item.display_image ? (
                    <Image
                      source={{ uri: item.display_image }}
                      className="w-20 h-20"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-20 h-20 bg-dark-surfaceLight items-center justify-center">
                      <Ionicons name="book-outline" size={24} color="#9ca3af" />
                    </View>
                  )}

                  {/* Content */}
                  <View className="flex-1 p-3 justify-between">
                    <View className="flex-row items-start justify-between">
                      <Text className="text-sm font-semibold text-darkText flex-1 mr-2" numberOfLines={2}>
                        {item.display_name}
                      </Text>
                      <View className="flex-row items-center rounded-full px-2 py-0.5" style={{ backgroundColor: s.color + '18' }}>
                        <Ionicons name={s.icon as any} size={12} color={s.color} />
                        <Text className="text-[11px] font-medium ml-1" style={{ color: s.color }}>
                          {s.label}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between mt-1">
                      <Text className="text-base font-bold text-primary-light">
                        R$ {(item.valor ?? 0).toFixed(2)}
                      </Text>
                      <Text className="text-xs text-darkText-muted">{date}</Text>
                    </View>
                  </View>
                </View>

                {/* Refund link */}
                {item.status === 'paid' && (
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: `/refund/${item.id}`, params: { nome: item.display_name } })}
                    className="border-t border-darkBorder-subtle py-2.5"
                  >
                    <Text className="text-xs text-darkText-muted text-center">Solicitar reembolso</Text>
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
