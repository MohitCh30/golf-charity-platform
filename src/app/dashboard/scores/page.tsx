'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Score {
  id: string
  score: number
  played_date: string
  created_at: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export default function ScoresPage() {
  const router = useRouter()
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editScore, setEditScore] = useState('')
  const [editDate, setEditDate] = useState('')

  useEffect(() => {
    fetchScores()
  }, [])

  const fetchScores = async () => {
    try {
      const response = await fetch('/dashboard/scores/data')
      if (response.ok) {
        const data = await response.json()
        setScores(data.scores || [])
      }
    } catch (err) {
      console.error('Failed to fetch scores:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    formData.append('action', 'add')

    try {
      const response = await fetch('/dashboard/scores/action', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setSubmitting(false)
        return
      }

      await fetchScores()
      ;(e.target as HTMLFormElement).reset()
    } catch (err) {
      setError('Failed to add score')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingId) return

    setSubmitting(true)
    setError('')

    const formData = new FormData()
    formData.append('action', 'edit')
    formData.append('scoreId', editingId)
    formData.append('score', editScore)
    formData.append('playedDate', editDate)

    try {
      const response = await fetch('/dashboard/scores/action', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setSubmitting(false)
        return
      }

      setEditingId(null)
      await fetchScores()
    } catch (err) {
      setError('Failed to update score')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (scoreId: string) => {
    if (!confirm('Delete this score?')) return

    const formData = new FormData()
    formData.append('action', 'delete')
    formData.append('scoreId', scoreId)

    try {
      const response = await fetch('/dashboard/scores/action', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        return
      }

      await fetchScores()
    } catch (err) {
      setError('Failed to delete score')
    }
  }

  const startEdit = (score: Score) => {
    setEditingId(score.id)
    setEditScore(String(score.score))
    setEditDate(score.played_date)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditScore('')
    setEditDate('')
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Scores</h1>
          <p className="text-slate-600 mt-1">Track your last 5 golf scores in Stableford format</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Add New Score</CardTitle>
            <CardDescription>Enter your latest round</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="score" className="text-sm font-medium text-slate-700">
                  Score (Stableford points)
                </label>
                <Input
                  id="score"
                  name="score"
                  type="number"
                  min="1"
                  max="45"
                  placeholder="1-45"
                  required
                  className="h-11"
                />
                <p className="text-xs text-slate-500">Enter a number between 1 and 45</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="playedDate" className="text-sm font-medium text-slate-700">
                  Date Played
                </label>
                <Input
                  id="playedDate"
                  name="playedDate"
                  type="date"
                  max={today}
                  required
                  className="h-11"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 h-11 text-base font-medium"
              >
                {submitting ? 'Adding...' : 'Add Score'}
              </Button>
              {scores.length >= 5 && (
                <p className="text-xs text-amber-600 text-center">
                  Adding a new score will replace your oldest score
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Scores</CardTitle>
            <CardDescription>Latest 5 rounds</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-500">Loading...</p>
            ) : scores.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-slate-600">No scores recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scores.map((score, index) => (
                  <div key={score.id}>
                    {editingId === score.id ? (
                      <form onSubmit={handleEdit} className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-slate-600">Score</label>
                            <Input
                              type="number"
                              min="1"
                              max="45"
                              value={editScore}
                              onChange={(e) => setEditScore(e.target.value)}
                              required
                              className="h-9"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-600">Date</label>
                            <Input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              max={today}
                              required
                              className="h-9"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" disabled={submitting} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                            Save
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {score.score}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{score.score} points</p>
                            <p className="text-sm text-slate-500">{formatDate(score.played_date)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {index === 0 && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                              Latest
                            </span>
                          )}
                          <button
                            onClick={() => startEdit(score)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(score.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
