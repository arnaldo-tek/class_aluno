import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useCourseDetail } from '@/hooks/useCourses'
import { usePackageDetail } from '@/hooks/usePackages'
import { useValidateCoupon, useCustomerId } from '@/hooks/usePayment'
import { useFreeEnroll } from '@/hooks/useEnrollments'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function CheckoutScreen() {
  const { id, type = 'curso' } = useLocalSearchParams<{ id: string; type?: string }>()
  const router = useRouter()

  const isPacote = type === 'pacote'
  const courseQuery = useCourseDetail(isPacote ? '' : id!)
  const packageQuery = usePackageDetail(isPacote ? id! : '')
  const { data: customerId, isLoading: loadingCustomer } = useCustomerId()
  const validateCoupon = useValidateCoupon()
  const freeEnroll = useFreeEnroll()

  const [cupomCode, setCupomCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ codigo: string; valor: number } | null>(null)
  const [cpf, setCpf] = useState('')

  function formatCpf(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }

  const cpfDigits = cpf.replace(/\D/g, '')
  const cpfValid = cpfDigits.length === 11

  const isLoading = isPacote ? packageQuery.isLoading : courseQuery.isLoading
  const item = isPacote ? packageQuery.data : courseQuery.data

  if (isLoading || loadingCustomer) return <LoadingSpinner />
  if (!item) {
    return (
      <SafeAreaView className="flex-1 bg-dark-bg items-center justify-center px-8">
        <Ionicons name="alert-circle-outline" size={48} color="#f87171" />
        <Text className="text-base text-darkText-secondary text-center mt-4 mb-6">
          {isPacote ? 'Pacote não encontrado' : 'Curso não encontrado'}
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-primary rounded-2xl px-6 py-3">
          <Text className="text-darkText-inverse font-semibold">Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const originalPrice = item.preco ?? 0
  const discount = appliedCoupon?.valor ?? 0
  const finalPrice = Math.max(originalPrice - discount, 0)

  async function handleApplyCoupon() {
    if (!cupomCode.trim()) return
    try {
      const cupom = await validateCoupon.mutateAsync(cupomCode.trim())
      setAppliedCoupon({ codigo: cupom.codigo, valor: cupom.valor })
    } catch (err: any) {
      Alert.alert('Cupom', err.message ?? 'Erro ao validar cupom')
    }
  }

  function navigateToPayment(method: 'card' | 'pix') {
    if (!customerId) {
      Alert.alert('Erro', 'Não foi possível criar seu perfil de pagamento. Tente novamente.')
      return
    }
    if (!cpfValid) {
      Alert.alert('CPF', 'Digite um CPF válido para continuar.')
      return
    }

    const params: Record<string, string> = {
      customer_id: customerId,
      amount: String(Math.round(finalPrice * 100)),
      curso_id: type === 'curso' ? id! : '',
      pacote_id: type === 'pacote' ? id! : '',
      course_name: item.nome,
      cpf: cpfDigits,
    }
    if (appliedCoupon) {
      params.cupom_codigo = appliedCoupon.codigo
    }

    if (method === 'card') {
      router.push({ pathname: '/checkout/card', params })
    } else {
      router.push({ pathname: '/checkout/pix', params })
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-4 pt-4 pb-3 border-b border-darkBorder-subtle">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-darkText">Checkout</Text>
        </View>

        {/* Item summary */}
        <View className="flex-row px-4 py-4 border-b border-darkBorder-subtle">
          {item.imagem ? (
            <Image source={{ uri: item.imagem }} className="w-20 h-14 rounded-lg" resizeMode="cover" />
          ) : (
            <View className="w-20 h-14 rounded-lg bg-dark-surfaceLight items-center justify-center">
              <Ionicons name={isPacote ? 'layers-outline' : 'book-outline'} size={20} color="#9ca3af" />
            </View>
          )}
          <View className="flex-1 ml-3 justify-center">
            <Text className="text-sm font-semibold text-darkText" numberOfLines={2}>{item.nome}</Text>
            {!isPacote && (
              <Text className="text-xs text-darkText-secondary mt-0.5">
                {((item as any).professor as any)?.nome_professor}
              </Text>
            )}
            {isPacote && (
              <Text className="text-xs text-darkText-secondary mt-0.5">
                Pacote com {(item as any).pacote_cursos?.length ?? 0} cursos
              </Text>
            )}
          </View>
        </View>

        {/* Coupon */}
        <View className="px-4 py-4 border-b border-darkBorder-subtle">
          <Text className="text-sm font-medium text-darkText-secondary mb-2">Cupom de desconto</Text>
          <View className="flex-row gap-2">
            <TextInput
              className="flex-1 border border-darkBorder rounded-2xl px-3 py-2.5 text-sm bg-dark-surface text-darkText"
              placeholder="Digite o código"
              placeholderTextColor="#9ca3af"
              value={cupomCode}
              onChangeText={setCupomCode}
              autoCapitalize="characters"
              editable={!appliedCoupon}
            />
            {appliedCoupon ? (
              <TouchableOpacity
                onPress={() => { setAppliedCoupon(null); setCupomCode('') }}
                className="bg-error-dark rounded-2xl px-4 items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#f87171" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleApplyCoupon}
                disabled={validateCoupon.isPending}
                className="bg-primary rounded-2xl px-4 items-center justify-center"
              >
                <Text className="text-darkText-inverse font-semibold text-sm">Aplicar</Text>
              </TouchableOpacity>
            )}
          </View>
          {appliedCoupon && (
            <View className="flex-row items-center mt-2">
              <Ionicons name="checkmark-circle" size={16} color="#34d399" />
              <Text className="text-sm text-success ml-1">
                Cupom {appliedCoupon.codigo} aplicado: -R$ {appliedCoupon.valor.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {/* CPF */}
        <View className="px-4 py-4 border-b border-darkBorder-subtle">
          <Text className="text-sm font-medium text-darkText-secondary mb-2">CPF</Text>
          <TextInput
            className="border border-darkBorder rounded-2xl px-3 py-2.5 text-sm bg-dark-surface text-darkText"
            placeholder="000.000.000-00"
            placeholderTextColor="#9ca3af"
            value={cpf}
            onChangeText={(t) => setCpf(formatCpf(t))}
            keyboardType="numeric"
            maxLength={14}
          />
        </View>

        {/* Price summary */}
        <View className="px-4 py-4 border-b border-darkBorder-subtle">
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-darkText-secondary">Subtotal</Text>
            <Text className="text-sm text-darkText">R$ {originalPrice.toFixed(2)}</Text>
          </View>
          {discount > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-success">Desconto</Text>
              <Text className="text-sm text-success">-R$ {discount.toFixed(2)}</Text>
            </View>
          )}
          <View className="flex-row justify-between pt-2 border-t border-darkBorder-subtle">
            <Text className="text-base font-bold text-darkText">Total</Text>
            <Text className="text-base font-bold text-primary-light">R$ {finalPrice.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment methods or free enroll */}
        <View className="px-4 py-4">
          {finalPrice === 0 ? (
            <TouchableOpacity
              onPress={async () => {
                try {
                  if (isPacote) {
                    // For free packages, enroll in all courses
                    const cursos = (item as any).pacote_cursos ?? []
                    for (const pc of cursos) {
                      const cursoId = pc.curso_id ?? pc.cursos?.id
                      if (cursoId) await freeEnroll.mutateAsync({ cursoId })
                    }
                  } else {
                    await freeEnroll.mutateAsync({ cursoId: id! })
                  }
                  router.replace('/checkout/success?status=free')
                } catch (err: any) {
                  Alert.alert('Erro', err.message ?? 'Nao foi possivel realizar a inscricao.')
                }
              }}
              disabled={freeEnroll.isPending}
              className="bg-accent rounded-2xl py-4 items-center"
            >
              <Text className="text-darkText-inverse font-bold text-base">
                {freeEnroll.isPending ? 'Inscrevendo...' : 'Inscrever-se gratuitamente'}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text className="text-sm font-medium text-darkText-secondary mb-3">Forma de pagamento</Text>

              <TouchableOpacity
                onPress={() => navigateToPayment('card')}
                className="flex-row items-center bg-dark-surface border border-darkBorder rounded-2xl px-4 py-4 mb-3"
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-full bg-primary-50 items-center justify-center">
                  <Ionicons name="card-outline" size={22} color="#60a5fa" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-semibold text-darkText">Cartao de Credito</Text>
                  <Text className="text-xs text-darkText-secondary">Parcele em ate 12x</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigateToPayment('pix')}
                className="flex-row items-center bg-dark-surface border border-darkBorder rounded-2xl px-4 py-4"
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-full bg-success-dark items-center justify-center">
                  <Ionicons name="qr-code-outline" size={22} color="#34d399" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-semibold text-darkText">PIX</Text>
                  <Text className="text-xs text-darkText-secondary">Aprovacao instantanea</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
