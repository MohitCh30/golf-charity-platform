import { NextResponse } from 'next/server'
import { createAdminClient, getUser } from '@/lib/supabase/server'
import { runAlgorithmicDraw, calculatePrizePool, checkWinners, countMatches } from '@/lib/draw-engine'

export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await createAdminClient()
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { action, winningNumbers, fiveMatchCount, fourMatchCount, threeMatchCount, fiveMatchPrize, fourMatchPrize, threeMatchPrize } = body

    if (action === 'simulate') {
      const { data: scores } = await supabase.from('scores').select('user_id, score')
      const { data: subscriptions } = await supabase.from('subscriptions').select('user_id, plan, amount_cents, status').eq('status', 'active')
      const { data: allDraws } = await supabase.from('draws').select('five_match_prize_cents, status').eq('status', 'published').order('created_at', { ascending: false }).limit(1)

      const rolloverJackpot = allDraws?.[0]?.five_match_prize_cents || 0
      const scoreFrequency = new Map<number, number>()
      scores?.forEach((s: { score: number }) => {
        scoreFrequency.set(s.score, (scoreFrequency.get(s.score) || 0) + 1)
      })

      const drawNumbers = await runAlgorithmicDraw(scoreFrequency)
      const userScores = new Map<string, number[]>()
      scores?.forEach((s: { user_id: string; score: number }) => {
        if (!userScores.has(s.user_id)) userScores.set(s.user_id, [])
        const list = userScores.get(s.user_id)!
        if (list.length < 5) list.push(s.score)
      })

      const entries = Array.from(userScores.entries()).map(([user_id, user_scores]) => ({ user_id, user_scores }))
      const prizePool = calculatePrizePool(
        subscriptions?.length || 0,
        { monthly: 999, yearly: 9999 },
        subscriptions?.map((s: { amount_cents: number }) => ({ plan: 'monthly', amount_cents: s.amount_cents })) || [],
        rolloverJackpot
      )
      const result = checkWinners(drawNumbers, entries, prizePool)

      return NextResponse.json({
        result: {
          drawNumbers,
          fiveMatchCount: result.fiveMatchWinners,
          fourMatchCount: result.fourMatchWinners,
          threeMatchCount: result.threeMatchWinners,
          fiveMatchPrize: Math.round(prizePool.fiveMatch / Math.max(1, result.fiveMatchWinners)),
          fourMatchPrize: Math.round(prizePool.fourMatch / Math.max(1, result.fourMatchWinners)),
          threeMatchPrize: Math.round(prizePool.threeMatch / Math.max(1, result.threeMatchWinners)),
        }
      })
    }

    if (action === 'publish') {
      const drawDate = new Date().toISOString().split('T')[0]
      const currentMonth = drawDate.slice(0, 7)

      const { data: existingPublishedDraw } = await supabase
        .from('draws')
        .select('id, draw_date')
        .eq('status', 'published')
        .like('draw_date', `${currentMonth}%`)
        .order('draw_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingPublishedDraw) {
        return NextResponse.json(
          { error: 'Draw for this month is already published' },
          { status: 409 }
        )
      }

      const totalPrize = (fiveMatchPrize * fiveMatchCount) + (fourMatchPrize * fourMatchCount) + (threeMatchPrize * threeMatchCount)

      const { data: newDraw, error: insertError } = await supabase
        .from('draws')
        .insert({
          draw_date: drawDate,
            draw_month: drawDate,
          status: 'published',
          winning_numbers: winningNumbers,
          prize_pool_cents: totalPrize,
          five_match_prize_cents: fiveMatchPrize,
          four_match_prize_cents: fourMatchPrize,
          three_match_prize_cents: threeMatchPrize,
          five_match_count: fiveMatchCount,
          four_match_count: fourMatchCount,
          three_match_count: threeMatchCount,
        })
        .select()
        .single()

      if (insertError || !newDraw) {
        console.error('Draw insert error:', insertError)
        return NextResponse.json({ error: 'Failed to create draw' }, { status: 500 })
      }

      const drawId = newDraw.id
      const { data: scores } = await supabase.from('scores').select('user_id, score')
      const userScores = new Map<string, number[]>()
      scores?.forEach((s: { user_id: string; score: number }) => {
        if (!userScores.has(s.user_id)) userScores.set(s.user_id, [])
        const list = userScores.get(s.user_id)!
        if (list.length < 5) list.push(s.score)
      })

      for (const [user_id, user_scores] of userScores.entries()) {
        if (user_scores.length === 0) continue
        const matchedCount = countMatches(winningNumbers, user_scores)
        const isWinner = matchedCount >= 3

        await supabase.from('draw_entries').insert({
          user_id, draw_id: drawId, matched_numbers: matchedCount, status: isWinner ? 'won' : 'entered',
        })

        if (isWinner) {
          const matchType = matchedCount === 5 ? '5_match' : matchedCount === 4 ? '4_match' : '3_match'
          const prizeCents = matchedCount === 5 ? fiveMatchPrize : matchedCount === 4 ? fourMatchPrize : threeMatchPrize
          if (prizeCents > 0) {
            await supabase.from('winners').insert({
              user_id, draw_id: drawId, match_type: matchType,
              prize_amount_cents: prizeCents, verification_status: 'pending', payment_status: 'pending',
            })
          }
        }
      }

      return NextResponse.json({ success: true, drawId })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Draw error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
