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
    <SafeAreaView className="flex-1 bg-dark-bg">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-dark-surface border-b border-darkBorder">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-darkText flex-1">Suporte</Text>
        <TouchableOpacity
          onPress={() => setShowForm(!showForm)}
          className="w-9 h-9 rounded-full bg-primary items-center justify-center"
        >
          <Ionicons name={showForm ? 'close' : 'add'} size={22} color="#1a1a2e" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* New ticket form */}
        {showForm && (
          <View className="mx-4 mt-4 bg-dark-surface rounded-2xl p-4 border border-darkBorder">
            <Text className="text-sm font-semibold text-darkText mb-2">Novo chamado</Text>
            <TextInput
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Descreva seu problema ou dúvida..."
              placeholderTextColor="#9ca3af"
              className="bg-dark-surfaceLight border border-darkBorder rounded-2xl px-4 py-3.5 text-sm text-darkText min-h-[100px]"
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!descricao.trim() || createChamado.isPending}
              className={`mt-3 py-3.5 rounded-2xl items-center ${
                descricao.trim() ? 'bg-primary' : 'bg-dark-surfaceLight'
              }`}
            >
              <Text className={`text-sm font-semibold ${
                descricao.trim() ? 'text-darkText-inverse' : 'text-darkText-muted'
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
              <TouchableOpacity
                onPress={() => router.push({
                  pathname: '/support/[id]',
                  params: { id: item.id, descricao: item.descricao ?? '', status: item.status ?? 'aberto' },
                })}
                activeOpacity={0.7}
                className="bg-dark-surface rounded-2xl p-4 mb-3 border border-darkBorder"
              >
                <View className="flex-row items-start justify-between mb-2">
                  <Badge variant={getStatusVariant(item.status ?? 'aberto')}>
                    {getStatusLabel(item.status ?? 'aberto')}
                  </Badge>
                  <Text className="text-xs text-darkText-muted">
                    {formatDate(item.created_at ?? '')}
                  </Text>
                </View>
                <Text className="text-sm text-darkText-secondary leading-5" numberOfLines={4}>
                  {item.descricao}
                </Text>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="chatbubble-outline" size={14} color="#9ca3af" />
                  <Text className="text-xs text-darkText-muted ml-1">Toque para ver mensagens</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
