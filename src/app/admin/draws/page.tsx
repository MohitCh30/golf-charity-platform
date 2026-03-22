'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Draw {
  id: string
  draw_date: string
  status: string
  winning_numbers: number[] | null
  prize_pool_cents: number | null
  created_at: string
}

interface DrawResult {
  drawNumbers: number[]
  fiveMatchCount: number
  fourMatchCount: number
  threeMatchCount: number
  fiveMatchPrize: number
  fourMatchPrize: number
  threeMatchPrize: number
}

function formatCurrency(cents: number) {
  return `₹${(cents / 100).toFixed(2)}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export default function AdminDrawsPage() {
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [simulationResult, setSimulationResult] = useState<DrawResult | null>(null)
  const [currentDraw, setCurrentDraw] = useState<Draw | null>(null)

  useEffect(() => {
    fetchDraws()
  }, [])

  const fetchDraws = async () => {
    try {
      const response = await fetch('/admin/draws/data')
      if (response.ok) {
        const data = await response.json()
        setDraws(data.draws || [])
        setCurrentDraw(data.currentDraw || null)
      }
    } catch (err) {
      console.error('Failed to fetch draws:', err)
    } finally {
      setLoading(false)
    }
  }

  const runSimulation = async () => {
    setRunning(true)
    setSimulationResult(null)

    try {
      const response = await fetch('/admin/draws/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'simulate' }),
      })

      if (response.ok) {
        const data = await response.json()
        setSimulationResult(data.result)
      }
    } catch (err) {
      console.error('Failed to run simulation:', err)
    } finally {
      setRunning(false)
    }
  }

  const publishDraw = async () => {
    if (!simulationResult) return

    setRunning(true)

    try {
      const response = await fetch('/admin/draws/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'publish',
          winningNumbers: simulationResult.drawNumbers,
          fiveMatchCount: simulationResult.fiveMatchCount,
          fourMatchCount: simulationResult.fourMatchCount,
          threeMatchCount: simulationResult.threeMatchCount,
          fiveMatchPrize: simulationResult.fiveMatchPrize,
          fourMatchPrize: simulationResult.fourMatchPrize,
          threeMatchPrize: simulationResult.threeMatchPrize,
        }),
      })

      if (response.ok) {
        setSimulationResult(null)
        await fetchDraws()
      }
    } catch (err) {
      console.error('Failed to publish draw:', err)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Draw Management</h1>
          <p className="text-slate-400 mt-1">Run simulations and publish results</p>
        </div>
        <Link href="/admin">
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Current Draw</CardTitle>
          <CardDescription>
            {currentDraw ? `Draw for ${formatDate(currentDraw.draw_date)}` : 'Create a new draw'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentDraw && currentDraw.status === 'draft' && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-amber-400 font-medium">Draft Status</p>
              <p className="text-slate-400 text-sm mt-1">Run a simulation to see potential results before publishing.</p>
            </div>
          )}

          {simulationResult && (
            <div className="p-6 bg-slate-900 rounded-lg border border-amber-500/30 space-y-4">
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-2">Winning Numbers</p>
                <div className="flex justify-center gap-2">
                  {simulationResult.drawNumbers.map((num, i) => (
                    <div key={i} className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center">
                      <span className="text-xl font-bold text-slate-900">{num}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-slate-800 rounded-lg">
                  <p className="text-2xl font-bold text-amber-400">{simulationResult.fiveMatchCount}</p>
                  <p className="text-sm text-slate-400">5 Match Winners</p>
                  <p className="text-amber-400 font-medium">{formatCurrency(simulationResult.fiveMatchPrize)}</p>
                </div>
                <div className="p-3 bg-slate-800 rounded-lg">
                  <p className="text-2xl font-bold text-white">{simulationResult.fourMatchCount}</p>
                  <p className="text-sm text-slate-400">4 Match Winners</p>
                  <p className="text-slate-300 font-medium">{formatCurrency(simulationResult.fourMatchPrize)}</p>
                </div>
                <div className="p-3 bg-slate-800 rounded-lg">
                  <p className="text-2xl font-bold text-white">{simulationResult.threeMatchCount}</p>
                  <p className="text-sm text-slate-400">3 Match Winners</p>
                  <p className="text-slate-300 font-medium">{formatCurrency(simulationResult.threeMatchPrize)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              onClick={runSimulation}
              disabled={running}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900"
            >
              {running ? 'Running...' : 'Run Simulation'}
            </Button>
            {simulationResult && (
              <Button
                onClick={publishDraw}
                disabled={running}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white"
              >
                {running ? 'Publishing...' : 'Publish Results'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Draw History</CardTitle>
          <CardDescription>Previous draw results</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-400">Loading...</p>
          ) : draws.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No draws yet</p>
          ) : (
            <div className="space-y-3">
              {draws.map((draw) => (
                <div key={draw.id} className="flex items-center justify-between p-4 bg-slate-900 rounded-lg">
                  <div>
                    <p className="font-medium text-white">{formatDate(draw.draw_date)}</p>
                    {draw.winning_numbers && draw.winning_numbers.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {draw.winning_numbers.map((num, i) => (
                          <span key={i} className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center">
                            {num}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      draw.status === 'published' ? 'bg-green-500/20 text-green-400' :
                      draw.status === 'simulation' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-slate-700 text-slate-400'
                    }
                  >
                    {draw.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
