import { useState, useEffect, useRef } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useChamadoMensagens, useSendChamadoMensagem } from '@/hooks/useSupport'
import { useAuthContext } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function ChamadoChatScreen() {
  const router = useRouter()
  const { id, descricao, status } = useLocalSearchParams<{ id: string; descricao: string; status: string }>()
  const { user } = useAuthContext()
  const qc = useQueryClient()
  const { data: mensagens, isLoading } = useChamadoMensagens(id)
  const sendMutation = useSendChamadoMensagem()
  const [msg, setMsg] = useState('')
  const flatListRef = useRef<FlatList>(null)

  // Realtime
  useEffect(() => {
    if (!id) return
    const channel = supabase
      .channel(`chamado-msgs:${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chamado_mensagens', filter: `chamado_id=eq.${id}` },
        () => { qc.invalidateQueries({ queryKey: ['chamado-mensagens', id] }) },
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [id, qc])

  function handleSend() {
    const trimmed = msg.trim()
    if (!trimmed || !id) return
    sendMutation.mutate({ chamadoId: id, mensagem: trimmed })
    setMsg('')
  }

  function getStatusLabel(s: string) {
    switch (s) {
      case 'aberto': return 'Aberto'
      case 'em_andamento': return 'Em andamento'
      case 'resolvido': return 'Resolvido'
      default: return s
    }
  }

  function getStatusColor(s: string) {
    switch (s) {
      case 'aberto': return '#3b82f6'
      case 'em_andamento': return '#f59e0b'
      case 'resolvido': return '#22c55e'
      default: return '#9ca3af'
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-dark-surface border-b border-darkBorder">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-darkText">Chamado</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: getStatusColor(status ?? 'aberto') }} />
            <Text className="text-xs text-darkText-muted">{getStatusLabel(status ?? 'aberto')}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={mensagens}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            <View className="bg-dark-surface rounded-2xl p-4 mb-4 border border-darkBorder">
              <Text className="text-xs text-darkText-muted mb-1">Descrição do chamado</Text>
              <Text className="text-sm text-darkText-secondary leading-5">{descricao ?? ''}</Text>
            </View>
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-8">
              <Ionicons name="chatbubbles-outline" size={40} color="#9ca3af" />
              <Text className="text-sm text-darkText-muted mt-2">Nenhuma mensagem ainda</Text>
              <Text className="text-xs text-darkText-muted">Aguarde a resposta do suporte</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.user_id === user?.id
            return (
              <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                <View style={{
                  maxWidth: '80%',
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  backgroundColor: isMe ? '#e0f2fe' : '#ffffff',
                  borderWidth: 1,
                  borderColor: isMe ? '#bae6fd' : '#e5e4e1',
                }}>
                  <Text style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>
                    {isMe ? 'Você' : 'Suporte'}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#1a1a2e', lineHeight: 20 }}>{item.mensagem}</Text>
                  <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 4, textAlign: 'right' }}>
                    {item.created_at ? new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </Text>
                </View>
              </View>
            )
          }}
        />

        {/* Input */}
        <View className="flex-row items-center px-4 py-3 bg-dark-surface border-t border-darkBorder" style={{ gap: 8 }}>
          <TextInput
            value={msg}
            onChangeText={setMsg}
            placeholder="Digite sua mensagem..."
            placeholderTextColor="#9ca3af"
            className="flex-1 bg-dark-surfaceLight border border-darkBorder rounded-2xl px-4 py-3 text-sm text-darkText"
            multiline
            style={{ maxHeight: 100 }}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!msg.trim() || sendMutation.isPending}
            className="w-10 h-10 rounded-full bg-primary items-center justify-center"
            style={{ opacity: msg.trim() ? 1 : 0.4 }}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
