import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const APP_URL = 'https://golf-charity-platform-lilac.vercel.app'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables for section 9 audit')
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function makeEmail(prefix: string): string {
  return `${prefix}_${randomBytes(4).toString('hex')}@playwright.test`
}

function formatDateISO(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
  return d.toISOString().split('T')[0]
}

async function cleanupUserByEmail(email: string) {
  const { data } = await supabaseAdmin.auth.admin.listUsers()
  const user = data?.users?.find((u) => u.email === email)
  if (!user) return

  await supabaseAdmin.from('scores').delete().eq('user_id', user.id)
  await supabaseAdmin.from('winners').delete().eq('user_id', user.id)
  await supabaseAdmin.from('draw_entries').delete().eq('user_id', user.id)
  await supabaseAdmin.from('subscriptions').delete().eq('user_id', user.id)
  await supabaseAdmin.from('profiles').delete().eq('id', user.id)
  await supabaseAdmin.auth.admin.deleteUser(user.id)
}

async function createTestUser(options: {
  email: string
  password: string
  role: 'subscriber' | 'admin'
  subscriptionStatus?: 'active' | 'inactive' | 'lapsed'
  subscriptionDaysFromNow?: number
}) {
  await cleanupUserByEmail(options.email)

  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: options.email,
    password: options.password,
    email_confirm: true,
  })

  if (createErr || !created.user) {
    throw new Error(`Failed to create user ${options.email}: ${createErr?.message}`)
  }

  const userId = created.user.id

  await supabaseAdmin.from('profiles').upsert({
    id: userId,
    email: options.email,
    full_name: options.role === 'admin' ? 'Admin Tester' : 'Subscriber Tester',
    role: options.role,
  })

  if (options.subscriptionStatus) {
    const startDate = new Date().toISOString().split('T')[0]
    const endDays = options.subscriptionDaysFromNow ?? 30
    const endDate = new Date(Date.now() + endDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    await supabaseAdmin.from('subscriptions').insert({
      user_id: userId,
      plan: 'monthly',
      status: options.subscriptionStatus,
      amount_cents: 999,
      charity_amount_cents: 99,
      start_date: startDate,
      end_date: endDate,
    })
  }

  return userId
}

async function login(page: { goto: Function; fill: Function; click: Function; waitForLoadState: Function }, email: string, password: string) {
  await page.goto(`${APP_URL}/auth/login`)
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  await page.waitForLoadState('networkidle')
}

