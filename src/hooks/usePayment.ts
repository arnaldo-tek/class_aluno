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

async function invokeEdgeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  await supabase.auth.getSession() // triggers auto-refresh if token is near expiry

  const { data, error } = await supabase.functions.invoke(name, {
    body,
  })

  // On non-2xx, supabase-js v2 sets data=null and error=FunctionsHttpError.
  // The actual JSON body is in error.context (a Response object).
  if (error) {
    try {
      const body = await (error as any).context?.json?.()
      if (body && typeof body === 'object' && 'error' in body) {
        const details = body.details ? JSON.stringify(body.details) : body.error
        console.error(`[${name}] API error:`, JSON.stringify(body))
        throw new Error(details)
      }
    } catch (extracted) {
      if (extracted instanceof Error) throw extracted
    }
    console.error(`[${name}] Edge function error:`, error)
    throw new Error(error.message ?? `Edge function ${name} failed`)
  }

  // Handle error in 2xx responses (shouldn't happen but just in case)
  if (data && typeof data === 'object' && 'error' in data) {
    const details = (data as any).details
      ? JSON.stringify((data as any).details)
      : (data as any).error
    console.error(`[${name}] API error:`, JSON.stringify(data))
    throw new Error(details)
  }

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

/** Update customer document (CPF) on Pagar.me */
export function useUpdateCustomerDocument() {
  return useMutation({
    mutationFn: async ({ customer_id, document }: { customer_id: string; document: string }) => {
      return invokeEdgeFunction('payment-create-customer', {
        customer_id_update: customer_id,
        document,
        document_type: 'CPF',
      })
    },
  })
}

/** Checkout with credit card */
export function useCheckoutCard() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: CheckoutCardParams) =>
      invokeEdgeFunction<OrderResult>('payment-checkout-card', params),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['my-enrollments'] })
      qc.invalidateQueries({ queryKey: ['purchase-history'] })
      qc.invalidateQueries({ queryKey: ['my-packages'] })
      qc.invalidateQueries({ queryKey: ['package-access'] })
      if (data.status === 'paid') {
        qc.invalidateQueries({ queryKey: ['enrollment-check'] })
      }
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
      qc.invalidateQueries({ queryKey: ['my-packages'] })
      qc.invalidateQueries({ queryKey: ['package-access'] })
      qc.invalidateQueries({ queryKey: ['enrollment-check'] })
    },
  })
}

/** Verify PIX payment status directly against Pagar.me (webhook fallback) */
export function useVerifyPixPayment() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) =>
      invokeEdgeFunction<{ status: string; already_enrolled: boolean }>(
        'payment-verify-pix',
        { order_id: orderId },
      ),
    onSuccess: (data) => {
      if (data.status === 'paid') {
        qc.invalidateQueries({ queryKey: ['enrollment-check'] })
        qc.invalidateQueries({ queryKey: ['my-enrollments'] })
        qc.invalidateQueries({ queryKey: ['purchase-history'] })
        qc.invalidateQueries({ queryKey: ['pix-order-status'] })
      }
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

/** Poll movimentacoes until PIX order is paid or expired */
export function usePixOrderStatus(orderId: string | null) {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['pix-order-status', orderId],
    queryFn: async () => {
      if (!orderId || !user) return null
      const { data } = await supabase
        .from('movimentacoes')
        .select('status')
        .eq('pagarme_order_id', orderId)
        .eq('user_id', user.id)
        .maybeSingle()
      return data?.status ?? null
    },
    enabled: !!orderId && !!user,
    refetchInterval: (query) => {
      const status = query.state.data
      if (status === 'paid' || status === 'failed' || status === 'cancelled') return false
      return 5000 // poll every 5s while pending
    },
    staleTime: 0,
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
        .select(`
          id, valor, status, created_at, nome_curso, pagarme_order_id,
          curso:cursos(nome, imagem),
          pacote:pacotes(nome, imagem)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []).map((m) => ({
        ...m,
        display_name: m.nome_curso || (m.curso as any)?.nome || (m.pacote as any)?.nome || 'Compra',
        display_image: (m.curso as any)?.imagem || (m.pacote as any)?.imagem || null,
      }))
    },
    enabled: !!user,
  })
}
