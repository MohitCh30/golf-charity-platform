import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: scores, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.id)
      .order('played_date', { ascending: false })
      .limit(5)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 })
    }

    return NextResponse.json({ scores: scores || [] })
  } catch (error) {
    console.error('Scores fetch error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
