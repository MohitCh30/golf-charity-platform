'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Heart, Search } from 'lucide-react'

type Charity = {
  id: string
  name: string
  mission: string
  description?: string
  website?: string
  is_featured?: boolean
}

interface CharitiesListProps {
  charities: Charity[]
}

function CharityCard({ charity }: { charity: Charity }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Heart className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{charity.name}</CardTitle>
              {charity.is_featured && (
                <Badge variant="outline" className="border-amber-500 text-amber-600 mt-1">
                  Featured
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription className="text-base text-slate-700">
          {charity.mission}
        </CardDescription>
        {charity.description && (
          <p className="text-sm text-slate-600 line-clamp-2">{charity.description}</p>
        )}
        <div className="pt-2 flex gap-2">
          <Link href={`/charities/${charity.id}`} className="flex-1">
            <Button variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50">
              Learn More
            </Button>
          </Link>
          <Link href="/auth/signup" className="flex-1">
            <Button variant="outline" className="w-full border-amber-500 text-amber-600 hover:bg-amber-50">
              Support
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export function CharitiesList({ charities }: CharitiesListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCharities = charities.filter(charity =>
    charity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    charity.mission.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const featuredCharities = filteredCharities.filter(c => c.is_featured)
  const otherCharities = filteredCharities.filter(c => !c.is_featured)

  return (
    <div className="space-y-8">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="search"
          placeholder="Search charities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredCharities.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No charities found matching your search.</p>
        </div>
      ) : (
        <>
          {featuredCharities.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <Badge className="bg-amber-500 text-slate-900">Featured</Badge>
                Featured Charities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredCharities.map(charity => (
                  <CharityCard key={charity.id} charity={charity} />
                ))}
              </div>
            </div>
          )}

          {otherCharities.length > 0 && (
            <div className="space-y-4">
              {featuredCharities.length > 0 && (
                <h2 className="text-xl font-semibold text-slate-900">All Charities</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherCharities.map(charity => (
                  <CharityCard key={charity.id} charity={charity} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
