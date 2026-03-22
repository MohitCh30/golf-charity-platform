import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const email = formData.get('email') as string

    if (!email) {
      return NextResponse.redirect(
        new URL('/auth/forgot-password?error=missing_email', request.url)
      )
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
    })

    if (error) {
      return NextResponse.redirect(
        new URL('/auth/forgot-password?error=send_failed', request.url)
      )
    }

    return NextResponse.redirect(
      new URL('/auth/forgot-password?success=true', request.url)
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.redirect(
      new URL('/auth/forgot-password?error=server_error', request.url)
    )
  }
}
