const PAGARME_BASE_URL = Deno.env.get('PAGARME_BASE_URL') ??
  'https://api.pagar.me/core/v5'

const TRANSFER_PROXY_URL = Deno.env.get('TRANSFER_PROXY_URL') ?? ''

const PAGARME_API_KEY = Deno.env.get('PAGARME_API_KEY') ?? ''

const PLATFORM_RECEIVER_ID = 're_cm7m9wnhe0jnv0l9tbhvr7rky'

export interface SplitRule {
  amount: number
  recipient_id: string
  type: 'flat_value'
  options: {
    charge_processing_fee: boolean
    charge_remainder_fee: boolean
    liable: boolean
  }
}

/**
 * Build Pagar.me split rules using fixed amounts (centavos).
 * Platform always gets exactly 25%. Remaining 75% split equally among unique teachers.
 * Any remainder from rounding goes to the last teacher (never to the platform).
 *
 * If no teachers have receiver IDs, returns 100% to the platform — sending a partial
 * split (only 25%) makes Pagar.me silently strip the entire split and the teacher
 * portion gets lost.
 */
export function buildSplitRules(receiverIds: string[], totalAmount: number): SplitRule[] {
  const unique = [...new Set(receiverIds)]

  if (unique.length === 0) {
    console.warn('[buildSplitRules] No teacher receiver IDs — sending 100% to platform')
    return [
      {
        amount: totalAmount,
        recipient_id: PLATFORM_RECEIVER_ID,
        type: 'flat_value',
        options: { charge_processing_fee: true, charge_remainder_fee: true, liable: true },
      },
    ]
  }

  const platformAmount = Math.round(totalAmount * 0.25)
  const teachersTotal = totalAmount - platformAmount
  const teacherBase = Math.floor(teachersTotal / unique.length)
  const remainder = teachersTotal - teacherBase * unique.length

  const rules: SplitRule[] = [
    {
      amount: platformAmount,
      recipient_id: PLATFORM_RECEIVER_ID,
      type: 'flat_value',
      options: { charge_processing_fee: true, charge_remainder_fee: true, liable: true },
    },
  ]

  unique.forEach((rid, i) => {
    rules.push({
      amount: teacherBase + (i === unique.length - 1 ? remainder : 0),
      recipient_id: rid,
      type: 'flat_value',
      options: { charge_processing_fee: false, charge_remainder_fee: false, liable: false },
    })
  })

  return rules
}

export interface PagarmeRequestOptions {
  useTransferProxy?: boolean
}

/** Generic Pagar.me API call */
export async function pagarmeRequest<T = unknown>(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown,
  options?: PagarmeRequestOptions,
): Promise<T> {
  const baseUrl = options?.useTransferProxy && TRANSFER_PROXY_URL
    ? TRANSFER_PROXY_URL
    : PAGARME_BASE_URL

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  if (PAGARME_API_KEY) {
    headers['Authorization'] = `Basic ${btoa(PAGARME_API_KEY + ':')}`
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    const text = await res.text()
    console.error(`Pagar.me returned non-JSON (${res.status}):`, text.slice(0, 300))
    throw new PagarmeError(res.status, {
      message: `Pagar.me returned non-JSON response (${res.status})`,
    })
  }

  const data = await res.json()

  if (!res.ok) {
    throw new PagarmeError(res.status, data)
  }

  return data as T
}

export class PagarmeError extends Error {
  status: number
  data: unknown

  constructor(status: number, data: unknown) {
    super(`Pagar.me API error: ${status}`)
    this.name = 'PagarmeError'
    this.status = status
    this.data = data
  }
}
