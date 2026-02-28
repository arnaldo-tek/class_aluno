import { View, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function CheckoutSuccessScreen() {
  const { course_name, pending } = useLocalSearchParams<{ course_name?: string; pending?: string }>()
  const router = useRouter()

  const isPending = pending === '1'

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <View className={`w-20 h-20 rounded-full items-center justify-center mb-6 ${isPending ? 'bg-yellow-50' : 'bg-green-50'}`}>
          <Ionicons
            name={isPending ? 'time-outline' : 'checkmark-circle'}
            size={48}
            color={isPending ? '#f59e0b' : '#16a34a'}
          />
        </View>

        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
          {isPending ? 'Pagamento em processamento' : 'Pagamento confirmado!'}
        </Text>

        <Text className="text-base text-gray-500 text-center mb-2">
          {isPending
            ? 'Seu pagamento está sendo processado. Você receberá uma notificação quando for confirmado.'
            : 'Seu acesso ao curso foi liberado.'}
        </Text>

        {course_name && (
          <Text className="text-sm font-medium text-blue-600 text-center mb-8">
            {course_name}
          </Text>
        )}

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/my-courses')}
          className="w-full bg-blue-600 rounded-xl py-4 items-center mb-3"
        >
          <Text className="text-white font-bold text-base">Ver meus cursos</Text>
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
