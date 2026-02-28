import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

// --- Types ---

interface CardData {
  number: string
  holder_name: string
  exp_month: number
  exp_year: number
  cvv: string
}

interface CheckoutCardParams {
  customer_id: string
  amount: number
  card: CardData
  installments: number
  curso_id?: string
  pacote_id?: string
  cupom_codigo?: string
}

interface CheckoutPixParams {
  customer_id: string
  amount: number
  curso_id?: string
  pacote_id?: string
  cupom_codigo?: string
}

interface OrderResult {
  order_id: string
  status: string
}

interface PixResult extends OrderResult {
  qr_code: string | null
  qr_code_url: string | null
}

// --- Edge Function calls ---

async function invokeEdgeFunction<T>(name: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, {
    body,
  })
  if (error) throw new Error(error.message ?? `Edge function ${name} failed`)
  return data as T
}

// --- Hooks ---

/** Get or create Pagar.me customer ID for the current user */
export function useCustomerId() {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['customer-id', user?.id],
    queryFn: async () => {
      if (!user) return null

      // Check if profile already has a customer ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('pagarme_customer_id, display_name, email')
        .eq('id', user.id)
        .single()

      if (profile?.pagarme_customer_id) {
        return profile.pagarme_customer_id
      }

      // Create a new customer
      const result = await invokeEdgeFunction<{ customer_id: string }>(
        'payment-create-customer',
        {
          name: profile?.display_name ?? user.user_metadata?.display_name ?? user.email,
          email: profile?.email ?? user.email,
        },
      )

      return result.customer_id
    },
    enabled: !!user,
    staleTime: Infinity,
  })
}

/** Checkout with credit card */
export function useCheckoutCard() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: CheckoutCardParams) =>
      invokeEdgeFunction<OrderResult>('payment-checkout-card', params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-enrollments'] })
      qc.invalidateQueries({ queryKey: ['purchase-history'] })
    },
  })
}

/** Checkout with PIX */
export function useCheckoutPix() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: CheckoutPixParams) =>
      invokeEdgeFunction<PixResult>('payment-checkout-pix', params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-enrollments'] })
      qc.invalidateQueries({ queryKey: ['purchase-history'] })
    },
  })
}

/** Validate a coupon code */
export function useValidateCoupon() {
  return useMutation({
    mutationFn: async (codigo: string) => {
      const { data, error } = await supabase
        .from('cupons')
        .select('id, codigo, valor, valid_until, max_uses, uses_count, is_active')
        .eq('codigo', codigo.toUpperCase())
        .eq('is_active', true)
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('Cupom inválido')
      if (data.valid_until && new Date(data.valid_until) < new Date()) {
        throw new Error('Cupom expirado')
      }
      if (data.max_uses && (data.uses_count ?? 0) >= data.max_uses) {
        throw new Error('Cupom esgotado')
      }

      return data
    },
  })
}

/** Purchase history */
export function usePurchaseHistory() {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['purchase-history', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('movimentacoes')
        .select('id, valor, status, created_at, nome_curso, pagarme_order_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
  })
}
