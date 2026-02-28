import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useMyChamados, useCreateChamado } from '@/hooks/useSupport'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'

export default function SupportScreen() {
  const router = useRouter()
  const { data: chamados, isLoading } = useMyChamados()
  const createChamado = useCreateChamado()
  const [showForm, setShowForm] = useState(false)
  const [descricao, setDescricao] = useState('')

  async function handleSubmit() {
    const trimmed = descricao.trim()
    if (!trimmed) return

    try {
      await createChamado.mutateAsync({ descricao: trimmed })
      setDescricao('')
      setShowForm(false)
      Alert.alert('Sucesso', 'Seu chamado foi enviado com sucesso!')
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar o chamado. Tente novamente.')
    }
  }

  function getStatusVariant(status: string) {
    switch (status) {
      case 'aberto': return 'primary' as const
      case 'em_andamento': return 'warning' as const
      case 'resolvido': return 'success' as const
      default: return 'default' as const
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'aberto': return 'Aberto'
      case 'em_andamento': return 'Em andamento'
      case 'resolvido': return 'Resolvido'
      default: return status
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 flex-1">Suporte</Text>
        <TouchableOpacity
          onPress={() => setShowForm(!showForm)}
          className="w-9 h-9 rounded-full bg-blue-600 items-center justify-center"
        >
          <Ionicons name={showForm ? 'close' : 'add'} size={22} color="white" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* New ticket form */}
        {showForm && (
          <View className="mx-4 mt-4 bg-white rounded-2xl p-4">
            <Text className="text-sm font-semibold text-gray-900 mb-2">Novo chamado</Text>
            <TextInput
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Descreva seu problema ou dúvida..."
              placeholderTextColor="#9ca3af"
              className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900 min-h-[100px]"
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!descricao.trim() || createChamado.isPending}
              className={`mt-3 py-3 rounded-xl items-center ${
                descricao.trim() ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <Text className={`text-sm font-semibold ${
                descricao.trim() ? 'text-white' : 'text-gray-400'
              }`}>
                {createChamado.isPending ? 'Enviando...' : 'Enviar chamado'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Chamados list */}
        {!chamados || chamados.length === 0 ? (
          <EmptyState
            icon="help-circle-outline"
            title="Nenhum chamado"
            description="Toque no + para abrir um novo chamado de suporte"
          />
        ) : (
          <FlatList
            data={chamados}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View className="bg-white rounded-xl p-4 mb-3">
                <View className="flex-row items-start justify-between mb-2">
                  <Badge variant={getStatusVariant(item.status ?? 'aberto')}>
                    {getStatusLabel(item.status ?? 'aberto')}
                  </Badge>
                  <Text className="text-xs text-gray-400">
                    {formatDate(item.created_at ?? '')}
                  </Text>
                </View>
                <Text className="text-sm text-gray-700 leading-5" numberOfLines={4}>
                  {item.descricao}
                </Text>
              </View>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
