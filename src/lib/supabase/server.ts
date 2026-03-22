import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component
          }
        },
      },
    }
  )
}

export async function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    }
  )
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, subscriptions(*)')
    .eq('id', user.id)
    .single()

  return profile
}

export async function getActiveSubscription(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('end_date', new Date().toISOString().split('T')[0])
    .single()
  
  return data
}

export async function isAdmin(userId: string) {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  
  return profile?.role === 'admin'
}

export async function getUserScores(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', userId)
    .order('played_date', { ascending: false })
    .limit(5)
  return data || []
}

export async function getUserCharity(userId: string) {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('charity_id, charity_contribution_percent')
    .eq('id', userId)
    .single()
  
  if (!profile?.charity_id) return null
  
  const { data: charity } = await supabase
    .from('charities')
    .select('*')
    .eq('id', profile.charity_id)
    .single()
  
  return {
    charity,
    contributionPercent: profile.charity_contribution_percent || 10
  }
}

export async function getUserDrawEntries(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('draw_entries')
    .select(`
      *,
      draws:draw_id(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function getUserWinnings(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('winners')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function getFeaturedCharities() {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('charities')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .limit(3)
  return data || []
}