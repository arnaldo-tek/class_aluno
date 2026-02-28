import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

const REASONS = [
  'Nao gostei do conteudo',
  'Comprei por engano',
  'Encontrei problemas tecnicos',
  'O curso nao atendeu minhas expectativas',
  'Outro motivo',
]

function useRequestRefund() {
  const { user } = useAuthContext()
  return useMutation({
    mutationFn: async ({ movimentacaoId, motivo, detalhes }: { movimentacaoId: string; motivo: string; detalhes?: string }) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('solicitacoes_reembolso').insert({
        user_id: user.id,
        movimentacao_id: movimentacaoId,
        motivo,
        detalhes,
      })
      if (error) throw error
    },
  })
}

export default function RefundRequestScreen() {
  const { id, nome } = useLocalSearchParams<{ id: string; nome?: string }>()
  const router = useRouter()
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [details, setDetails] = useState('')
  const refund = useRequestRefund()

  async function handleSubmit() {
    if (!selectedReason) return
    try {
      await refund.mutateAsync({
        movimentacaoId: id!,
        motivo: selectedReason,
        detalhes: details.trim() || undefined,
      })
      Alert.alert(
        'Solicitacao enviada',
        'Sua solicitacao de reembolso foi recebida. Analisaremos em ate 5 dias uteis.',
        [{ text: 'OK', onPress: () => router.back() }],
      )
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Nao foi possivel enviar a solicitacao.')
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-row items-center px-4 pt-4 pb-3 bg-dark-surface border-b border-darkBorder-subtle">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-darkText">Solicitar reembolso</Text>
        </View>

        <View className="flex-1 px-4 pt-6">
          {nome && (
            <View className="bg-dark-surface rounded-2xl px-4 py-3 mb-5 border border-darkBorder-subtle">
              <Text className="text-xs text-darkText-muted">Compra</Text>
              <Text className="text-sm font-medium text-darkText mt-0.5">{nome}</Text>
            </View>
          )}

          <Text className="text-sm font-semibold text-darkText mb-3">Motivo do reembolso</Text>

          {REASONS.map((reason) => (
            <TouchableOpacity
              key={reason}
              onPress={() => setSelectedReason(reason)}
              className={`flex-row items-center px-4 py-3.5 mb-2 rounded-2xl border ${
                selectedReason === reason ? 'border-primary bg-primary-50' : 'border-darkBorder-subtle bg-dark-surface'
              }`}
            >
              <Ionicons
                name={selectedReason === reason ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={selectedReason === reason ? '#60a5fa' : '#636366'}
              />
              <Text className={`text-sm ml-3 ${selectedReason === reason ? 'text-primary-light font-medium' : 'text-darkText'}`}>
                {reason}
              </Text>
            </TouchableOpacity>
          ))}

          <Text className="text-sm font-semibold text-darkText mt-5 mb-2">Detalhes (opcional)</Text>
          <TextInput
            className="bg-dark-surface border border-darkBorder-subtle rounded-2xl px-4 py-3 text-sm text-darkText min-h-[100px]"
            placeholder="Nos conte mais detalhes..."
            placeholderTextColor="#636366"
            value={details}
            onChangeText={setDetails}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!selectedReason || refund.isPending}
            className={`mt-6 rounded-2xl py-3.5 items-center ${selectedReason ? 'bg-error' : 'bg-dark-surfaceLight'}`}
          >
            <Text className={`font-bold text-base ${selectedReason ? 'text-white' : 'text-darkText-muted'}`}>
              {refund.isPending ? 'Enviando...' : 'Solicitar reembolso'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
