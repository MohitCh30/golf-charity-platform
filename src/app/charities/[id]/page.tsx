import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, ArrowLeft } from 'lucide-react'

export default async function CharityProfilePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createAdminClient()

  const { data: charity } = await supabase
    .from('charities')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (!charity) notFound()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-12">

        <Link
          href="/charities"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all charities
        </Link>

        <div className="flex items-start gap-5 mb-8">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Heart className="w-8 h-8 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-slate-900">{charity.name}</h1>
              {charity.is_featured && (
                <Badge className="bg-amber-500 text-slate-900">Featured</Badge>
              )}
            </div>
            {charity.mission && (
              <p className="text-lg text-slate-600 mt-2">{charity.mission}</p>
            )}
          </div>
        </div>

        {charity.description && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">About this charity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {charity.description}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Support {charity.name}
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Subscribe to the platform and direct a portion of your subscription to this charity.
                </p>
              </div>
              <Link href="/auth/signup" className="flex-shrink-0">
                <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium">
                  Subscribe &amp; Support
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
