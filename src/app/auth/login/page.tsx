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
  const hasError =
    params.error === 'invalid_credentials' ||
    params.error === 'missing_fields' ||
    params.error === 'server_error' ||
    params.error === 'oauth_start_failed' ||
    params.error === 'oauth_provider_invalid' ||
    params.error === 'callback_failed'

  const errorMessage =
    params.error === 'oauth_start_failed' || params.error === 'oauth_provider_invalid'
      ? 'Unable to start OAuth sign in. Please try another method.'
      : params.error === 'callback_failed'
        ? 'OAuth sign in could not be completed. Please try again.'
        : 'Invalid email or password'

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
              {errorMessage}
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href="/auth/login/oauth?provider=google"
              className="inline-flex items-center justify-center h-11 rounded-md border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Continue with Google
            </a>
            <a
              href="/auth/login/oauth?provider=github"
              className="inline-flex items-center justify-center h-11 rounded-md border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Continue with GitHub
            </a>
          </div>
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
