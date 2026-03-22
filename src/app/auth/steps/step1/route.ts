import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const name = formData.get('fullName') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!name || !email || !password) {
      return NextResponse.redirect(
        new URL('/auth/signup?step=1&error=missing_fields', request.url)
      )
    }

    const cookieStore = await cookies()
    const sessionData = Buffer.from(JSON.stringify({ name, email, password })).toString('base64')
    cookieStore.set('signup_session', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    })

    return NextResponse.redirect(new URL('/auth/signup?step=2', request.url))
  } catch (error) {
    console.error('Step 1 error:', error)
    return NextResponse.redirect(
      new URL('/auth/signup?step=1&error=server_error', request.url)
    )
  }
}
