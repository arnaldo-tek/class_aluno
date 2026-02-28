import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { useCheckoutPix } from '@/hooks/usePayment'

export default function PixCheckoutScreen() {
  const params = useLocalSearchParams<{
    customer_id: string
    amount: string
    curso_id?: string
    pacote_id?: string
    cupom_codigo?: string
    course_name?: string
  }>()
  const router = useRouter()
  const checkoutPix = useCheckoutPix()

  const [qrCode, setQrCode] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(1800) // 30 minutes

  const amountCents = parseInt(params.amount ?? '0', 10)
  const amountBRL = amountCents / 100

  // Generate PIX on mount
  useEffect(() => {
    async function generatePix() {
      try {
        const result = await checkoutPix.mutateAsync({
          customer_id: params.customer_id!,
          amount: amountCents,
          curso_id: params.curso_id || undefined,
          pacote_id: params.pacote_id || undefined,
          cupom_codigo: params.cupom_codigo || undefined,
        })

        setQrCode(result.qr_code)
        setOrderId(result.order_id)
      } catch (err: any) {
        Alert.alert('Erro', err.message ?? 'Não foi possível gerar o PIX', [
          { text: 'Voltar', onPress: () => router.back() },
        ])
      }
    }
    generatePix()
  }, [])

  // Countdown timer
  useEffect(() => {
    if (!qrCode || timeLeft <= 0) return
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(interval)
  }, [qrCode, timeLeft])

  async function handleCopy() {
    if (!qrCode) return
    await Clipboard.setStringAsync(qrCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  if (checkoutPix.isPending && !qrCode) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-sm text-gray-500 mt-4">Gerando código PIX...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row items-center px-4 pt-4 pb-3 border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Pagamento PIX</Text>
        </View>

        {qrCode && (
          <View className="items-center px-4 pt-6">
            {/* Timer */}
            <View className="flex-row items-center mb-4">
              <Ionicons name="time-outline" size={18} color={timeLeft < 300 ? '#dc2626' : '#6b7280'} />
              <Text className={`text-sm font-medium ml-1 ${timeLeft < 300 ? 'text-red-600' : 'text-gray-600'}`}>
                Expira em {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </Text>
            </View>

            {/* Amount */}
            <Text className="text-2xl font-bold text-gray-900 mb-6">R$ {amountBRL.toFixed(2)}</Text>

            {/* QR Code placeholder - in production use a QR code library */}
            <View className="w-64 h-64 border-2 border-gray-200 rounded-2xl items-center justify-center bg-gray-50 mb-6">
              <Ionicons name="qr-code" size={120} color="#111827" />
              <Text className="text-xs text-gray-400 mt-2">QR Code PIX</Text>
            </View>

            {/* Copy code */}
            <Text className="text-sm text-gray-500 text-center mb-3">
              Ou copie o código PIX abaixo e cole no app do seu banco:
            </Text>

            <View className="w-full bg-gray-50 rounded-xl px-4 py-3 mb-3">
              <Text className="text-xs text-gray-600 font-mono" numberOfLines={3}>
                {qrCode}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleCopy}
              className="w-full bg-blue-600 rounded-xl py-3.5 flex-row items-center justify-center mb-6"
            >
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                {copied ? 'Código copiado!' : 'Copiar código PIX'}
              </Text>
            </TouchableOpacity>

            {/* Instructions */}
            <View className="w-full bg-blue-50 rounded-xl px-4 py-3">
              <Text className="text-sm font-semibold text-blue-900 mb-2">Como pagar:</Text>
              <Step n={1} text="Abra o app do seu banco ou carteira digital" />
              <Step n={2} text="Escolha pagar com PIX usando QR Code ou código copia e cola" />
              <Step n={3} text="Confirme o pagamento" />
              <Step n={4} text="Seu acesso será liberado automaticamente" />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <View className="flex-row items-start mb-1.5">
      <View className="w-5 h-5 rounded-full bg-blue-600 items-center justify-center mr-2 mt-0.5">
        <Text className="text-[10px] font-bold text-white">{n}</Text>
      </View>
      <Text className="text-sm text-blue-800 flex-1">{text}</Text>
    </View>
  )
}
