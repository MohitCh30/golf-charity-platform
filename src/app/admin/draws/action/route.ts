import { NextResponse } from 'next/server'
import { createAdminClient, getUser } from '@/lib/supabase/server'
import { runRandomDraw, runAlgorithmicDraw, calculatePrizePool, checkWinners, countMatches } from '@/lib/draw-engine'

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
    const { action, winningNumbers, fiveMatchCount, fourMatchCount, threeMatchCount, fiveMatchPrize, fourMatchPrize, threeMatchPrize } = body

    if (action === 'simulate') {
      const { data: scores } = await supabase
        .from('scores')
        .select('user_id, score')

      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('user_id, plan, amount_cents, status')
        .eq('status', 'active')

      const { data: allDraws } = await supabase
        .from('draws')
        .select('five_match_prize_cents, status')
        .eq('status', 'published')
        .order('draw_date', { ascending: false })
        .limit(1)

      const lastDraw = allDraws?.[0]
      const rolloverJackpot = lastDraw?.five_match_prize_cents || 0

      const scoreFrequency = new Map<number, number>()
      scores?.forEach((s: { score: number }) => {
        const count = scoreFrequency.get(s.score) || 0
        scoreFrequency.set(s.score, count + 1)
      })

      const drawNumbers = await runAlgorithmicDraw(scoreFrequency)

      const userScores = new Map<string, number[]>()
      scores?.forEach((s: { user_id: string; score: number }) => {
        if (!userScores.has(s.user_id)) {
          userScores.set(s.user_id, [])
        }
        const scores = userScores.get(s.user_id)!
        if (scores.length < 5) {
          scores.push(s.score)
        }
      })

      const entries = Array.from(userScores.entries()).map(([user_id, user_scores]) => ({
        user_id,
        user_scores
      }))

      const prizePool = calculatePrizePool(
        subscriptions?.length || 0,
        { monthly: 999, yearly: 9999 },
        subscriptions?.map((s: { amount_cents: number }) => ({ plan: 'monthly', amount_cents: s.amount_cents })) || [],
        rolloverJackpot
      )

      const result = checkWinners(drawNumbers, entries, prizePool)

      const { data: winners } = await supabase
        .from('winners')
        .select('id')
        .limit(1)

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
      const currentMonth = new Date().toISOString().slice(0, 7)
      
      const { data: existingDraw } = await supabase
        .from('draws')
        .select('id')
        .like('draw_date', `${currentMonth}%`)
        .single()

      const drawDate = new Date().toISOString().split('T')[0]
      const totalPrize = (fiveMatchPrize * fiveMatchCount) + (fourMatchPrize * fourMatchCount) + (threeMatchPrize * threeMatchCount)

      let drawId = existingDraw?.id

      if (existingDraw) {
        await supabase
          .from('draws')
          .update({
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
          .eq('id', existingDraw.id)
      } else {
        const { data: newDraw } = await supabase
          .from('draws')
          .insert({
            draw_date: drawDate,
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
        
        drawId = newDraw?.id
      }

      const { data: scores } = await supabase
        .from('scores')
        .select('user_id, score')

      const userScores = new Map<string, number[]>()
      scores?.forEach((s: { user_id: string; score: number }) => {
        if (!userScores.has(s.user_id)) {
          userScores.set(s.user_id, [])
        }
        const scores = userScores.get(s.user_id)!
        if (scores.length < 5) {
          scores.push(s.score)
        }
      })

      for (const [user_id, user_scores] of userScores.entries()) {
        if (user_scores.length === 0) continue

        const matchedCount = countMatches(winningNumbers, user_scores)
        if (matchedCount < 3) continue

        let prizeCents = 0
        let matchType = ''

        if (matchedCount === 5) {
          prizeCents = fiveMatchPrize
          matchType = '5_match'
        } else if (matchedCount === 4) {
          prizeCents = fourMatchPrize
          matchType = '4_match'
        } else if (matchedCount === 3) {
          prizeCents = threeMatchPrize
          matchType = '3_match'
        }

        if (prizeCents > 0) {
          await supabase
            .from('winners')
            .insert({
              user_id,
              draw_id: drawId,
              match_type: matchType,
              prize_amount_cents: prizeCents,
              verification_status: 'pending',
              payment_status: 'pending',
            })

          await supabase
            .from('draw_entries')
            .insert({
              user_id,
              draw_id: drawId,
              matched_numbers: matchedCount,
              status: 'won',
            })
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
