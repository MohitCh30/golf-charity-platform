import Link from 'next/link'
import { signout } from '@/app/auth/actions'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="font-bold text-white">GolfGive Admin</span>
              </Link>
              <nav className="flex items-center gap-6">
                <Link href="/admin" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
                <Link href="/admin/draws" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Draws
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
                View Site
              </Link>
              <form action={signout}>
                <button type="submit" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
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
