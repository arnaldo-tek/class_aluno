import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useOnboardingSlides() {
  return useQuery({
    queryKey: ['onboarding-slides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('publicidade_abertura')
        .select('id, imagem, link')
        .eq('is_active', true)
        .order('created_at')

      if (error) throw error
      return data ?? []
    },
  })
}
