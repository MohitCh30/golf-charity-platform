import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const score = parseInt(formData.get('score') as string)
    const playedDate = formData.get('playedDate') as string
    const action = formData.get('action') as string
    const scoreId = formData.get('scoreId') as string

    if (action === 'delete' && scoreId) {
      const { error } = await supabase
        .from('scores')
        .delete()
        .eq('id', scoreId)
        .eq('user_id', user.id)

      if (error) {
        return NextResponse.json({ error: 'Failed to delete score' }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'edit' && scoreId) {
      if (isNaN(score) || score < 1 || score > 45) {
        return NextResponse.json({ error: 'Score must be between 1 and 45' }, { status: 400 })
      }
      if (!playedDate) {
        return NextResponse.json({ error: 'Date is required' }, { status: 400 })
      }

      const { error } = await supabase
        .from('scores')
        .update({ score, played_date: playedDate })
        .eq('id', scoreId)
        .eq('user_id', user.id)

      if (error) {
        return NextResponse.json({ error: 'Failed to update score' }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    if (isNaN(score) || score < 1 || score > 45) {
      return NextResponse.json({ error: 'Score must be between 1 and 45' }, { status: 400 })
    }

    if (!playedDate) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    const { data: existingScores, error: fetchError } = await supabase
      .from('scores')
      .select('id, played_date')
      .eq('user_id', user.id)
      .order('played_date', { ascending: false })

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 })
    }

    if (existingScores && existingScores.length >= 5) {
      const { error: deleteError } = await supabase
        .from('scores')
        .delete()
        .eq('id', existingScores[existingScores.length - 1].id)

      if (deleteError) {
        return NextResponse.json({ error: 'Failed to replace oldest score' }, { status: 500 })
      }
    }

    const { error: insertError } = await supabase
      .from('scores')
      .insert({
        user_id: user.id,
        score,
        played_date: playedDate,
      })

    if (insertError) {
      return NextResponse.json({ error: 'Failed to add score' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Score error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
