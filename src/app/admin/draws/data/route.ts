import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createAdminClient()

    const { data: draws } = await supabase
      .from('draws')
      .select('*')
      .order('draw_date', { ascending: false })
      .limit(20)

    const currentMonth = new Date().toISOString().slice(0, 7)
    const { data: currentDraw } = await supabase
      .from('draws')
      .select('*')
      .like('draw_date', `${currentMonth}%`)
      .order('draw_date', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      draws: draws || [],
      currentDraw: currentDraw || null
    })
  } catch (error) {
    console.error('Draws fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch draws' }, { status: 500 })
  }
}
