'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function WelcomePage() {
  const router = useRouter()
  const [sessionData, setSessionData] = useState<{
    email?: string
    name?: string
    charityName?: string
    plan?: string
    contributionPercent?: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const data = {
      email: params.get('email') || undefined,
      name: params.get('name') || undefined,
      charityName: params.get('charity') || undefined,
      plan: params.get('plan') || undefined,
      contributionPercent: parseInt(params.get('contribution') || '10'),
    }
    setSessionData(data)
    setLoading(false)
  }, [])

  const formatAmount = (cents: number) => `₹${(cents / 100).toFixed(2)}`
  const planAmount = sessionData?.plan === 'yearly' ? 9999 : 999
  const planLabel = sessionData?.plan === 'yearly' ? 'Yearly' : 'Monthly'
  const planPeriod = sessionData?.plan === 'yearly' ? '/year' : '/month'
  const contributionAmount = Math.round(planAmount * (sessionData?.contributionPercent || 10) / 100)

  if (loading) {
    return (
      <Card className="bg-white/95 backdrop-blur border-slate-200 shadow-2xl">
        <CardContent className="py-12 text-center">
          <p className="text-slate-600">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/95 backdrop-blur border-slate-200 shadow-2xl">
      <CardHeader className="text-center pb-2">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <CardTitle className="text-2xl font-bold text-slate-900">Welcome to GolfGive!</CardTitle>
        <p className="text-slate-500 text-sm mt-1">Your account is ready. Let's start playing.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-slate-50 rounded-lg space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Account</span>
            <span className="font-medium text-slate-900">{sessionData?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Email</span>
            <span className="font-medium text-slate-900">{sessionData?.email}</span>
          </div>
          {sessionData?.charityName && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Supporting</span>
              <span className="font-medium text-slate-900">{sessionData.charityName}</span>
            </div>
          )}
        </div>
        <div className="border-t border-slate-200 pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Plan</span>
            <span className="font-semibold text-slate-900">{planLabel}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Amount</span>
            <span className="font-semibold text-slate-900">{formatAmount(planAmount)}{planPeriod}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Contribution</span>
            <span className="font-semibold text-amber-600">{sessionData?.contributionPercent || 10}%</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <span className="text-slate-600">To Charity</span>
            <span className="font-bold text-amber-600">{formatAmount(contributionAmount)}/mo</span>
          </div>
        </div>
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
          <div className="flex items-center gap-2 text-amber-700 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Your subscription is active. Start entering scores!</span>
          </div>
        </div>
        <Button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 h-12 text-base font-medium"
        >
          Go to My Dashboard
        </Button>
      </CardContent>
    </Card>
  )
}