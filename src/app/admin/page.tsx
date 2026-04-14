import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createAdminClient, getUser } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WinnerVerificationList } from './WinnerVerificationList'

function formatCurrency(cents: number) {
  return `₹${(cents / 100).toFixed(2)}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export default async function AdminPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const supabase = await createAdminClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*, subscriptions(*)')
    .order('created_at', { ascending: false })

  const { data: charities } = await supabase
    .from('charities')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: winners } = await supabase
    .from('winners')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: draws } = await supabase
    .from('draws')
    .select('*')
    .order('draw_date', { ascending: false })

  const totalUsers = profiles?.length || 0
  const activeSubscribers = profiles?.filter(p =>
    p.subscriptions?.some((s: { status: string; end_date: string }) =>
      s.status === 'active' && new Date(s.end_date) >= new Date()
    )
  ).length || 0

  const totalPrizePool = winners?.reduce((sum: number, w: { prize_amount_cents: number }) => sum + w.prize_amount_cents, 0) || 0
  const pendingVerifications = winners?.filter((w: { verification_status: string }) => w.verification_status === 'pending').length || 0

  const recentUsers = profiles?.slice(0, 10) || []
  const pendingWinners = winners?.filter((w: { verification_status: string }) => w.verification_status === 'pending').slice(0, 10) || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 mt-1">Manage your platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl text-white">{totalUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-amber-500/20 text-amber-400">{activeSubscribers} active</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Subscribers</CardDescription>
            <CardTitle className="text-3xl text-white">{activeSubscribers}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400">Subscribed members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Prize Pool</CardDescription>
            <CardTitle className="text-3xl text-white">{formatCurrency(totalPrizePool)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400">Distributed to winners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Verifications</CardDescription>
            <CardTitle className="text-3xl text-white">{pendingVerifications}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="#winners" className="text-sm text-amber-400 hover:text-amber-300">
              Review →
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">User Management</CardTitle>
              <CardDescription>Recent registrations</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-2 text-slate-400 font-medium">Email</th>
                    <th className="text-left py-3 px-2 text-slate-400 font-medium">Plan</th>
                    <th className="text-left py-3 px-2 text-slate-400 font-medium">Status</th>
                    <th className="text-left py-3 px-2 text-slate-400 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((profile: { id: string; email: string; full_name?: string; role: string; created_at: string; subscriptions?: { plan: string; status: string; end_date?: string }[] }) => {
                    const activeSub = profile.subscriptions?.find(
                      (s: { status: string; end_date?: string }) =>
                        s.status === 'active' && (!s.end_date || new Date(s.end_date) >= new Date())
                    )
                    return (
                      <tr key={profile.id} className="border-b border-slate-700/50">
                        <td className="py-3 px-2 text-slate-300">{profile.email}</td>
                        <td className="py-3 px-2 text-slate-300 capitalize">
                          {activeSub?.plan || '-'}
                        </td>
                        <td className="py-3 px-2">
                          {activeSub ? (
                            <Badge className="bg-amber-500/20 text-amber-400">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-700 text-slate-400">Inactive</Badge>
                          )}
                        </td>
                        <td className="py-3 px-2 text-slate-400">{formatDate(profile.created_at)}</td>
                      </tr>
                    )
                  })}
                  {recentUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">No users yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Charity Management</CardTitle>
              <CardDescription>Active charities</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {charities?.map((charity: { id: string; name: string; mission?: string; is_active: boolean; is_featured: boolean }) => (
                <div key={charity.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <div>
                    <p className="font-medium text-white">{charity.name}</p>
                    <p className="text-sm text-slate-400 line-clamp-1">{charity.mission}</p>
                  </div>
                  <div className="flex gap-2">
                    {charity.is_featured && (
                      <Badge className="bg-amber-500/20 text-amber-400">Featured</Badge>
                    )}
                    <Badge variant={charity.is_active ? "default" : "secondary"} className={charity.is_active ? "bg-green-500/20 text-green-400" : "bg-slate-700"}>
                      {charity.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))}
              {(!charities || charities.length === 0) && (
                <p className="text-center text-slate-500 py-8">No charities yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card id="winners">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Winner Verifications</CardTitle>
              <CardDescription>Pending approvals</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <WinnerVerificationList winners={pendingWinners} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Draw Management</CardTitle>
              <CardDescription>Recent and upcoming draws</CardDescription>
            </div>
            <Link href="/admin/draws">
              <Badge className="bg-amber-500 hover:bg-amber-400 text-slate-900">Manage</Badge>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {draws?.slice(0, 5).map((draw: { id: string; draw_date: string; status: string; winning_numbers?: number[] }) => (
                <div key={draw.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <div>
                    <p className="font-medium text-white">{formatDate(draw.draw_date)}</p>
                    {draw.winning_numbers && (
                      <p className="text-sm text-slate-400">
                        Numbers: {draw.winning_numbers.join(', ')}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      draw.status === 'published' ? 'bg-green-500/20 text-green-400' :
                      draw.status === 'simulation' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-slate-700 text-slate-400'
                    }
                  >
                    {draw.status}
                  </Badge>
                </div>
              ))}
              {(!draws || draws.length === 0) && (
                <p className="text-center text-slate-500 py-8">No draws yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
