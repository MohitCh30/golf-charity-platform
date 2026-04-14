import Link from 'next/link'
import { getFeaturedCharities } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/server'

export default async function HomePage() {
  const charities = await getFeaturedCharities()
  const user = await getUser()

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="font-bold text-white text-lg">GolfGive</span>
            </Link>
            <nav className="flex items-center gap-6">
              {user ? (
                <>
                  <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white transition-colors">
                    Dashboard
                  </Link>
                  <Link href="/dashboard" className="text-sm font-medium bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg transition-colors">
                    My Account
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-sm text-slate-300 hover:text-white transition-colors">
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="text-sm font-medium bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg transition-colors">
                    Get Started
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Play games.
              <br />
              <span className="text-amber-400">Help others.</span>
              <br />
              Win prizes.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl">
              A subscription platform where every game you play contributes to causes that matter.
              Enter scores, participate in monthly draws, and make a real difference—all while having a chance to win.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              {user ? (
                <Link href="/dashboard" className="inline-flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-8 py-4 rounded-lg transition-all hover:scale-105">
                  Go to Dashboard
                </Link>
              ) : (
                <Link href="/auth/signup" className="inline-flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-8 py-4 rounded-lg transition-all hover:scale-105">
                  Start Playing
                </Link>
              )}
              <Link href="#charities" className="inline-flex items-center justify-center border border-slate-600 hover:border-slate-500 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Explore Charities
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">How it works</h2>
            <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
              Three simple steps to start making a difference
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-slate-900/50 border border-slate-700 hover:border-amber-500/50 transition-all hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">1. Subscribe</h3>
              <p className="text-slate-400">
                Choose a monthly or yearly plan. A portion of your subscription goes directly to your chosen charity.
              </p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-slate-900/50 border border-slate-700 hover:border-amber-500/50 transition-all hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">2. Enter Scores</h3>
              <p className="text-slate-400">
                Log your golf scores in Stableford format. Your last 5 rounds are used for monthly prize draws.
              </p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-slate-900/50 border border-slate-700 hover:border-amber-500/50 transition-all hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">3. Win & Give</h3>
              <p className="text-slate-400">
                Match your numbers in our monthly draws. Win prizes while knowing you&apos;re supporting good causes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="charities" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Featured Charities</h2>
            <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
              Every subscription supports causes our community cares about
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {charities.length > 0 ? (
              charities.slice(0, 3).map((charity: { id: string; name: string; mission: string; description?: string }) => (
                <div key={charity.id} className="p-6 rounded-2xl bg-slate-800 border border-slate-700 hover:border-amber-500/50 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-amber-500 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{charity.name}</h3>
                  <p className="text-slate-400">{charity.mission || charity.description}</p>
                </div>
              ))
            ) : (
              <>
                <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700">
                  <div className="w-12 h-12 rounded-lg bg-amber-500 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Children&apos;s Education Fund</h3>
                  <p className="text-slate-400">Providing quality education to underprivileged children across India.</p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700">
                  <div className="w-12 h-12 rounded-lg bg-amber-500 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Clean Water Initiative</h3>
                  <p className="text-slate-400">Bringing clean and safe drinking water to rural communities.</p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700">
                  <div className="w-12 h-12 rounded-lg bg-amber-500 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Healthcare Access</h3>
                  <p className="text-slate-400">Supporting affordable healthcare for families in need.</p>
                </div>
              </>
            )}
          </div>
          {!user && (
            <div className="text-center mt-12">
              <Link href="/auth/signup" className="inline-flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-8 py-4 rounded-lg transition-all hover:scale-105">
                Support a Charity Today
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="bg-slate-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Draw Mechanics</h2>
            <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
              How prize matching works in our monthly draws
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-gradient-to-b from-amber-500/20 to-transparent border border-amber-500/30">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500 mb-6">
                <span className="text-2xl font-bold text-slate-900">5</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">5 Numbers Matched</h3>
              <p className="text-3xl font-bold text-amber-400 mb-2">40%</p>
              <p className="text-slate-400">of the prize pool</p>
              <span className="inline-block mt-4 text-xs font-medium bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full">
                JACKPOT
              </span>
            </div>
            <div className="text-center p-8 rounded-2xl bg-slate-900/50 border border-slate-700">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700 mb-6">
                <span className="text-2xl font-bold text-white">4</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">4 Numbers Matched</h3>
              <p className="text-3xl font-bold text-white mb-2">35%</p>
              <p className="text-slate-400">of the prize pool</p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-slate-900/50 border border-slate-700">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700 mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">3 Numbers Matched</h3>
              <p className="text-3xl font-bold text-white mb-2">25%</p>
              <p className="text-slate-400">of the prize pool</p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-slate-400 max-w-2xl mx-auto">
              Your scores generate random numbers for each monthly draw.
              Match more numbers to win a bigger share of the prize pool.
              Unclaimed jackpots roll over to the next draw!
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="font-bold text-white">GolfGive</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              {user ? (
                <>
                  <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                  <Link href="/charities" className="hover:text-white transition-colors">Charities</Link>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link>
                  <Link href="/auth/signup" className="hover:text-white transition-colors">Sign Up</Link>
                </>
              )}
            </div>
            <p className="text-sm text-slate-500">
              Play games. Help others. Win prizes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}