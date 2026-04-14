import { getAllActiveCharities } from '@/lib/supabase/server'
import { CharitiesList } from './CharitiesList'
import { Heart } from 'lucide-react'

export default async function CharitiesPage() {
  const charities = await getAllActiveCharities()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
            <Heart className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Our Partner Charities
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Every subscription contributes to these amazing causes. Browse our partner 
            charities and see the difference your support makes in communities around the world.
          </p>
        </div>

        <CharitiesList charities={charities} />

        <div className="mt-16 p-8 bg-amber-50 rounded-xl border border-amber-200">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Want Your Charity to Partner With Us?
            </h2>
            <p className="text-slate-600 mb-6">
              We work with registered charities that align with our mission of making 
              golf more meaningful. Apply to become a partner charity.
            </p>
            <a
              href="mailto:charities@golfcharityplatform.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg font-medium transition-colors"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
