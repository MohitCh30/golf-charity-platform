import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const charityId = formData.get('charityId') as string

    if (!charityId) {
      return NextResponse.redirect(
        new URL('/auth/signup?step=2&error=select_charity', request.url)
      )
    }

    const cookieStore = await cookies()
    const encrypted = cookieStore.get('signup_session')?.value

    if (!encrypted) {
      return NextResponse.redirect(new URL('/auth/signup?step=1', request.url))
    }

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
      return NextResponse.redirect(new URL('/auth/signup?step=1', request.url))
    }

    return NextResponse.redirect(new URL('/auth/signup?step=3', request.url))
  } catch (error) {
    console.error('Step 2 error:', error)
    return NextResponse.redirect(
      new URL('/auth/signup?step=2&error=server_error', request.url)
    )
  }
}
