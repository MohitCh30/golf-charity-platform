export interface PaymentIntent {
  id: string
  amount_cents: number
  currency: string
  status: 'pending' | 'succeeded' | 'failed'
  created_at: string
}

export interface PaymentResult {
  success: boolean
  transaction_id?: string
  error?: string
}

const MOCK_DELAY_MS = 800

const generateTransactionId = () =>
  `txn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

export async function createPaymentIntent(
  amountCents: number,
  _metadata?: Record<string, string>
): Promise<PaymentIntent> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))

  return {
    id: `pi_${Date.now()}`,
    amount_cents: amountCents,
    currency: 'inr',
    status: 'pending',
    created_at: new Date().toISOString(),
  }
}

export async function confirmPayment(
  paymentIntentId: string,
  _paymentMethodId?: string
): Promise<PaymentResult> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))

  const shouldSucceed = Math.random() > 0.1

  if (shouldSucceed) {
    return {
      success: true,
      transaction_id: generateTransactionId(),
    }
  }

  return {
    success: false,
    error: 'Payment declined (mock)',
  }
}

export async function refundPayment(
  transactionId: string,
  amountCents?: number
): Promise<PaymentResult> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))

  return {
    success: true,
    transaction_id: `ref_${transactionId}`,
  }
}

export function calculateSubscriptionAmount(
  plan: 'monthly' | 'yearly',
  charityPercent: number
): { subscription_cents: number; charity_cents: number; total_cents: number } {
  const PRICES = {
    monthly: 999,
    yearly: 9999,
  }

  const subscription_cents = PRICES[plan]
  const charity_cents = Math.round(subscription_cents * (charityPercent / 100))
  const total_cents = subscription_cents + charity_cents

  return { subscription_cents, charity_cents, total_cents }
}