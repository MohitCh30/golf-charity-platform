import { getCharities, getSignupSession } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PasswordInput } from '@/components/ui/password-input'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; error?: string }>
}) {
  const params = await searchParams
  const step = parseInt(params.step || '1')
  const error = params.error
  const session = step > 1 ? await getSignupSession() : null
   
  if (step > 1 && !session) {
    redirect('/auth/signup?step=1')
  }

  const charities = await getCharities()

  if (step === 1) {
    return (
      <Card className="bg-white/95 backdrop-blur border-slate-200 shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-slate-900">Create your account</CardTitle>
          <CardDescription>
            Join thousands of golfers supporting causes they care about
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error === 'missing_fields' && 'Please fill in all fields'}
              {error === 'server_error' && 'Something went wrong. Please try again.'}
            </div>
          )}
          <form action="/auth/steps/step1" method="POST" className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium text-slate-700">
                Your name
              </label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Alex Thompson"
                autoComplete="name"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="alex@example.com"
                autoComplete="email"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="Create a secure password"
                autoComplete="new-password"
                minLength={6}
                required
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 text-base font-medium">
              Continue
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-slate-600">Already a member? </span>
            <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 2) {
    const featuredCharity = charities.find(c => c.is_featured)
    return (
      <Card className="bg-white/95 backdrop-blur border-slate-200 shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-slate-900">Choose your cause</CardTitle>
          <CardDescription>
            Select a charity that resonates with you
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error === 'select_charity' && 'Please select a charity'}
              {error === 'server_error' && 'Something went wrong. Please try again.'}
            </div>
          )}
          <form action="/auth/steps/step2" method="POST" className="space-y-3">
            {charities.map((charity) => (
              <label
                key={charity.id}
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  session?.charityId === charity.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                }`}
              >
                <input
                  type="radio"
                  name="charityId"
                  value={charity.id}
                  defaultChecked={session?.charityId === charity.id}
                  className="mt-1 text-emerald-600"
                  required
                />
                <div className="flex-1 text-left">
                  <div className="font-medium text-slate-900">{charity.name}</div>
                  <div className="text-sm text-slate-600 mt-1">{charity.mission}</div>
                </div>
              </label>
            ))}
            <div className="pt-2">
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 text-base font-medium">
                Continue
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center">
            <Link href="/auth/signup?step=1" className="text-sm text-slate-500 hover:text-slate-700">
              ← Back to account details
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 3) {
    if (!session?.email) {
      redirect('/auth/signup?step=1')
    }
    const charity = charities.find(c => c.id === session?.charityId)
    return (
      <Card className="bg-white/95 backdrop-blur border-slate-200 shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-slate-900">Confirm your subscription</CardTitle>
          <CardDescription>
            Review your choices and start your journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error === 'signup_failed' && 'Failed to create account. Please try again.'}
              {error === 'subscription_failed' && 'Failed to create subscription. Please try again.'}
              {error === 'server_error' && 'Something went wrong. Please try again.'}
            </div>
          )}
          
          <div className="mb-6 space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Account</span>
                <span className="font-medium text-slate-900">{session?.email}</span>
              </div>
              {charity && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Supporting</span>
                  <span className="font-medium text-slate-900">{charity.name}</span>
                </div>
              )}
            </div>
          </div>

          <form action="/auth/steps/step3" method="POST" className="space-y-4">
            <input type="hidden" name="charityId" value={session?.charityId || ''} />
            <input type="hidden" name="contributionPercent" value="10" />
            
            <div className="space-y-3">
              <label className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                session?.plan === 'monthly' || !session?.plan 
                  ? 'border-emerald-500 bg-emerald-50' 
                  : 'border-slate-200 hover:border-emerald-300'
              }`}>
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="plan" 
                    value="monthly" 
                    defaultChecked={session?.plan === 'monthly' || !session?.plan} 
                    className="text-emerald-600"
                  />
                  <div className="text-left">
                    <div className="font-medium text-slate-900">Monthly</div>
                    <div className="text-sm text-slate-600">₹9.99/month</div>
                  </div>
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                  Popular
                </span>
              </label>
              
              <label className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                session?.plan === 'yearly' 
                  ? 'border-emerald-500 bg-emerald-50' 
                  : 'border-slate-200 hover:border-emerald-300'
              }`}>
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="plan" 
                    value="yearly" 
                    defaultChecked={session?.plan === 'yearly'} 
                    className="text-emerald-600"
                  />
                  <div className="text-left">
                    <div className="font-medium text-slate-900">Yearly</div>
                    <div className="text-sm text-slate-600">₹99.99/year</div>
                  </div>
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                  Save 17%
                </span>
              </label>
            </div>
            
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-sm font-medium">10% goes to {charity?.name || 'your chosen charity'}</span>
              </div>
            </div>
            
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base font-medium">
              Complete Signup
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Link href="/auth/signup?step=2" className="text-sm text-slate-500 hover:text-slate-700">
              ← Choose a different charity
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  redirect('/auth/signup?step=1')
}
