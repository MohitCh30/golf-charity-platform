import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SUPPORTED_PROVIDERS = new Set(['google', 'github'])

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const provider = (searchParams.get('provider') || '').toLowerCase()

    if (!SUPPORTED_PROVIDERS.has(provider)) {
      return NextResponse.redirect(new URL('/auth/login?error=oauth_provider_invalid', request.url))
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as 'google' | 'github',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })

    if (error || !data.url) {
      return NextResponse.redirect(new URL('/auth/login?error=oauth_start_failed', request.url))
    }

    return NextResponse.redirect(data.url)
  } catch {
    return NextResponse.redirect(new URL('/auth/login?error=oauth_start_failed', request.url))
  }
}
