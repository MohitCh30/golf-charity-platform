import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      return NextResponse.redirect(
        new URL('/auth/login?error=missing_fields', request.url)
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      return NextResponse.redirect(
        new URL('/auth/login?error=invalid_credentials', request.url)
      )
    }

    const adminClient = await createAdminClient()
    const { data: profile } = await adminClient
      .from('profiles')
      .select('subscriptions(status, end_date)')
      .eq('id', data.user.id)
      .single()

    const activeSub = profile?.subscriptions?.find(
      (s: { status: string; end_date: string }) =>
        s.status === 'active' && new Date(s.end_date) >= new Date()
    )

    if (activeSub) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.redirect(
      new URL('/auth/login?error=server_error', request.url)
    )
  }
}