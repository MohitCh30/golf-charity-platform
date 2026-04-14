import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const plan = formData.get('plan') as 'monthly' | 'yearly'

    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return NextResponse.redirect(
        new URL('/dashboard/upgrade?error=invalid_plan', request.url)
      )
    }

    const PRICES: Record<string, number> = {
      monthly: 999,
      yearly: 9999,
    }

    const adminClient = await createAdminClient()

    const { data: existingSub } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (existingSub) {
      return NextResponse.redirect(
        new URL('/dashboard/upgrade?error=already_subscribed', request.url)
      )
    }

    const subscription_cents = PRICES[plan]
    const charity_cents = Math.round(subscription_cents * 0.1)
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    const startDate = new Date()
    const endDate = new Date()
    if (plan === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1)
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1)
    }

    const { error: subError } = await adminClient
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan,
        status: 'active',
        amount_cents: subscription_cents,
        charity_amount_cents: charity_cents,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        payment_transaction_id: transactionId,
      })

    if (subError) {
      console.error('Subscription error:', subError)
      return NextResponse.redirect(
        new URL('/dashboard/upgrade?error=subscription_failed', request.url)
      )
    }

    return NextResponse.redirect(new URL('/dashboard?upgraded=true', request.url))
  } catch (error) {
    console.error('Upgrade error:', error)
    return NextResponse.redirect(
      new URL('/dashboard/upgrade?error=server_error', request.url)
    )
  }
}
