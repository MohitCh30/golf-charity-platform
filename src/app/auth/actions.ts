'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function encrypt(data: string): string {
  return Buffer.from(data).toString('base64')
}

function decrypt(data: string): string {
  return Buffer.from(data, 'base64').toString('utf-8')
}

async function setSignupSession(data: {
  name?: string
  email?: string
  password?: string
  charityId?: string
  plan?: string
}) {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const encrypted = encrypt(JSON.stringify(data))
  cookieStore.set('signup_session', encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
}

export async function getSignupSession(): Promise<{
  name?: string
  email?: string
  password?: string
  charityId?: string
  plan?: string
} | null> {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const encrypted = cookieStore.get('signup_session')?.value
  if (!encrypted) return null
  try {
    return JSON.parse(decrypt(encrypted))
  } catch {
    return null
  }
}

async function clearSignupSession() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  cookieStore.delete('signup_session')
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    throw new Error('Email and password are required')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const session = await getSignupSession()
  if (!session?.email || !session?.password || !session?.name) {
    redirect('/auth/signup?step=1')
  }

  const email = session.email
  const password = session.password
  const fullName = session.name
  const charityId = formData.get('charityId') as string
  const plan = formData.get('plan') as 'monthly' | 'yearly'
  const contributionPercent = parseInt(formData.get('contributionPercent') as string) || 10

  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (authError || !authData.user) {
    throw new Error(authError?.message || 'Failed to create account')
  }

  const userId = authData.user.id

  const PRICES = {
    monthly: 999,
    yearly: 9999,
  }
  const subscription_cents = PRICES[plan]
  const charity_cents = Math.round(subscription_cents * (contributionPercent / 100))

  await new Promise((resolve) => setTimeout(resolve, 800))
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

  const startDate = new Date()
  const endDate = new Date()
  if (plan === 'monthly') {
    endDate.setMonth(endDate.getMonth() + 1)
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1)
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      charity_id: charityId || null,
      charity_contribution_percent: contributionPercent,
    })
    .eq('id', userId)

  if (profileError) {
    throw new Error('Failed to save profile')
  }

  const { error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan,
      status: 'active',
      amount_cents: subscription_cents,
      charity_amount_cents: charity_cents,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      payment_transaction_id: transactionId,
    })

  if (subError) {
    throw new Error('Failed to create subscription')
  }

  await clearSignupSession()
  redirect('/dashboard')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function nextSignupStep(currentStep: number) {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const encrypted = cookieStore.get('signup_session')?.value
  if (!encrypted) {
    redirect('/auth/signup?step=1')
  }

  const params = new URLSearchParams({ step: String(currentStep + 1) })
  redirect(`/auth/signup?${params.toString()}`)
}

export async function submitStep1(formData: FormData) {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  
  const name = formData.get('fullName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const sessionData = Buffer.from(JSON.stringify({ name, email, password })).toString('base64')
  cookieStore.set('signup_session', sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  redirect('/auth/signup?step=2')
}

export async function submitStep2(formData: FormData) {
  const charityId = formData.get('charityId') as string

  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const encrypted = cookieStore.get('signup_session')?.value

  if (encrypted) {
    try {
      const session = JSON.parse(Buffer.from(encrypted, 'base64').toString('utf-8'))
      session.charityId = charityId
      const updated = Buffer.from(JSON.stringify(session)).toString('base64')
      cookieStore.set('signup_session', updated, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600,
        path: '/',
      })
    } catch {
      redirect('/auth/signup?step=1')
    }
  }

  redirect('/auth/signup?step=3')
}

export async function getCharities(): Promise<{ id: string; name: string; description: string; mission: string; is_featured?: boolean }[]> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('charities')
    .select('id, name, description, mission, is_featured')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .limit(6)
  return data || []
}