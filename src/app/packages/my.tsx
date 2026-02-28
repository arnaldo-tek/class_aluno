import { View, Text, FlatList, TouchableOpacity, Image, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { useMyPackages, useCancelSubscription } from '@/hooks/usePackages'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { t } from '@/i18n'

export default function MyPackagesScreen() {
  const router = useRouter()
  const { data: packages, isLoading } = useMyPackages()
  const cancelSubscription = useCancelSubscription()

  function handleCancel(pacoteId: string) {
    Alert.alert(
      t('packages.cancelSubscription'),
      t('packages.cancelConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: () => cancelSubscription.mutate(pacoteId),
        },
      ],
    )
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900 flex-1">{t('packages.myPackages')}</Text>
      </View>

      <FlatList
        data={packages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState
            title={t('packages.noPackages')}
            icon={<Ionicons name="cube-outline" size={48} color="#9ca3af" />}
          />
        }
        renderItem={({ item }) => {
          const pacote = (item as any).pacotes
          const isExpired = item.access_expire_date && new Date(item.access_expire_date) < new Date()

          return (
            <View className="bg-white rounded-xl mb-3 overflow-hidden border border-gray-100">
              <TouchableOpacity
                onPress={() => router.push(`/packages/${item.pacote_id}`)}
                className="flex-row p-4"
              >
                {pacote?.imagem ? (
                  <Image source={{ uri: pacote.imagem }} className="w-16 h-16 rounded-lg" resizeMode="cover" />
                ) : (
                  <View className="w-16 h-16 bg-blue-50 rounded-lg items-center justify-center">
                    <Ionicons name="cube-outline" size={24} color="#2563eb" />
                  </View>
                )}
                <View className="flex-1 ml-3 justify-center">
                  <Text className="text-base font-semibold text-gray-900">{pacote?.nome}</Text>
                  {item.access_expire_date && (
                    <Text className={`text-xs mt-1 ${isExpired ? 'text-red-500' : 'text-gray-400'}`}>
                      {t('packages.activeUntil')} {format(new Date(item.access_expire_date), 'dd/MM/yyyy')}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              {!isExpired && (
                <TouchableOpacity
                  onPress={() => handleCancel(item.pacote_id)}
                  disabled={cancelSubscription.isPending}
                  className="border-t border-gray-100 py-3 items-center"
                >
                  <Text className="text-sm text-red-500 font-medium">
                    {t('packages.cancelSubscription')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }}
      />
    </SafeAreaView>
  )
}
