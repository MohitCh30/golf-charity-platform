import { ReactNode } from 'react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center group-hover:bg-amber-400 transition-colors">
            <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">GolfGive</span>
        </Link>
        {children}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
