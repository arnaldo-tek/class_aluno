import { View, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function CheckoutFailedScreen() {
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-20 h-20 rounded-full bg-error-dark items-center justify-center mb-6">
          <Ionicons name="close-circle" size={48} color="#f87171" />
        </View>

        <Text className="text-2xl font-bold text-darkText text-center mb-2">
          Pagamento recusado
        </Text>

        <Text className="text-base text-darkText-secondary text-center mb-8">
          Não foi possível processar seu pagamento. Verifique os dados do cartão e tente novamente.
        </Text>

        <TouchableOpacity
          onPress={() => router.back()}
          className="w-full bg-primary rounded-2xl py-4 items-center mb-3"
        >
          <Text className="text-darkText-inverse font-bold text-base">Tentar novamente</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/home')}
          className="w-full bg-dark-surfaceLight rounded-2xl py-4 items-center border border-darkBorder"
        >
          <Text className="text-darkText-secondary font-semibold text-base">Voltar ao início</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
