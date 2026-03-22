export function runRandomDraw(): number[] {
  const numbers: number[] = []
  while (numbers.length < 5) {
    const num = Math.floor(Math.random() * 45) + 1
    if (!numbers.includes(num)) {
      numbers.push(num)
    }
  }
  return numbers.sort((a, b) => a - b)
}

export async function runAlgorithmicDraw(scoreFrequency: Map<number, number>): Promise<number[]> {
  const numbers: number[] = []
  const weightedPool: number[] = []
  
  for (let i = 1; i <= 45; i++) {
    const count = scoreFrequency.get(i) || 0
    const weight = Math.max(1, count)
    for (let j = 0; j < weight; j++) {
      weightedPool.push(i)
    }
  }
  
  while (numbers.length < 5) {
    if (weightedPool.length === 0) {
      return runRandomDraw()
    }
    const randomIndex = Math.floor(Math.random() * weightedPool.length)
    const num = weightedPool[randomIndex]
    if (!numbers.includes(num)) {
      numbers.push(num)
    }
  }
  
  return numbers.sort((a, b) => a - b)
}

export interface PrizePool {
  fiveMatch: number
  fourMatch: number
  threeMatch: number
  total: number
}

export function calculatePrizePool(
  subscriberCount: number,
  planAmounts: { monthly: number; yearly: number },
  subscriptions: { plan: string; amount_cents: number }[],
  rolloverJackpot: number = 0
): PrizePool {
  let totalPool = 0
  
  for (const sub of subscriptions) {
    totalPool += sub.amount_cents
  }
  
  const poolWithRollover = totalPool + rolloverJackpot
  
  return {
    fiveMatch: Math.round(poolWithRollover * 0.4),
    fourMatch: Math.round(poolWithRollover * 0.35),
    threeMatch: Math.round(poolWithRollover * 0.25),
    total: poolWithRollover
  }
}

export interface DrawEntry {
  user_id: string
  user_scores: number[]
}

export interface Winner {
  user_id: string
  match_type: '5_match' | '4_match' | '3_match'
  matched_count: number
  prize_amount_cents: number
}

export function countMatches(drawNumbers: number[], entryNumbers: number[]): number {
  return drawNumbers.filter(n => entryNumbers.includes(n)).length
}

export function checkWinners(
  drawNumbers: number[],
  entries: DrawEntry[],
  prizePool: PrizePool
): { winners: Winner[]; fiveMatchWinners: number; fourMatchWinners: number; threeMatchWinners: number } {
  const fiveMatchWinners: { user_id: string; prize: number }[] = []
  const fourMatchWinners: { user_id: string; prize: number }[] = []
  const threeMatchWinners: { user_id: string; prize: number }[] = []
  
  for (const entry of entries) {
    const matchedCount = countMatches(drawNumbers, entry.user_scores)
    
    if (matchedCount === 5) {
      fiveMatchWinners.push({ user_id: entry.user_id, prize: 0 })
    } else if (matchedCount === 4) {
      fourMatchWinners.push({ user_id: entry.user_id, prize: 0 })
    } else if (matchedCount === 3) {
      threeMatchWinners.push({ user_id: entry.user_id, prize: 0 })
    }
  }
  
  const fiveMatchPrize = fiveMatchWinners.length > 0 
    ? Math.round(prizePool.fiveMatch / fiveMatchWinners.length) 
    : 0
  const fourMatchPrize = fourMatchWinners.length > 0 
    ? Math.round(prizePool.fourMatch / fourMatchWinners.length) 
    : 0
  const threeMatchPrize = threeMatchWinners.length > 0 
    ? Math.round(prizePool.threeMatch / threeMatchWinners.length) 
    : 0
  
  const winners: Winner[] = [
    ...fiveMatchWinners.map(w => ({
      user_id: w.user_id,
      match_type: '5_match' as const,
      matched_count: 5,
      prize_amount_cents: fiveMatchPrize
    })),
    ...fourMatchWinners.map(w => ({
      user_id: w.user_id,
      match_type: '4_match' as const,
      matched_count: 4,
      prize_amount_cents: fourMatchPrize
    })),
    ...threeMatchWinners.map(w => ({
      user_id: w.user_id,
      match_type: '3_match' as const,
      matched_count: 3,
      prize_amount_cents: threeMatchPrize
    }))
  ]
  
  return {
    winners,
    fiveMatchWinners: fiveMatchWinners.length,
    fourMatchWinners: fourMatchWinners.length,
    threeMatchWinners: threeMatchWinners.length
  }
}

export function rolloverJackpot(
  previousDraw: { fiveMatchPrizeCents?: number; status: string } | null,
  fiveMatchWinners: number
): number {
  if (!previousDraw || fiveMatchWinners > 0) {
    return 0
  }
  return previousDraw.fiveMatchPrizeCents || 0
}
