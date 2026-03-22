import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const params = await searchParams
  const hasError = params.error === 'send_failed' || params.error === 'server_error' || params.error === 'missing_email'
  const hasSuccess = params.success === 'true'

  return (
    <Card className="bg-white/95 backdrop-blur border-slate-200 shadow-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-slate-900">Reset password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Check your email</span>
            </div>
            <p className="text-sm text-green-600 mt-2">We sent a password reset link to your email address.</p>
          </div>
        )}

        {hasError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {params.error === 'missing_email' && 'Please enter your email address'}
            {(params.error === 'send_failed' || params.error === 'server_error') && 'Failed to send reset email. Please try again.'}
          </div>
        )}

        <form action="/auth/forgot-password/action" method="POST" className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="h-11"
            />
          </div>
          <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 h-11 text-base font-medium">
            Send Reset Link
          </Button>
        </form>
        <div className="mt-6 text-center">
          <Link href="/auth/login" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
            Back to sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
