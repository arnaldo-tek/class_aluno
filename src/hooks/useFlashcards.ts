import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

// --- Pastas ---

export function useFlashcardFolders() {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['flashcard-folders', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('pasta_flashcards')
        .select('id, nome, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
  })
}

export function useCreateFolder() {
  const { user } = useAuthContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (nome: string) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('pasta_flashcards')
        .insert({ nome, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flashcard-folders'] }),
  })
}

export function useDeleteFolder() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pasta_flashcards').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flashcard-folders'] }),
  })
}

// --- Blocos ---

export function useFlashcardBlocks(folderId: string) {
  return useQuery({
    queryKey: ['flashcard-blocks', folderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bloco_flashcards')
        .select('id, nome')
        .eq('pasta_id', folderId)

      if (error) throw error
      return data ?? []
    },
    enabled: !!folderId,
  })
}

export function useCreateBlock() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ nome, pasta_id }: { nome: string; pasta_id: string }) => {
      const { error } = await supabase
        .from('bloco_flashcards')
        .insert({ nome, pasta_id })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flashcard-blocks'] }),
  })
}

export function useDeleteBlock() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bloco_flashcards').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flashcard-blocks'] }),
  })
}

// --- Cards ---

export function useFlashcards(blockId: string) {
  return useQuery({
    queryKey: ['flashcards', blockId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flashcards')
        .select('id, pergunta, resposta, created_at')
        .eq('bloco_id', blockId)
        .order('created_at')

      if (error) throw error
      return data ?? []
    },
    enabled: !!blockId,
  })
}

export function useCreateFlashcard() {
  const { user } = useAuthContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: { pergunta: string; resposta: string; bloco_id: string; pasta_id: string }) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('flashcards').insert({
        ...params,
        aluno_id: user.id,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flashcards'] }),
  })
}

export function useDeleteFlashcard() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('flashcards').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flashcards'] }),
  })
}

// --- Flashcards por Aula ---

export function useLessonFlashcards(aulaId: string) {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['flashcards-aula', aulaId, user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('flashcards')
        .select('id, pergunta, resposta, created_at')
        .eq('aula_id', aulaId)
        .eq('aluno_id', user.id)
        .order('created_at')

      if (error) throw error
      return data ?? []
    },
    enabled: !!aulaId && !!user,
  })
}

export function useCreateLessonFlashcard() {
  const { user } = useAuthContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: { pergunta: string; resposta: string; aula_id: string; curso_id?: string }) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('flashcards').insert({
        pergunta: params.pergunta,
        resposta: params.resposta,
        aula_id: params.aula_id,
        curso_id: params.curso_id ?? null,
        aluno_id: user.id,
      })
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['flashcards-aula', vars.aula_id] })
    },
  })
}
