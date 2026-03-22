import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createSupabaseFromRequest } from '../_shared/supabase.ts'
import { pagarmeRequest, buildSplitRules, PagarmeError } from '../_shared/pagarme.ts'

interface CreateSubscriptionBody {
  action: 'create'
  customer_id: string
  plan_id?: string
  card: {
    number: string
    holder_name: string
    exp_month: number
    exp_year: number
    cvv: string
  }
  amount: number
  interval: 'month' | 'year'
  interval_count?: number
  description?: string
  receiver_ids?: string[]
}

interface CancelSubscriptionBody {
  action: 'cancel'
  subscription_id: string
}

type SubscriptionBody = CreateSubscriptionBody | CancelSubscriptionBody

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const supabase = createSupabaseFromRequest(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return errorResponse('Unauthorized', 401)

    const body: SubscriptionBody = await req.json()

    if (body.action === 'create') {
      if (!body.customer_id || !body.card || !body.amount) {
        return errorResponse('customer_id, card, and amount are required')
      }

      const splitRules = body.receiver_ids?.length
        ? buildSplitRules(body.receiver_ids, body.amount)
        : []

      const subscription = await pagarmeRequest<{ id: string; status: string }>(
        '/subscriptions',
        'POST',
        {
          customer_id: body.customer_id,
          payment_method: 'credit_card',
          credit_card: {
            card: {
              number: body.card.number,
              holder_name: body.card.holder_name,
              exp_month: body.card.exp_month,
              exp_year: body.card.exp_year,
              cvv: body.card.cvv,
            },
            statement_descriptor: 'SuperClasse',
          },
          interval: body.interval || 'month',
          interval_count: body.interval_count || 1,
          minimum_price: body.amount,
          items: [
            {
              description: body.description || 'Assinatura SuperClasse',
              quantity: 1,
              pricing_scheme: {
                price: body.amount,
                scheme_type: 'unit',
              },
            },
          ],
          ...(splitRules.length > 0 ? { split: { rules: splitRules } } : {}),
        },
      )

      return jsonResponse({
        subscription_id: subscription.id,
        status: subscription.status,
      })
    }

    if (body.action === 'cancel') {
      if (!body.subscription_id) {
        return errorResponse('subscription_id is required')
      }

      await pagarmeRequest(
        `/subscriptions/${body.subscription_id}`,
        'DELETE',
      )

      return jsonResponse({ cancelled: true })
    }

    return errorResponse('Invalid action. Use: create, cancel')
  } catch (err) {
    console.error('payment-subscription error:', err)
    if (err instanceof PagarmeError) {
      return jsonResponse({ error: 'Pagar.me error', details: err.data }, err.status)
    }
    return errorResponse(err.message ?? 'Internal error', 500)
  }
})
