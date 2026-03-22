import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PasswordInput } from '@/components/ui/password-input'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const hasError = params.error === 'invalid_credentials' || params.error === 'missing_fields' || params.error === 'server_error'

  return (
    <Card className="bg-white/95 backdrop-blur border-slate-200 shadow-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-slate-900">Sign in</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action="/auth/login/action" method="POST" className="space-y-4">
          {hasError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              Invalid email or password
            </div>
          )}
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <Link href="/auth/forgot-password" className="text-xs text-amber-600 hover:text-amber-700 font-medium">
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              required
              className="h-11"
            />
          </div>
          <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 h-11 text-base font-medium">
            Sign In
          </Button>
        </form>
        <div className="mt-6 text-center text-sm">
          <span className="text-slate-600">Don&apos;t have an account? </span>
          <Link href="/auth/signup" className="text-amber-600 hover:text-amber-700 font-medium">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
