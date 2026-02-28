import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

function useSubmitSuggestion() {
  const { user } = useAuthContext()
  return useMutation({
    mutationFn: async (texto: string) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('sugestoes').insert({
        user_id: user.id,
        texto,
      })
      if (error) throw error
    },
  })
}

export default function SuggestionScreen() {
  const router = useRouter()
  const [text, setText] = useState('')
  const submit = useSubmitSuggestion()

  async function handleSubmit() {
    if (!text.trim()) return
    try {
      await submit.mutateAsync(text.trim())
      Alert.alert('Obrigado!', 'Sua sugestao foi enviada com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Nao foi possivel enviar sua sugestao.')
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-row items-center px-4 pt-4 pb-3 bg-dark-surface border-b border-darkBorder-subtle">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Ionicons name="arrow-back" size={24} color="#e5e5e5" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-darkText">Enviar sugestao</Text>
        </View>

        <View className="flex-1 px-4 pt-6">
          <Text className="text-sm text-darkText-secondary mb-4">
            Sua opiniao e muito importante para nos! Conte-nos como podemos melhorar a plataforma.
          </Text>

          <TextInput
            className="bg-dark-surface border border-darkBorder-subtle rounded-2xl px-4 py-3 text-base text-darkText min-h-[160px]"
            placeholder="Escreva sua sugestao aqui..."
            placeholderTextColor="#636366"
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />

          <Text className="text-xs text-darkText-muted mt-2 text-right">{text.length}/2000</Text>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!text.trim() || submit.isPending}
            className={`mt-6 rounded-2xl py-3.5 items-center ${text.trim() ? 'bg-primary' : 'bg-dark-surfaceLight'}`}
          >
            <Text className={`font-bold text-base ${text.trim() ? 'text-white' : 'text-darkText-muted'}`}>
              {submit.isPending ? 'Enviando...' : 'Enviar sugestao'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
