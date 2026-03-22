import Link from 'next/link'
import { signout } from '@/app/auth/actions'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span className="font-bold text-slate-900">GolfGive</span>
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  Overview
                </Link>
                <Link href="/dashboard/scores" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  My Scores
                </Link>
                <Link href="/dashboard/subscribe" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  Subscription
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <form action={signout}>
                <button type="submit" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
