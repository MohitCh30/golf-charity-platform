import { getUser, getUserProfile, getUserScores, getUserCharity, getUserDrawEntries, getUserWinnings, getActiveSubscription, getFeaturedCharities } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatCurrency(cents: number) {
  return `₹${(cents / 100).toFixed(2)}`
}

function LockIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-6 h-6 text-slate-400 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function RestrictedSection({ children, isLocked = true }: { children: React.ReactNode; isLocked?: boolean }) {
  if (isLocked) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center min-h-[200px]">
          <LockIcon className="w-10 h-10 text-slate-400 mb-3" />
          <p className="text-slate-600 font-medium">Subscribe to unlock</p>
          <Link href="/dashboard/subscribe" className="mt-3">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-900">
              Get Started
            </Button>
          </Link>
        </div>
        <div className="opacity-30 pointer-events-none">{children}</div>
      </Card>
    )
  }
  return <>{children}</>
}

export default async function DashboardPage() {
  const user = await getUser()
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-600">Loading...</p>
      </div>
    )
  }
  
  const [profile, activeSubscription, featuredCharities] = await Promise.all([
    getUserProfile(),
    getActiveSubscription(user.id),
    getFeaturedCharities()
  ])
  
  const isSubscribed = activeSubscription && new Date(activeSubscription.end_date) >= new Date()
  
  const totalWinnings = isSubscribed ? 
    (await getUserWinnings(user.id)).reduce((sum: number, w: { prize_amount_cents: number }) => sum + w.prize_amount_cents, 0) : 0

  if (!isSubscribed) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-6 text-slate-900">
          <h1 className="text-2xl font-bold">Welcome{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!</h1>
          <p className="text-amber-100 mt-1">Subscribe to unlock all features and start winning.</p>
          <Link href="/dashboard/subscribe" className="mt-4 inline-block">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white">
              Subscribe Now
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Featured Charities</CardTitle>
              <CardDescription>Support causes that matter</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {featuredCharities.slice(0, 3).map((charity: { id: string; name: string; mission: string }) => (
                  <div key={charity.id} className="p-4 bg-slate-50 rounded-lg">
                    <h3 className="font-semibold text-slate-900">{charity.name}</h3>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{charity.mission}</p>
                  </div>
                ))}
                {featuredCharities.length === 0 && (
                  <p className="text-slate-500 text-sm">No featured charities yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How Draws Work</CardTitle>
              <CardDescription>Win prizes while making a difference</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-amber-600">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Subscribe</p>
                    <p className="text-sm text-slate-600">Choose a monthly or yearly plan</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-amber-600">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Enter Scores</p>
                    <p className="text-sm text-slate-600">Log your golf scores to participate</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-amber-600">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Win Prizes</p>
                    <p className="text-sm text-slate-600">Match numbers to win up to 40% of the prize pool</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Draw Mechanics</CardTitle>
            <CardDescription>How prize matching works</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-amber-600">5 Numbers</span>
                  <Badge className="bg-amber-500 text-slate-900">Jackpot</Badge>
                </div>
                <p className="text-2xl font-bold text-slate-900">40%</p>
                <p className="text-sm text-slate-600">of prize pool</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700">4 Numbers</span>
                <p className="text-2xl font-bold text-slate-900">35%</p>
                <p className="text-sm text-slate-600">of prize pool</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700">3 Numbers</span>
                <p className="text-2xl font-bold text-slate-900">25%</p>
                <p className="text-sm text-slate-600">of prize pool</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const scores = await getUserScores(user.id)
  const charityData = await getUserCharity(user.id)
  const drawEntries = await getUserDrawEntries(user.id)
  const winnings = await getUserWinnings(user.id)
  
  const pendingWinnings = winnings
    .filter((w: { payment_status: string }) => w.payment_status === 'pending')
    .reduce((sum: number, w: { prize_amount_cents: number }) => sum + w.prize_amount_cents, 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {profile?.full_name?.split(' ')[0] || user.email?.split('@')[0]}!</h1>
        <p className="text-slate-600 mt-1">Track your scores and make a difference</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Subscription</CardDescription>
            <CardTitle className="text-2xl">
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                Active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Renews {formatDate(activeSubscription.end_date)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Your Scores</CardDescription>
            <CardTitle className="text-2xl">{scores.length}/5</CardTitle>
          </CardHeader>
          <CardContent>
            {scores.length > 0 ? (
              <p className="text-sm text-slate-600">
                Latest: {scores[0].score} pts
              </p>
            ) : (
              <Link href="/dashboard/scores">
                <Button variant="outline" size="sm" className="mt-2">
                  Add Score
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Draws Entered</CardDescription>
            <CardTitle className="text-2xl">{drawEntries.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              {drawEntries.filter((e: { status: string }) => e.status === 'won').length} wins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Winnings</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalWinnings)}</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingWinnings > 0 ? (
              <Badge variant="outline" className="border-amber-500 text-amber-600">
                {formatCurrency(pendingWinnings)} pending
              </Badge>
            ) : (
              <p className="text-sm text-slate-600">All paid</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Scores</CardTitle>
            <CardDescription>Your last 5 golf scores in Stableford format</CardDescription>
          </CardHeader>
          <CardContent>
            {scores.length > 0 ? (
              <div className="space-y-3">
                {scores.map((score: { id: string; score: number; played_date: string }, index: number) => (
                  <div key={score.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {score.score}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{score.score} points</p>
                        <p className="text-sm text-slate-500">{formatDate(score.played_date)}</p>
                      </div>
                    </div>
                    {index === 0 && (
                      <Badge variant="outline" className="text-amber-600 border-amber-200">
                        Latest
                      </Badge>
                    )}
                  </div>
                ))}
                <Link href="/dashboard/scores" className="block mt-4">
                  <Button variant="outline" className="w-full">Manage Scores</Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-slate-600 mb-4">No scores recorded yet</p>
                <Link href="/dashboard/scores">
                  <Button>Add Your First Score</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Charity</CardTitle>
            <CardDescription>Making a difference with every subscription</CardDescription>
          </CardHeader>
          <CardContent>
            {charityData?.charity ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{charityData.charity.name}</h3>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">{charityData.charity.mission}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">Contribution</p>
                    <p className="text-lg font-semibold text-slate-900">{charityData.contributionPercent}%</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">Total Donated</p>
                    <p className="text-lg font-semibold text-amber-600">₹0.00</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <p className="text-slate-600 mb-4">No charity selected yet</p>
                <Link href="/auth/signup?step=2">
                  <Button variant="outline">Choose a Charity</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Draw Participation</CardTitle>
            <CardDescription>Your entries in monthly draws</CardDescription>
          </CardHeader>
          <CardContent>
            {drawEntries.length > 0 ? (
              <div className="space-y-3">
                {drawEntries.slice(0, 5).map((entry: { id: string; draws: { draw_date: string; status: string }; matched_numbers: number }) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">
                        Draw: {formatDate(entry.draws.draw_date)}
                      </p>
                      <p className="text-sm text-slate-500">
                        Matched {entry.matched_numbers} numbers
                      </p>
                    </div>
                    <Badge
                      variant={entry.draws.status === 'published' ? 'default' : 'secondary'}
                      className={entry.draws.status === 'published' ? 'bg-amber-500' : ''}
                    >
                      {entry.draws.status === 'published' ? 'Results In' : 'Upcoming'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <p className="text-slate-600">No draw entries yet</p>
                <p className="text-sm text-slate-500 mt-1">Enter your scores to participate!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Winnings</CardTitle>
            <CardDescription>Your prize history and payouts</CardDescription>
          </CardHeader>
          <CardContent>
            {winnings.length > 0 ? (
              <div className="space-y-3">
                {winnings.map((win: { id: string; match_type: string; prize_amount_cents: number; payment_status: string; verification_status: string }) => (
                  <div key={win.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">
                          {win.match_type === '5_match' ? '5 Numbers' : 
                           win.match_type === '4_match' ? '4 Numbers' : '3 Numbers'}
                        </p>
                        <Badge
                          variant={win.verification_status === 'verified' ? 'default' : 'secondary'}
                          className={win.verification_status === 'verified' ? 'bg-amber-500' : ''}
                        >
                          {win.verification_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        Payment: <span className={win.payment_status === 'paid' ? 'text-amber-600' : 'text-amber-600'}>
                          {win.payment_status}
                        </span>
                      </p>
                    </div>
                    <p className="text-lg font-bold text-amber-600">{formatCurrency(win.prize_amount_cents)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-slate-600">No winnings yet</p>
                <p className="text-sm text-slate-500 mt-1">Keep entering scores!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {profile?.role === 'admin' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-amber-900">Admin Access</p>
                  <p className="text-sm text-amber-700">Manage users, draws, and charities</p>
                </div>
              </div>
              <Link href="/admin">
                <Button variant="outline" className="border-amber-600 text-amber-700 hover:bg-amber-100">
                  Open Admin Panel
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
