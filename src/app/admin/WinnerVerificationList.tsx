'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Winner {
  id: string
  user_id: string
  match_type: string
  prize_amount_cents: number
  verification_status: string
}

function formatCurrency(cents: number) {
  return `₹${(cents / 100).toFixed(2)}`
}

export function WinnerVerificationList({ winners }: { winners: Winner[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleAction = async (winnerId: string, action: 'approve' | 'reject') => {
    setLoading(winnerId)
    setError('')

    try {
      const response = await fetch('/admin/winners/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId, action }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        setError(data.error || 'Failed to update winner')
        return
      }

      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  if (winners.length === 0) {
    return <p className="text-center text-slate-500 py-8">No pending verifications</p>
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}
      {winners.map((winner) => (
        <div key={winner.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
          <div>
            <p className="font-medium text-white">
              {winner.match_type === '5_match' ? '5 Numbers' :
               winner.match_type === '4_match' ? '4 Numbers' : '3 Numbers'}
            </p>
            <p className="text-sm text-amber-400">{formatCurrency(winner.prize_amount_cents)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
              Pending
            </Badge>
            <Button
              size="sm"
              onClick={() => handleAction(winner.id, 'approve')}
              disabled={loading === winner.id}
              className="bg-amber-500 hover:bg-amber-400 text-slate-900 h-7 px-3 text-xs"
            >
              {loading === winner.id ? '...' : 'Approve'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction(winner.id, 'reject')}
              disabled={loading === winner.id}
              className="border-red-600 text-red-400 hover:bg-red-900/20 h-7 px-3 text-xs"
            >
              {loading === winner.id ? '...' : 'Reject'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
