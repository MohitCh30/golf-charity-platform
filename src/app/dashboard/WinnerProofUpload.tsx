'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

type WinningEntry = {
  id: string
  match_type: string
  prize_amount_cents: number
  payment_status: string
  verification_status: string
  draw_date?: string
  proof_url?: string | null
}

interface WinnerProofUploadProps {
  winnings: WinningEntry[]
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

export function WinnerProofUpload({ winnings }: WinnerProofUploadProps) {
  const [uploading, setUploading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const pendingProof = winnings.filter(
    w => w.payment_status === 'pending' && !w.proof_url
  )

  const handleUpload = async (winnerId: string, file: File) => {
    setUploading(winnerId)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('winnerId', winnerId)
      formData.append('proof', file)

      const response = await fetch('/dashboard/winners/action', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Proof uploaded successfully!' })
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setMessage({ type: 'error', text: result.error || 'Upload failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Upload failed. Please try again.' })
    } finally {
      setUploading(null)
    }
  }

  if (pendingProof.length === 0) {
    return null
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <AlertCircle className="w-5 h-5" />
          Proof of Win Required
        </CardTitle>
        <CardDescription className="text-amber-700">
          Upload proof of your winning score to receive your prize
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingProof.map((win) => (
          <div key={win.id} className="p-4 bg-white rounded-lg border border-amber-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-900">
                    {win.match_type === '5_match' ? '5 Numbers (Jackpot!)' :
                     win.match_type === '4_match' ? '4 Numbers' : '3 Numbers'}
                  </span>
                  <Badge variant="outline" className="border-amber-500 text-amber-600">
                    Pending
                  </Badge>
                </div>
                <p className="text-lg font-bold text-amber-600 mb-1">
                  {formatCurrency(win.prize_amount_cents)}
                </p>
                {win.draw_date && (
                  <p className="text-sm text-slate-500">
                    Draw date: {formatDate(win.draw_date)}
                  </p>
                )}
              </div>
              <div className="w-32">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(win.id, file)
                    }}
                    disabled={uploading === win.id}
                  />
                  <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg font-medium transition-colors disabled:opacity-50">
                    {uploading === win.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Proof
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>
        ))}

        {message && (
          <div className={`p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {message.text}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