test.describe('APP_FLOW.md Section 9 audit against production URL', () => {
  test.setTimeout(180000)

  test('1) Build fix verification (deployment + callback route availability)', async ({ request }) => {
    const home = await request.get(APP_URL)
    const callback = await request.get(`${APP_URL}/auth/callback`, {
      maxRedirects: 0,
      failOnStatusCode: false,
    })

    const actual = `home_status=${home.status()}, callback_status=${callback.status()}`
    console.log(`[CHECK 1] ${actual}`)

    expect(home.status(), actual).toBe(200)
    expect(callback.status(), actual).toBeLessThan(500)
  })

  test('2) Auth callback/OAuth flow verification', async ({ page }) => {
    await page.goto(`${APP_URL}/auth/login`)
    const oauthEntryPoints = page.locator('button, a').filter({ hasText: /google|github|oauth|continue with/i })
    const count = await oauthEntryPoints.count()
    const actual = `oauth_entry_points=${count}`
    console.log(`[CHECK 2] ${actual}`)

    expect(count, 'No OAuth entry points found on login screen').toBeGreaterThan(0)
  })

  test('3) Signup Step 3 handles mock payment failures (error vs hang)', async ({ page }) => {
    let observedFailure = false
    const attempts: string[] = []

    for (let i = 0; i < 12; i += 1) {
      await page.context().clearCookies()
      const email = makeEmail('paymentcheck')
      attempts.push(email)

      await page.goto(`${APP_URL}/auth/signup`)
      await page.fill('#fullName', 'Payment Failure Probe')
      await page.fill('#email', email)
      await page.fill('#password', 'testpass123')
      await page.click('button[type="submit"]')

      await page.locator('input[name="charityId"]').first().check()
      await page.click('button[type="submit"]')

      await page.locator('input[name="plan"][value="monthly"]').check()
      await page.click('button[type="submit"]')

      await page.waitForLoadState('networkidle')
      const url = page.url()
      const hasErrorBanner = (await page.locator('text=/failed|error|declined/i').count()) > 0
      const failedOnStep3 = url.includes('/auth/signup?step=3') && (url.includes('error=') || hasErrorBanner)

      if (failedOnStep3) {
        observedFailure = true
        break
      }

      await cleanupUserByEmail(email)
    }

    const actual = `attempts=${attempts.length}, observed_failure=${observedFailure}`
    console.log(`[CHECK 3] ${actual}`)

    for (const email of attempts) {
      await cleanupUserByEmail(email)
    }

    expect(observedFailure, 'No observable payment failure surfaced across attempts').toBe(true)
  })

  test('4) Dashboard redirect behavior: no session vs inactive subscription', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto(`${APP_URL}/dashboard`)
    await page.waitForLoadState('networkidle')
    const noSessionUrl = page.url()

    const email = makeEmail('inactive')
    await createTestUser({
      email,
      password: 'testpass123',
      role: 'subscriber',
      subscriptionStatus: 'inactive',
      subscriptionDaysFromNow: -1,
    })

    await login(page, email, 'testpass123')
    await page.goto(`${APP_URL}/dashboard`)
    await page.waitForLoadState('networkidle')
    const inactiveUrl = page.url()
    const inactivePageHasRestrictionText =
      (await page.locator('text=/inactive|subscribe|upgrade|restricted/i').count()) > 0

    const actual = `no_session_url=${noSessionUrl}, inactive_url=${inactiveUrl}, inactive_restriction_text=${inactivePageHasRestrictionText}`
    console.log(`[CHECK 4] ${actual}`)

    await cleanupUserByEmail(email)

    expect(noSessionUrl, actual).toContain('/auth/login')
    expect(inactiveUrl !== `${APP_URL}/dashboard` || inactivePageHasRestrictionText, actual).toBe(true)
  })

  test('5) Score entry + DB trigger keeps only latest 5 (drop oldest on 6th)', async ({ page }) => {
    const email = makeEmail('scoretrigger')
    const userId = await createTestUser({
      email,
      password: 'testpass123',
      role: 'subscriber',
      subscriptionStatus: 'active',
      subscriptionDaysFromNow: 30,
    })

    await login(page, email, 'testpass123')
    await page.goto(`${APP_URL}/dashboard/scores`)
    await page.waitForLoadState('networkidle')

    const oldestDate = formatDateISO(6)
    for (let i = 0; i < 6; i += 1) {
      const daysAgo = 6 - i
      await page.fill('input[name="score"]', String(10 + i))
      await page.fill('input[name="playedDate"]', formatDateISO(daysAgo))
      await page.click('button[type="submit"]')
      await page.waitForLoadState('networkidle')
    }

    const { data: scores, error } = await supabaseAdmin
      .from('scores')
      .select('score, played_date')
      .eq('user_id', userId)
      .order('played_date', { ascending: true })

    const count = scores?.length || 0
    const containsOldest = (scores || []).some((s) => s.played_date === oldestDate)
    const actual = `db_error=${error?.message || 'none'}, count=${count}, contains_oldest=${containsOldest}`
    console.log(`[CHECK 5] ${actual}`)

    await cleanupUserByEmail(email)

    expect(error, actual).toBeNull()
    expect(count, actual).toBe(5)
    expect(containsOldest, actual).toBe(false)
  })

  test('6) Score column naming check (`played_date` matches DB)', async () => {
    const playedDateQuery = await supabaseAdmin.from('scores').select('played_date').limit(1)
    const scoreDateQuery = await supabaseAdmin.from('scores').select('score_date').limit(1)

    const actual = `played_date_error=${playedDateQuery.error?.message || 'none'}, score_date_error=${scoreDateQuery.error?.message || 'none'}`
    console.log(`[CHECK 6] ${actual}`)

    expect(playedDateQuery.error, actual).toBeNull()
    expect(scoreDateQuery.error, actual).not.toBeNull()
  })

  test('7) Admin access check (`role=admin` can access /admin)', async ({ page }) => {
    const email = makeEmail('adminaccess')
    await createTestUser({
      email,
      password: 'testpass123',
      role: 'admin',
      subscriptionStatus: 'active',
      subscriptionDaysFromNow: 30,
    })

    await login(page, email, 'testpass123')
    await page.goto(`${APP_URL}/admin`)
    await page.waitForLoadState('networkidle')

    const url = page.url()
    const hasAdminHeading = (await page.locator('text=/admin|dashboard|management/i').count()) > 0
    const actual = `url=${url}, has_admin_heading=${hasAdminHeading}`
    console.log(`[CHECK 7] ${actual}`)

    await cleanupUserByEmail(email)

    expect(url, actual).toContain('/admin')
    expect(hasAdminHeading, actual).toBe(true)
  })

  test('8) Draw simulation does not publish / does not write winners', async ({ page }) => {
    const adminEmail = makeEmail('simadmin')
    const playerEmail = makeEmail('simplayer')
    const adminId = await createTestUser({
      email: adminEmail,
      password: 'testpass123',
      role: 'admin',
      subscriptionStatus: 'active',
      subscriptionDaysFromNow: 30,
    })
    const playerId = await createTestUser({
      email: playerEmail,
      password: 'testpass123',
      role: 'subscriber',
      subscriptionStatus: 'active',
      subscriptionDaysFromNow: 30,
    })

    await supabaseAdmin.from('scores').insert([
      { user_id: playerId, score: 10, played_date: formatDateISO(1) },
      { user_id: playerId, score: 11, played_date: formatDateISO(2) },
      { user_id: playerId, score: 12, played_date: formatDateISO(3) },
      { user_id: playerId, score: 13, played_date: formatDateISO(4) },
      { user_id: playerId, score: 14, played_date: formatDateISO(5) },
    ])

    const beforeWinners = await supabaseAdmin.from('winners').select('id', { count: 'exact', head: true }).eq('user_id', playerId)
    const beforePublished = await supabaseAdmin.from('draws').select('id', { count: 'exact', head: true }).eq('status', 'published')

    await login(page, adminEmail, 'testpass123')
    const simResponse = await page.request.post(`${APP_URL}/admin/draws/action`, {
      data: { action: 'simulate' },
    })
    const simJson = await simResponse.json()

    const afterWinners = await supabaseAdmin.from('winners').select('id', { count: 'exact', head: true }).eq('user_id', playerId)
    const afterPublished = await supabaseAdmin.from('draws').select('id', { count: 'exact', head: true }).eq('status', 'published')

    const actual = `simulate_status=${simResponse.status()}, winners_before=${beforeWinners.count}, winners_after=${afterWinners.count}, published_before=${beforePublished.count}, published_after=${afterPublished.count}, has_draw_numbers=${Array.isArray(simJson?.result?.drawNumbers)}`
    console.log(`[CHECK 8] ${actual}`)

    await cleanupUserByEmail(adminEmail)
    await cleanupUserByEmail(playerEmail)

    expect(simResponse.status(), actual).toBe(200)
    expect(beforeWinners.count, actual).toBe(afterWinners.count)
    expect(beforePublished.count, actual).toBe(afterPublished.count)
    expect(Array.isArray(simJson?.result?.drawNumbers), actual).toBe(true)
  })

  test('9) Draw publish writes winners and cannot be re-published', async ({ page }) => {
    const adminEmail = makeEmail('pubadmin')
    const playerEmail = makeEmail('pubplayer')
    const adminId = await createTestUser({
      email: adminEmail,
      password: 'testpass123',
      role: 'admin',
      subscriptionStatus: 'active',
      subscriptionDaysFromNow: 30,
    })
    const playerId = await createTestUser({
      email: playerEmail,
      password: 'testpass123',
      role: 'subscriber',
      subscriptionStatus: 'active',
      subscriptionDaysFromNow: 30,
    })

    await supabaseAdmin.from('scores').insert([
      { user_id: playerId, score: 1, played_date: formatDateISO(1) },
      { user_id: playerId, score: 2, played_date: formatDateISO(2) },
      { user_id: playerId, score: 3, played_date: formatDateISO(3) },
      { user_id: playerId, score: 4, played_date: formatDateISO(4) },
      { user_id: playerId, score: 5, played_date: formatDateISO(5) },
    ])

    await login(page, adminEmail, 'testpass123')

    const simResponse = await page.request.post(`${APP_URL}/admin/draws/action`, {
      data: { action: 'simulate' },
    })
    const simJson = await simResponse.json()
    const result = simJson?.result

    if (!result?.drawNumbers || !Array.isArray(result.drawNumbers) || result.drawNumbers.length === 0) {
      throw new Error('Simulation did not return drawNumbers')
    }

    await supabaseAdmin.from('scores').delete().eq('user_id', playerId)
    await supabaseAdmin.from('scores').insert(
      result.drawNumbers.slice(0, 5).map((score: number, idx: number) => ({
        user_id: playerId,
        score,
        played_date: formatDateISO(idx + 1),
      }))
    )

    const publishPayload = {
      action: 'publish',
      winningNumbers: result.drawNumbers,
      fiveMatchCount: result.fiveMatchCount,
      fourMatchCount: result.fourMatchCount,
      threeMatchCount: result.threeMatchCount,
      fiveMatchPrize: result.fiveMatchPrize,
      fourMatchPrize: result.fourMatchPrize,
      threeMatchPrize: result.threeMatchPrize,
    }

    const firstPublish = await page.request.post(`${APP_URL}/admin/draws/action`, { data: publishPayload })
    const firstJson = await firstPublish.json()
    const drawId = firstJson?.drawId

    const winnersAfterFirst = await supabaseAdmin
      .from('winners')
      .select('id', { count: 'exact', head: true })
      .eq('draw_id', drawId)
      .eq('user_id', playerId)

    const secondPublish = await page.request.post(`${APP_URL}/admin/draws/action`, { data: publishPayload })
    const secondBody = await secondPublish.text()

    const actual = `first_publish_status=${firstPublish.status()}, draw_id=${drawId}, winners_after_first=${winnersAfterFirst.count}, second_publish_status=${secondPublish.status()}, second_publish_body=${secondBody.slice(0, 180)}`
    console.log(`[CHECK 9] ${actual}`)

    if (drawId) {
      await supabaseAdmin.from('winners').delete().eq('draw_id', drawId)
      await supabaseAdmin.from('draw_entries').delete().eq('draw_id', drawId)
      await supabaseAdmin.from('draws').delete().eq('id', drawId)
    }

    const secondDrawId = (() => {
      try {
        const parsed = JSON.parse(secondBody)
        return parsed?.drawId as string | undefined
      } catch {
        return undefined
      }
    })()

    if (secondDrawId) {
      await supabaseAdmin.from('winners').delete().eq('draw_id', secondDrawId)
      await supabaseAdmin.from('draw_entries').delete().eq('draw_id', secondDrawId)
      await supabaseAdmin.from('draws').delete().eq('id', secondDrawId)
    }

    await cleanupUserByEmail(adminEmail)
    await cleanupUserByEmail(playerEmail)

    expect(firstPublish.status(), actual).toBe(200)
    expect((winnersAfterFirst.count || 0) > 0, actual).toBe(true)
    expect(secondPublish.status(), actual).toBeGreaterThanOrEqual(400)
  })

  test('10) Charity listing loads on /charities without auth', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto(`${APP_URL}/charities`)
    await page.waitForLoadState('networkidle')

    const url = page.url()
    const headingCount = await page.locator('text=/charities|causes|charity/i').count()
    const cardCount = await page.locator('a[href^="/charities/"]').count()
    const actual = `url=${url}, heading_count=${headingCount}, charity_links=${cardCount}`
    console.log(`[CHECK 10] ${actual}`)

    expect(url, actual).toContain('/charities')
    expect(headingCount, actual).toBeGreaterThan(0)
    expect(cardCount, actual).toBeGreaterThan(0)
  })

  test('11) proxy.ts middleware behavior is active in deployment', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto(`${APP_URL}/dashboard`)
    await page.waitForLoadState('networkidle')
    const unauthDashboardUrl = page.url()

    const email = makeEmail('proxynonadmin')
    await createTestUser({
      email,
      password: 'testpass123',
      role: 'subscriber',
      subscriptionStatus: 'active',
      subscriptionDaysFromNow: 30,
    })

    await login(page, email, 'testpass123')
    await page.goto(`${APP_URL}/admin`)
    await page.waitForLoadState('networkidle')
    const nonAdminAdminUrl = page.url()

    const actual = `unauth_dashboard_url=${unauthDashboardUrl}, non_admin_admin_url=${nonAdminAdminUrl}`
    console.log(`[CHECK 11] ${actual}`)

    await cleanupUserByEmail(email)

    expect(unauthDashboardUrl, actual).toContain('/auth/login')
    expect(nonAdminAdminUrl, actual).toContain('/dashboard')
    expect(nonAdminAdminUrl, actual).not.toContain('/admin')
  })
})
