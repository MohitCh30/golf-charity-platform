import { NextResponse } from 'next/server'
import { createAdminClient, getUser } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createAdminClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { winnerId, action } = body

    if (!winnerId || !action) {
      return NextResponse.json({ error: 'Missing winnerId or action' }, { status: 400 })
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const newStatus = action === 'approve' ? 'verified' : 'rejected'

    const { error } = await supabase
      .from('winners')
      .update({ verification_status: newStatus })
      .eq('id', winnerId)

    if (error) {
      console.error('Winner update error:', error)
      return NextResponse.json({ error: 'Failed to update winner' }, { status: 500 })
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error) {
    console.error('Winner action error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
