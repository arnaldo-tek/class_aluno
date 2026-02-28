import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useAudioPackages(tipo: number) {
  return useQuery({
    queryKey: ['audio-packages', tipo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pacotes_leis')
        .select('*')
        .eq('tipo_pacote_lei', tipo)
        .order('nome')

      if (error) throw error
      return data ?? []
    },
  })
}

export function useAudioFolders(pacoteLeiId: string) {
  return useQuery({
    queryKey: ['audio-folders', pacoteLeiId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subpastas_leis')
        .select('*')
        .eq('pacote_lei_id', pacoteLeiId)
        .order('nome')

      if (error) throw error
      return data ?? []
    },
    enabled: !!pacoteLeiId,
  })
}

export function useAudioLaws(subpastaId: string, search?: string) {
  return useQuery({
    queryKey: ['audio-laws', subpastaId, search],
    queryFn: async () => {
      let query = supabase
        .from('leis')
        .select('*')
        .eq('subpasta_id', subpastaId)
        .is('deleted_at', null)
        .order('nome')

      if (search) {
        query = query.ilike('nome', `%${search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    enabled: !!subpastaId,
  })
}

export function useAudioLawDetail(id: string) {
  return useQuery({
    queryKey: ['audio-law-detail', id],
    queryFn: async () => {
      const { data: lei, error: leiError } = await supabase
        .from('leis')
        .select('*')
        .eq('id', id)
        .single()

      if (leiError) throw leiError

      const { data: audios, error: audioError } = await supabase
        .from('audio_leis')
        .select('*')
        .eq('lei_id', id)
        .order('created_at')

      if (audioError) throw audioError

      return { lei, audios: audios ?? [] }
    },
    enabled: !!id,
  })
}

export function useAudioBanners() {
  return useQuery({
    queryKey: ['audio-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('publicidade_audio_curso')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
  })
}
