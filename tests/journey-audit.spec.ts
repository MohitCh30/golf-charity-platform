import { test, expect, Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables')
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots')
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
}

function generateTestEmail(prefix: string): string {
  return `${prefix}_${randomBytes(4).toString('hex')}@playwright.test`
}

async function takeScreenshot(page: Page, name: string) {
  await page.waitForLoadState('networkidle')
  const filePath = path.join(SCREENSHOTS_DIR, name)
  await page.screenshot({ path: filePath, fullPage: true })
  console.log(`Screenshot: ${name}`)
  return filePath
}

async function cleanupUser(email: string) {
  try {
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const existingUserForEmail = existingUser?.users?.find(u => u.email === email)
    if (existingUserForEmail) {
      await supabaseAdmin.from('scores').delete().eq('user_id', existingUserForEmail.id)
      await supabaseAdmin.from('winners').delete().eq('user_id', existingUserForEmail.id)
      await supabaseAdmin.from('draw_entries').delete().eq('user_id', existingUserForEmail.id)
      await supabaseAdmin.from('subscriptions').delete().eq('user_id', existingUserForEmail.id)
      await supabaseAdmin.from('profiles').delete().eq('id', existingUserForEmail.id)
      await supabaseAdmin.auth.admin.deleteUser(existingUserForEmail.id)
    }
  } catch (e) {
    console.log(`Cleanup for ${email}: skipped`)
  }
}

async function createTestUser(email: string, password: string, isAdmin: boolean = false, hasSubscription: boolean = true) {
  await cleanupUser(email)
  
  try {
    const { data: { user } } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (user) {
      // Use upsert since a trigger may auto-create the profile
      await supabaseAdmin.from('profiles').upsert({
        id: user.id,
        email,
        full_name: isAdmin ? 'Admin User' : 'Test User',
        role: isAdmin ? 'admin' : 'subscriber',
      })

      if (hasSubscription) {
        const startDate = new Date().toISOString().split('T')[0]
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        await supabaseAdmin.from('subscriptions').insert({
          user_id: user.id,
          plan: 'monthly',
          status: 'active',
          amount_cents: 999,
          charity_amount_cents: 99,
          start_date: startDate,
          end_date: endDate,
        })
      }
      return user.id
    }
  } catch (e) {
    console.log(`Create user ${email}: skipped`)
  }
  return null
}

const RESULTS: { screenshot: string; url: string; status: 'PASS' | 'FAIL' | 'SKIP' }[] = []

function recordResult(screenshot: string, url: string, status: 'PASS' | 'FAIL' | 'SKIP') {
  RESULTS.push({ screenshot, url, status })
}

