import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; upgraded?: string }>
}) {
  const user = await getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const params = await searchParams
  const hasError = params.error === 'invalid_plan' || params.error === 'subscription_failed' || params.error === 'server_error'
  const alreadySubscribed = params.error === 'already_subscribed'
  const wasUpgraded = params.upgraded === 'true'

  if (wasUpgraded) {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Choose Your Plan</CardTitle>
          <CardDescription>
            Unlock all features and start winning prizes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {alreadySubscribed && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-700 font-medium">You already have an active subscription</p>
              <p className="text-sm text-amber-600 mt-1">Visit your dashboard to manage your account.</p>
            </div>
          )}

          {hasError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {params.error === 'invalid_plan' && 'Invalid plan selected'}
              {params.error === 'subscription_failed' && 'Failed to create subscription. Please try again.'}
              {params.error === 'server_error' && 'Something went wrong. Please try again.'}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <form action="/dashboard/upgrade/action" method="POST">
              <input type="hidden" name="plan" value="monthly" />
              <div className="p-6 bg-amber-50 rounded-lg border-2 border-amber-200 hover:border-amber-400 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Monthly</h3>
                  <span className="text-xs font-medium bg-amber-500 text-slate-900 px-2 py-1 rounded">Popular</span>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-2">₹9.99<span className="text-sm font-normal text-slate-500">/month</span></p>
                <p className="text-sm text-slate-600 mb-4">Billed monthly, cancel anytime</p>
                <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 h-11 font-medium">
                  Choose Monthly
                </Button>
              </div>
            </form>

            <form action="/dashboard/upgrade/action" method="POST">
              <input type="hidden" name="plan" value="yearly" />
              <div className="p-6 bg-slate-50 rounded-lg border-2 border-slate-200 hover:border-slate-300 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Yearly</h3>
                  <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded">Save 17%</span>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-2">₹99.99<span className="text-sm font-normal text-slate-500">/year</span></p>
                <p className="text-sm text-slate-600 mb-4">Billed annually, best value</p>
                <Button type="submit" variant="outline" className="w-full h-11 font-medium">
                  Choose Yearly
                </Button>
              </div>
            </form>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-medium text-slate-900 mb-3">What you get:</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Enter your golf scores (Stableford format)
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Participate in monthly prize draws
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Support charity with every subscription
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Win up to 40% of the prize pool
              </li>
            </ul>
          </div>

          <p className="text-center text-sm text-slate-500 pt-4">
            <a href="/dashboard" className="text-amber-600 hover:text-amber-700 font-medium">
              Back to Dashboard
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
