import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createPaymentIntent, confirmPayment } from '@/lib/payments/mock-payment'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const encrypted = cookieStore.get('signup_session')?.value

    if (!encrypted) {
      return NextResponse.redirect(new URL('/auth/signup?step=1', request.url))
    }

    let session
    try {
      session = JSON.parse(Buffer.from(encrypted, 'base64').toString('utf-8'))
    } catch {
      return NextResponse.redirect(new URL('/auth/signup?step=1', request.url))
    }

    if (!session.email || !session.password || !session.name) {
      return NextResponse.redirect(new URL('/auth/signup?step=1', request.url))
    }

    const formData = await request.formData()
    const charityId = formData.get('charityId') as string
    const plan = (formData.get('plan') as 'monthly' | 'yearly') || 'monthly'
    const contributionPercent = parseInt(formData.get('contributionPercent') as string) || 10

    if (session.charityId) {
      session.plan = plan
      const updated = Buffer.from(JSON.stringify(session)).toString('base64')
      cookieStore.set('signup_session', updated, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600,
        path: '/',
      })
    }

    const supabase = await createClient()

    let userId: string

    const { data: existingUser } = await supabase.auth.getUser()
    if (existingUser?.user) {
      userId = existingUser.user.id
      console.log('User already logged in:', userId)
    } else {
      // Try to sign in first (in case user already exists)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: session.email,
        password: session.password,
      })

      if (signInData?.user) {
        userId = signInData.user.id
        console.log('User signed in:', userId)
      } else {
        // User doesn't exist, create them
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: session.email,
          password: session.password,
          options: {
            data: {
              full_name: session.name,
            },
          },
        })

        if (signUpError || !signUpData.user) {
          console.error('Signup error:', signUpError)
          return NextResponse.redirect(
            new URL('/auth/signup?step=3&error=signup_failed', request.url)
          )
        }
        
        userId = signUpData.user.id
        console.log('New user created:', userId)
        
        // If session was returned, we need to use it
        // Otherwise, the user needs to confirm email or we need to create session manually
        if (!signUpData.session) {
          // Sign in immediately after signup (works if email confirmation is disabled)
          const { data: newSignInData, error: newSignInError } = await supabase.auth.signInWithPassword({
            email: session.email,
            password: session.password,
          })
          
          if (newSignInError || !newSignInData.user) {
            console.error('Auto sign-in error:', newSignInError)
            // Continue anyway - user might need to confirm email
          } else {
            userId = newSignInData.user.id
            console.log('User auto signed in:', userId)
          }
        }
      }
    }

    const PRICES: Record<string, number> = {
      monthly: 999,
      yearly: 9999,
    }
    const subscription_cents = PRICES[plan] || 999
    const charity_cents = Math.round(subscription_cents * (contributionPercent / 100))

    const paymentIntent = await createPaymentIntent(subscription_cents, {
      plan,
      charityId: charityId || '',
      userEmail: session.email,
    })
    const paymentResult = await confirmPayment(paymentIntent.id)

    if (!paymentResult.success || !paymentResult.transaction_id) {
      return NextResponse.redirect(
        new URL('/auth/signup?step=3&error=payment_failed', request.url)
      )
    }

    const transactionId = paymentResult.transaction_id

    const startDate = new Date()
    const endDate = new Date()
    if (plan === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1)
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1)
    }

    const adminClient = await createAdminClient()

    // Check if profile exists and update it
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      const { error: profileError } = await adminClient
        .from('profiles')
        .update({
          charity_id: charityId || null,
          charity_contribution_percent: contributionPercent,
        })
        .eq('id', userId)

      if (profileError) {
        console.error('Profile update error:', profileError)
      }
    } else {
      // Create profile if it doesn't exist
      const { error: profileCreateError } = await adminClient
        .from('profiles')
        .insert({
          id: userId,
          email: session.email,
          full_name: session.name,
          charity_id: charityId || null,
          charity_contribution_percent: contributionPercent,
          role: 'subscriber',
        })

      if (profileCreateError) {
        console.error('Profile create error:', profileCreateError)
      }
    }

    // Create subscription
    const { error: subError } = await adminClient
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
      console.error('Subscription error:', subError)
      return NextResponse.redirect(
        new URL('/auth/signup?step=3&error=subscription_failed', request.url)
      )
    }

    cookieStore.delete('signup_session')

    const { data: charity } = await adminClient
      .from('charities')
      .select('name')
      .eq('id', charityId)
      .single()

    const welcomeUrl = new URL('/auth/welcome', request.url)
    welcomeUrl.searchParams.set('email', session.email)
    welcomeUrl.searchParams.set('name', session.name)
    welcomeUrl.searchParams.set('plan', plan)
    welcomeUrl.searchParams.set('charity', charity?.name || '')
    welcomeUrl.searchParams.set('contribution', String(contributionPercent))
    return NextResponse.redirect(welcomeUrl)
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.redirect(
      new URL('/auth/signup?step=3&error=server_error', request.url)
    )
  }
}
