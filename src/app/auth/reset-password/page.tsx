'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  return (
    <Card className="bg-white/95 backdrop-blur border-slate-200 shadow-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-slate-900">Set new password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              New password
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm" className="text-sm font-medium text-slate-700">
              Confirm password
            </label>
            <PasswordInput
              id="confirm"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 h-11 text-base font-medium"
          >
            {loading ? 'Updating...' : 'Update password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
