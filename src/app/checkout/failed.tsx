import { View, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function CheckoutFailedScreen() {
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-20 h-20 rounded-full bg-red-50 items-center justify-center mb-6">
          <Ionicons name="close-circle" size={48} color="#dc2626" />
        </View>

        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
          Pagamento recusado
        </Text>

        <Text className="text-base text-gray-500 text-center mb-8">
          Não foi possível processar seu pagamento. Verifique os dados do cartão e tente novamente.
        </Text>

        <TouchableOpacity
          onPress={() => router.back()}
          className="w-full bg-blue-600 rounded-xl py-4 items-center mb-3"
        >
          <Text className="text-white font-bold text-base">Tentar novamente</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/home')}
          className="w-full bg-gray-100 rounded-xl py-4 items-center"
        >
          <Text className="text-gray-700 font-semibold text-base">Voltar ao início</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
