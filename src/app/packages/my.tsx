import { View, Text, FlatList, TouchableOpacity, Modal, Pressable, Alert } from 'react-native'
import { Image } from 'expo-image'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMyPackages, useCancelSubscription } from '@/hooks/usePackages'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { t } from '@/i18n'
import { useThemeColors } from '@/hooks/useThemeColors'

type PackageAccess = {
  id: string
  pacote_id: string
  access_expire_date: string | null
  next_billing_date: string | null
  cancelled_at: string | null
  pagarme_subscription_id: string | null
  pacotes: any
}

function getSubscriptionState(item: PackageAccess) {
  const now = new Date()
  const isExpired = item.access_expire_date ? new Date(item.access_expire_date) < now : false
  const isCancelled = !!item.cancelled_at

  if (isExpired) return 'expired' as const
  if (isCancelled) return 'cancelled_pending' as const
  return 'active' as const
}

function formatDate(date: string | null) {
  if (!date) return ''
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR })
}

export default function MyPackagesScreen() {
  const router = useRouter()
  const colors = useThemeColors()
  const { data: packages, isLoading } = useMyPackages()
  const cancelSubscription = useCancelSubscription()
  const [cancelTarget, setCancelTarget] = useState<PackageAccess | null>(null)

  async function handleConfirmCancel() {
    if (!cancelTarget) return
    try {
      const result = await cancelSubscription.mutateAsync(cancelTarget.pacote_id)
      setCancelTarget(null)
      const until = result?.access_until
      Alert.alert(
        'Assinatura cancelada',
        until
          ? `Seu acesso continua ativo até ${formatDate(until)}.`
          : 'Sua assinatura foi cancelada.',
      )
    } catch (err: any) {
      setCancelTarget(null)
      Alert.alert('Erro', err.message ?? 'Não foi possível cancelar a assinatura. Tente novamente.')
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-darkBorder bg-dark-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-base font-bold text-darkText flex-1">{t('packages.myPackages')}</Text>
      </View>

      <FlatList
        data={packages as PackageAccess[]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <EmptyState
            title={t('packages.noPackages')}
            icon={<Ionicons name="cube-outline" size={48} color={colors.textMuted} />}
          />
        }
        renderItem={({ item }) => {
          const pacote = item.pacotes
          const state = getSubscriptionState(item)

          return (
            <View className="bg-dark-surface rounded-2xl mb-3 overflow-hidden border border-darkBorder-subtle">
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/packages/[id]', params: { id: item.pacote_id } })}
                className="flex-row p-4"
              >
                {pacote?.imagem ? (
                  <Image source={{ uri: pacote.imagem }} className="w-16 h-16 rounded-lg" contentFit="cover" />
                ) : (
                  <View className="w-16 h-16 bg-primary-50 rounded-lg items-center justify-center">
                    <Ionicons name="cube-outline" size={24} color="#60a5fa" />
                  </View>
                )}

                <View className="flex-1 ml-3 justify-center gap-1.5">
                  <Text className="text-base font-semibold text-darkText">{pacote?.nome}</Text>

                  {state === 'active' && item.next_billing_date && (
                    <View className="flex-row items-center gap-1.5">
                      <Badge variant="success">{t('packages.statusActive')}</Badge>
                      <Text className="text-xs text-darkText-muted">
                        {t('packages.renewsOn')} {formatDate(item.next_billing_date)}
                      </Text>
                    </View>
                  )}

                  {state === 'active' && !item.next_billing_date && (
                    <Badge variant="success">{t('packages.statusActive')}</Badge>
                  )}

                  {state === 'cancelled_pending' && (
                    <View className="flex-row items-center gap-1.5">
                      <Badge variant="warning">{t('packages.statusCancelled')}</Badge>
                      {item.access_expire_date && (
                        <Text className="text-xs text-darkText-muted">
                          {t('packages.activeUntil')} {formatDate(item.access_expire_date)}
                        </Text>
                      )}
                    </View>
                  )}

                  {state === 'expired' && (
                    <Badge variant="default">{t('packages.statusExpired')}</Badge>
                  )}
                </View>
              </TouchableOpacity>

              {state === 'active' && (
                <TouchableOpacity
                  onPress={() => setCancelTarget(item)}
                  className="border-t border-darkBorder-subtle py-3 items-center"
                >
                  <Text className="text-sm text-error font-medium">
                    {t('packages.cancelSubscription')}
                  </Text>
                </TouchableOpacity>
              )}

              {state === 'expired' && (
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/packages/[id]', params: { id: item.pacote_id } })}
                  className="border-t border-darkBorder-subtle py-3 items-center"
                >
                  <Text className="text-sm text-primary-light font-medium">
                    {t('packages.renew')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }}
      />

      {/* Cancel confirmation bottom sheet */}
      <Modal
        visible={!!cancelTarget}
        transparent
        animationType="slide"
        onRequestClose={() => setCancelTarget(null)}
      >
        <Pressable
          className="flex-1 bg-black/60"
          onPress={() => setCancelTarget(null)}
        />
        <View className="bg-dark-surface rounded-t-3xl px-6 pt-6 pb-10">
          <View className="w-12 h-1 bg-darkBorder rounded-full self-center mb-6" />

          <View className="w-14 h-14 rounded-full bg-error/10 items-center justify-center self-center mb-4">
            <Ionicons name="calendar-outline" size={28} color="#f87171" />
          </View>

          <Text className="text-lg font-bold text-darkText text-center mb-2">
            {t('packages.cancelSheetTitle')}
          </Text>

          {cancelTarget?.access_expire_date && (
            <Text className="text-sm text-darkText-secondary text-center leading-5 mb-6">
              {t('packages.cancelSheetMessage', { date: formatDate(cancelTarget.access_expire_date) } as any)}
            </Text>
          )}

          {!cancelTarget?.access_expire_date && (
            <Text className="text-sm text-darkText-secondary text-center leading-5 mb-6">
              {t('packages.cancelSheetMessageNoDate')}
            </Text>
          )}

          <TouchableOpacity
            onPress={() => setCancelTarget(null)}
            className="bg-primary rounded-2xl py-4 items-center mb-3"
          >
            <Text className="font-bold text-base text-darkText-inverse">
              {t('packages.cancelSheetKeep')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleConfirmCancel}
            disabled={cancelSubscription.isPending}
            className="py-3 items-center"
          >
            <Text className="text-sm text-error font-medium">
              {cancelSubscription.isPending
                ? t('common.loading')
                : t('packages.cancelSheetConfirm')}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
