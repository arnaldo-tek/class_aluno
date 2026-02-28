import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useBanners() {
  return useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('id, imagem, redirecionamento')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw error
      return data ?? []
    },
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nome, tipo')
        .eq('tipo', 'curso')
        .order('nome')

      if (error) throw error
      return data ?? []
    },
  })
}

export function useTopProfessors() {
  return useQuery({
    queryKey: ['top-professors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professor_profiles')
        .select('id, nome_professor, foto_perfil, average_rating')
        .eq('approval_status', 'aprovado')
        .order('average_rating', { ascending: false })
        .limit(10)

      if (error) throw error
      return data ?? []
    },
  })
}

export function useRecentNews() {
  return useQuery({
    queryKey: ['recent-news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('noticias')
        .select('id, titulo, descricao, imagem, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      return data ?? []
    },
  })
}
