import { View, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function CheckoutSuccessScreen() {
  const { course_name, pending } = useLocalSearchParams<{ course_name?: string; pending?: string }>()
  const router = useRouter()

  const isPending = pending === '1'

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-1 items-center justify-center px-8">
        <View className={`w-20 h-20 rounded-full items-center justify-center mb-6 ${isPending ? 'bg-warning-dark' : 'bg-success-dark'}`}>
          <Ionicons
            name={isPending ? 'time-outline' : 'checkmark-circle'}
            size={48}
            color={isPending ? '#fbbf24' : '#34d399'}
          />
        </View>

        <Text className="text-2xl font-bold text-darkText text-center mb-2">
          {isPending ? 'Pagamento em processamento' : 'Pagamento confirmado!'}
        </Text>

        <Text className="text-base text-darkText-secondary text-center mb-2">
          {isPending
            ? 'Seu pagamento está sendo processado. Você receberá uma notificação quando for confirmado.'
            : 'Seu acesso ao curso foi liberado.'}
        </Text>

        {course_name && (
          <Text className="text-sm font-medium text-primary-light text-center mb-8">
            {course_name}
          </Text>
        )}

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/my-courses')}
          className="w-full bg-primary rounded-2xl py-4 items-center mb-3"
        >
          <Text className="text-darkText-inverse font-bold text-base">Ver meus cursos</Text>
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
