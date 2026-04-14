import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser, getActiveSubscription } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function SubscribePage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const subscription = await getActiveSubscription(user.id)
  
  if (subscription) {
    redirect('/dashboard')
  }
  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join GolfGive</CardTitle>
          <CardDescription>
            Unlock your full experience or explore first
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/dashboard/upgrade" className="block">
              <div className="p-6 bg-amber-50 rounded-lg border-2 border-amber-200 hover:border-amber-400 transition-all h-full">
                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Choose a Plan</h3>
                <p className="text-sm text-slate-600">Subscribe monthly or yearly. Start entering scores and winning prizes.</p>
                <p className="text-lg font-bold text-amber-600 mt-4">From ₹9.99/month</p>
              </div>
            </Link>
            
            <Link href="/dashboard" className="block">
              <div className="p-6 bg-slate-50 rounded-lg border-2 border-slate-200 hover:border-slate-300 transition-all h-full">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Explore First</h3>
                <p className="text-sm text-slate-600">Browse charities, learn how draws work, and see the platform in action.</p>
                <p className="text-sm text-slate-500 mt-4">Free access</p>
              </div>
            </Link>
          </div>
          
          <div className="text-center pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Already subscribed?{' '}
              <Link href="/dashboard" className="text-amber-600 hover:text-amber-700 font-medium">
                Go to Dashboard
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
