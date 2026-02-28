import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useCourseDetail } from '@/hooks/useCourses'
import { useValidateCoupon, useCustomerId } from '@/hooks/usePayment'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { t } from '@/i18n'

export default function CheckoutScreen() {
  const { id, type = 'curso' } = useLocalSearchParams<{ id: string; type?: string }>()
  const router = useRouter()

  const { data: course, isLoading } = useCourseDetail(id!)
  const { data: customerId, isLoading: loadingCustomer } = useCustomerId()
  const validateCoupon = useValidateCoupon()

  const [cupomCode, setCupomCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ codigo: string; valor: number } | null>(null)

  if (isLoading || loadingCustomer) return <LoadingSpinner />
  if (!course) return null

  const originalPrice = course.preco ?? 0
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

    const params: Record<string, string> = {
      customer_id: customerId,
      amount: String(Math.round(finalPrice * 100)),
      curso_id: type === 'curso' ? id! : '',
      pacote_id: type === 'pacote' ? id! : '',
      course_name: course!.nome,
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
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-4 pt-4 pb-3 border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Checkout</Text>
        </View>

        {/* Course summary */}
        <View className="flex-row px-4 py-4 border-b border-gray-100">
          {course.imagem ? (
            <Image source={{ uri: course.imagem }} className="w-20 h-14 rounded-lg" resizeMode="cover" />
          ) : (
            <View className="w-20 h-14 rounded-lg bg-gray-200 items-center justify-center">
              <Ionicons name="book-outline" size={20} color="#9ca3af" />
            </View>
          )}
          <View className="flex-1 ml-3 justify-center">
            <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>{course.nome}</Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              {(course.professor as any)?.nome_professor}
            </Text>
          </View>
        </View>

        {/* Coupon */}
        <View className="px-4 py-4 border-b border-gray-100">
          <Text className="text-sm font-medium text-gray-700 mb-2">Cupom de desconto</Text>
          <View className="flex-row gap-2">
            <TextInput
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50"
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
                className="bg-red-50 rounded-xl px-4 items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#dc2626" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleApplyCoupon}
                disabled={validateCoupon.isPending}
                className="bg-blue-600 rounded-xl px-4 items-center justify-center"
              >
                <Text className="text-white font-semibold text-sm">Aplicar</Text>
              </TouchableOpacity>
            )}
          </View>
          {appliedCoupon && (
            <View className="flex-row items-center mt-2">
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
              <Text className="text-sm text-green-600 ml-1">
                Cupom {appliedCoupon.codigo} aplicado: -R$ {appliedCoupon.valor.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {/* Price summary */}
        <View className="px-4 py-4 border-b border-gray-100">
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-600">Subtotal</Text>
            <Text className="text-sm text-gray-900">R$ {originalPrice.toFixed(2)}</Text>
          </View>
          {discount > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-green-600">Desconto</Text>
              <Text className="text-sm text-green-600">-R$ {discount.toFixed(2)}</Text>
            </View>
          )}
          <View className="flex-row justify-between pt-2 border-t border-gray-50">
            <Text className="text-base font-bold text-gray-900">Total</Text>
            <Text className="text-base font-bold text-blue-600">R$ {finalPrice.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment methods */}
        <View className="px-4 py-4">
          <Text className="text-sm font-medium text-gray-700 mb-3">Forma de pagamento</Text>

          <TouchableOpacity
            onPress={() => navigateToPayment('card')}
            className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-4 mb-3"
            activeOpacity={0.7}
          >
            <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center">
              <Ionicons name="card-outline" size={22} color="#2563eb" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-sm font-semibold text-gray-900">Cartão de Crédito</Text>
              <Text className="text-xs text-gray-500">Parcele em até 12x</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigateToPayment('pix')}
            className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-4"
            activeOpacity={0.7}
          >
            <View className="w-10 h-10 rounded-full bg-green-50 items-center justify-center">
              <Ionicons name="qr-code-outline" size={22} color="#16a34a" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-sm font-semibold text-gray-900">PIX</Text>
              <Text className="text-xs text-gray-500">Aprovação instantânea</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