test.describe('Journey Audit - Visual Verification', () => {
  test('01 - Homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await takeScreenshot(page, '01-homepage.png')
    recordResult('01-homepage.png', page.url(), 'PASS')
  })

  test('02 - Signup Step 1', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/signup')
    await takeScreenshot(page, '02-signup-step1.png')
    recordResult('02-signup-step1.png', page.url(), 'PASS')
  })

  test('03 - Signup Step 2', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/signup')
    await page.fill('#fullName', 'Journey Test')
    await page.fill('#email', generateTestEmail('journey'))
    await page.fill('#password', 'testpass123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/auth\/signup\?step=2/, { timeout: 10000 })
    await takeScreenshot(page, '03-signup-step2.png')
    recordResult('03-signup-step2.png', page.url(), 'PASS')
  })

  test('04 - Signup Step 3', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/signup?step=2')
    const email = generateTestEmail('journey3')
    await page.fill('#fullName', 'Journey Test')
    await page.fill('#email', email)
    await page.fill('#password', 'testpass123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/auth\/signup\?step=2/, { timeout: 10000 })
    await page.locator('input[name="charityId"]').first().check()
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/auth\/signup\?step=3/, { timeout: 10000 })
    await takeScreenshot(page, '04-signup-step3.png')
    recordResult('04-signup-step3.png', page.url(), 'PASS')
  })

  test('05 - Welcome Screen', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/signup?step=3')
    await takeScreenshot(page, '05-welcome-screen.png')
    recordResult('05-welcome-screen.png', page.url(), page.url().includes('/auth/welcome') ? 'PASS' : 'FAIL')
  })

  test('06 - Login Page', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/login')
    await takeScreenshot(page, '06-login-page.png')
    recordResult('06-login-page.png', page.url(), 'PASS')
  })

  test('07 - Forgot Password', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/forgot-password')
    await takeScreenshot(page, '07-forgot-password.png')
    recordResult('07-forgot-password.png', page.url(), 'PASS')
  })

  test('08 - Subscribe Page', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/subscribe')
    await takeScreenshot(page, '08-subscribe-page.png')
    recordResult('08-subscribe-page.png', page.url(), 'PASS')
  })

  test('09 - Dashboard (no subscription)', async ({ page }) => {
    const email = generateTestEmail('nosub')
    const userId = await createTestUser(email, 'testpass123', false, false)
    
    await page.goto('http://localhost:3000/auth/login')
    await page.fill('#email', email)
    await page.fill('#password', 'testpass123')
    await page.click('button[type="submit"]')
    
    // Wait for either dashboard or subscribe page
    await page.waitForLoadState('networkidle')
    const url = page.url()
    
    if (url.includes('/dashboard/subscribe')) {
      // If redirected to subscribe, click "Explore First" to get to dashboard
      await page.locator('a:has-text("Explore First")').click()
      await page.waitForURL(/\/dashboard/, { timeout: 10000 })
    } else {
      // User went directly to dashboard
      await page.waitForURL(/\/dashboard/, { timeout: 10000 })
    }
    
    await takeScreenshot(page, '09-restricted-dashboard.png')
    recordResult('09-restricted-dashboard.png', page.url(), 'PASS')
    
    if (userId) {
      await cleanupUser(email)
    }
  })

  test('10 - Dashboard (with subscription)', async ({ page }) => {
    const email = generateTestEmail('subbed')
    const userId = await createTestUser(email, 'testpass123', false, true)
    
    await page.goto('http://localhost:3000/auth/login')
    await page.fill('#email', email)
    await page.fill('#password', 'testpass123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    await takeScreenshot(page, '10-full-dashboard.png')
    recordResult('10-full-dashboard.png', page.url(), 'PASS')
    
    if (userId) {
      await cleanupUser(email)
    }
  })

  test('11 - Scores Page', async ({ page }) => {
    const email = generateTestEmail('scorer')
    const userId = await createTestUser(email, 'testpass123', false, true)
    
    await page.goto('http://localhost:3000/auth/login')
    await page.fill('#email', email)
    await page.fill('#password', 'testpass123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    
    await page.goto('http://localhost:3000/dashboard/scores')
    await takeScreenshot(page, '11-scores-page.png')
    recordResult('11-scores-page.png', page.url(), 'PASS')
    
    if (userId) {
      await cleanupUser(email)
    }
  })

  test('12 - Admin Dashboard', async ({ page }) => {
    const email = generateTestEmail('admin')
    const userId = await createTestUser(email, 'testpass123', true, true)
    
    await page.goto('http://localhost:3000/auth/login')
    await page.fill('#email', email)
    await page.fill('#password', 'testpass123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    
    await page.goto('http://localhost:3000/admin')
    await page.waitForLoadState('networkidle')
    await takeScreenshot(page, '12-admin-dashboard.png')
    recordResult('12-admin-dashboard.png', page.url(), page.url().includes('/admin') ? 'PASS' : 'FAIL')
    
    if (userId) {
      await cleanupUser(email)
    }
  })

  test('13 - Admin Draws', async ({ page }) => {
    const email = generateTestEmail('admindraw')
    const userId = await createTestUser(email, 'testpass123', true, true)
    
    await page.goto('http://localhost:3000/auth/login')
    await page.fill('#email', email)
    await page.fill('#password', 'testpass123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    
    await page.goto('http://localhost:3000/admin/draws')
    await takeScreenshot(page, '13-admin-draws.png')
    recordResult('13-admin-draws.png', page.url(), 'PASS')
    
    if (userId) {
      await cleanupUser(email)
    }
  })

  test.afterAll(async () => {
    const readme = `# Journey Audit Screenshots

Generated: ${new Date().toISOString()}

## Results

| Screenshot | Actual URL | Status |
|------------|------------|--------|
${RESULTS.map(r => `| ${r.screenshot} | ${r.url} | ${r.status} |`).join('\n')}

## Screenshots Captured

${RESULTS.filter(r => r.status === 'PASS').map(r => `- ${r.screenshot}`).join('\n') || 'None'}

## Failed Screenshots

${RESULTS.filter(r => r.status === 'FAIL').map(r => `- ${r.screenshot} (URL: ${r.url})`).join('\n') || 'None'}

## Review Checklist

Please verify each screenshot:

- [ ] **01-homepage.png**: Homepage with charity section, CTAs, draw mechanics
- [ ] **02-signup-step1.png**: Signup form with name/email/password
- [ ] **03-signup-step2.png**: Charity selection options visible
- [ ] **04-signup-step3.png**: Plan selection, no hardcoded emails
- [ ] **05-welcome-screen.png**: Welcome page with confirmation
- [ ] **06-login-page.png**: Clean login form
- [ ] **07-forgot-password.png**: Forgot password form
- [ ] **08-subscribe-page.png**: Subscribe page with options
- [ ] **09-restricted-dashboard.png**: Restricted mode with lock icons
- [ ] **10-full-dashboard.png**: Full dashboard for subscribers
- [ ] **11-scores-page.png**: Score entry form
- [ ] **12-admin-dashboard.png**: Admin dashboard
- [ ] **13-admin-draws.png**: Draw management page

Report any visual issues to the team.
`
    
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'README.md'), readme)
    console.log('\n=== Journey Audit Complete ===')
    console.log(`Screenshots saved to: ${SCREENSHOTS_DIR}`)
    console.log(`README.md generated`)
    RESULTS.forEach(r => console.log(`${r.status}: ${r.screenshot} - ${r.url}`))
  })
})
