import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useCheckoutCard } from '@/hooks/usePayment'

export default function CardCheckoutScreen() {
  const params = useLocalSearchParams<{
    customer_id: string
    amount: string
    curso_id?: string
    pacote_id?: string
    cupom_codigo?: string
    course_name?: string
  }>()
  const router = useRouter()
  const checkout = useCheckoutCard()

  const [cardNumber, setCardNumber] = useState('')
  const [holderName, setHolderName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [installments, setInstallments] = useState(1)

  const amountCents = parseInt(params.amount ?? '0', 10)
  const amountBRL = amountCents / 100

  function formatCardNumber(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
  }

  function formatExpiry(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return digits
  }

  function parseExpiry(): { month: number; year: number } | null {
    const parts = expiry.split('/')
    if (parts.length !== 2) return null
    const month = parseInt(parts[0], 10)
    const year = parseInt(parts[1], 10)
    if (month < 1 || month > 12 || year < 24) return null
    return { month, year: 2000 + year }
  }

  const isValid =
    cardNumber.replace(/\s/g, '').length >= 13 &&
    holderName.trim().length >= 3 &&
    parseExpiry() !== null &&
    cvv.length >= 3

  async function handleSubmit() {
    const exp = parseExpiry()
    if (!exp) return

    try {
      const result = await checkout.mutateAsync({
        customer_id: params.customer_id!,
        amount: amountCents,
        card: {
          number: cardNumber.replace(/\s/g, ''),
          holder_name: holderName.trim().toUpperCase(),
          exp_month: exp.month,
          exp_year: exp.year,
          cvv,
        },
        installments,
        curso_id: params.curso_id || undefined,
        pacote_id: params.pacote_id || undefined,
        cupom_codigo: params.cupom_codigo || undefined,
      })

      if (result.status === 'paid') {
        router.replace({ pathname: '/checkout/success', params: { course_name: params.course_name } })
      } else {
        router.replace({ pathname: '/checkout/success', params: { course_name: params.course_name, pending: '1' } })
      }
    } catch (err: any) {
      Alert.alert('Erro no pagamento', err.message ?? 'Tente novamente')
    }
  }

  // Installment options
  const installmentOptions = []
  for (let i = 1; i <= 12; i++) {
    const value = amountBRL / i
    installmentOptions.push({ count: i, label: `${i}x de R$ ${value.toFixed(2)}${i === 1 ? ' à vista' : ''}` })
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="flex-row items-center px-4 pt-4 pb-3 border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Cartão de Crédito</Text>
        </View>

        <View className="px-4 pt-4">
          {/* Card Number */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Número do cartão</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50"
              placeholder="0000 0000 0000 0000"
              placeholderTextColor="#9ca3af"
              value={cardNumber}
              onChangeText={(t) => setCardNumber(formatCardNumber(t))}
              keyboardType="numeric"
              maxLength={19}
            />
          </View>

          {/* Holder Name */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Nome no cartão</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50"
              placeholder="NOME COMO IMPRESSO NO CARTÃO"
              placeholderTextColor="#9ca3af"
              value={holderName}
              onChangeText={setHolderName}
              autoCapitalize="characters"
            />
          </View>

          {/* Expiry + CVV */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Validade</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50"
                placeholder="MM/AA"
                placeholderTextColor="#9ca3af"
                value={expiry}
                onChangeText={(t) => setExpiry(formatExpiry(t))}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">CVV</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50"
                placeholder="123"
                placeholderTextColor="#9ca3af"
                value={cvv}
                onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 4))}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>

          {/* Installments */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">Parcelas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {installmentOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.count}
                  onPress={() => setInstallments(opt.count)}
                  className={`rounded-xl px-4 py-2.5 mr-2 border ${
                    installments === opt.count
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      installments === opt.count ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Total */}
          <View className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">Total</Text>
              <Text className="text-lg font-bold text-blue-600">R$ {amountBRL.toFixed(2)}</Text>
            </View>
            {installments > 1 && (
              <Text className="text-xs text-gray-500 text-right mt-0.5">
                {installments}x de R$ {(amountBRL / installments).toFixed(2)}
              </Text>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid || checkout.isPending}
            className={`rounded-xl py-4 items-center mb-8 ${
              isValid && !checkout.isPending ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            {checkout.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">Pagar R$ {amountBRL.toFixed(2)}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
