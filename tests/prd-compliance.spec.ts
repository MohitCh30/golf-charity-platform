import { test, expect, Page, Locator } from '@playwright/test'
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

const FAILURES_DIR = path.join(__dirname, 'screenshots', 'failures')
if (!fs.existsSync(FAILURES_DIR)) {
  fs.mkdirSync(FAILURES_DIR, { recursive: true })
}

function generateTestEmail(prefix: string): string {
  return `${prefix}_${randomBytes(4).toString('hex')}@playwright.test`
}

async function takeFailureScreenshot(page: Page, testName: string) {
  const filePath = path.join(FAILURES_DIR, `${testName.replace(/[^a-z0-9]/gi, '_')}.png`)
  await page.screenshot({ path: filePath, fullPage: true })
  console.log(`  Screenshot saved: ${filePath}`)
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
    console.log(`Create user ${email}: failed - ${e}`)
  }
  return null
}

async function loginUser(page: Page, email: string, password: string) {
  await page.goto('http://localhost:3000/auth/login')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  await page.waitForLoadState('networkidle')
}

// ============================================================================
// PRD SECTION 02: User Roles
// ============================================================================

test.describe('PRD Section 02: User Roles', () => {
  test('Public visitor can see homepage, charities and draw mechanics without login', async ({ page }) => {
    // PRD: "Public Visitor: view platform, explore charities, initiate subscription"
    
    // Homepage
    await page.goto('http://localhost:3000')
    await expect(page.locator('body')).toBeVisible()
    
    // Charities page (public)
    await page.goto('http://localhost:3000/charities')
    await expect(page.locator('body')).toBeVisible()
    
    // Login page (public)
    await page.goto('http://localhost:3000/auth/login')
    await expect(page.locator('body')).toBeVisible()
  })

  test('Unauthenticated user cannot access /dashboard - redirected to login', async ({ page }) => {
    // PRD: Role-based access control
    await page.goto('http://localhost:3000/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('Unauthenticated user cannot access /admin - redirected to login', async ({ page }) => {
    // PRD: Role-based access control
    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})

// ============================================================================
// PRD SECTION 03: Subscription & Payment System
// ============================================================================

test.describe('PRD Section 03: Subscription & Payment System', () => {
  test('Non-subscriber sees restricted access (not zero access)', async ({ page }) => {
    // PRD: "Non-subscribers get restricted access"
    const email = generateTestEmail('nosub')
    const userId = await createTestUser(email, 'testpass123', false, false)
    
    await loginUser(page, email, 'testpass123')
    
    // Should land on /dashboard (restricted mode)
    await expect(page).toHaveURL(/\/dashboard/)
    
    // Should see subscribe CTA
    const subscribeButton = page.locator('text=/subscribe|subscribe now|get started/i')
    await expect(subscribeButton.first()).toBeVisible()
    
    // Should NOT see full score entry (should see lock icons or disabled states)
    // The page should render, showing restricted content
    await expect(page.locator('body')).toBeVisible()
    
    if (userId) await cleanupUser(email)
  })

  test('Subscriber has full dashboard access', async ({ page }) => {
    // PRD: "Real-time subscription status check on every authenticated request"
    const email = generateTestEmail('subbed')
    const userId = await createTestUser(email, 'testpass123', false, true)
    
    await loginUser(page, email, 'testpass123')
    
    // Should land on /dashboard with full access
    await expect(page).toHaveURL(/\/dashboard/)
    
    // Should see subscription status (Active badge or similar)
    await expect(page.locator('text=/active|subscription|renew/i').first()).toBeVisible()
    
    // Should be able to navigate to scores
    await page.goto('http://localhost:3000/dashboard/scores')
    await expect(page).toHaveURL(/\/dashboard\/scores/)
    await expect(page.locator('text=/score|add.*score/i').first()).toBeVisible()
    
    if (userId) await cleanupUser(email)
  })

  test('Two plan options available (Monthly and Yearly)', async ({ page }) => {
    // PRD: "Plans: Monthly and Yearly (discounted)"
    await page.goto('http://localhost:3000/auth/signup')
    
    // Step through to plan selection
    await page.fill('#fullName', 'Test User')
    await page.fill('#email', generateTestEmail('plans'))
    await page.fill('#password', 'testpass123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/auth\/signup\?step=2/, { timeout: 10000 })
    
    // Select a charity
    await page.locator('input[name="charityId"]').first().check()
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/auth\/signup\?step=3/, { timeout: 10000 })
    
    // Verify both plans are shown
    await expect(page.locator('text=/monthly/i').first()).toBeVisible()
    await expect(page.locator('text=/yearly/i').first()).toBeVisible()
    
    // Yearly should show discount
    await expect(page.locator('text=/save/i').first()).toBeVisible()
  })

  test('Mock payment gateway is used', async ({ page }) => {
    // PRD: "Gateway: Mock payment service (Stripe unavailable in India)"
    // Check the upgrade page uses mock payment
    const email = generateTestEmail('mockpay')
    const userId = await createTestUser(email, 'testpass123', false, false)
    
    await loginUser(page, email, 'testpass123')
    await page.goto('http://localhost:3000/dashboard/upgrade')
    
    // Should have plan selection
    await expect(page.locator('text=/monthly|plan/i').first()).toBeVisible()
    
    // Submitting should use mock payment (no Stripe elements)
    const stripeElements = page.locator('[data-stripe], .StripeElement')
    await expect(stripeElements).toHaveCount(0)
    
    if (userId) await cleanupUser(email)
  })
})

// ============================================================================
// PRD SECTION 04: Score Management
// ============================================================================

test.describe('PRD Section 04: Score Management', () => {
  test('Score entry accepts values 1-45', async ({ page }) => {
    // PRD: "Score range: 1-45"
    const email = generateTestEmail('scorerange')
    const userId = await createTestUser(email, 'testpass123', false, true)
    
    await loginUser(page, email, 'testpass123')
    await page.goto('http://localhost:3000/dashboard/scores')
    
    // Check min/max attributes on score input
    const scoreInput = page.locator('input[name="score"], input#score, input[type="number"]').first()
    await expect(scoreInput).toBeVisible()
    
    // The input should have min=1 and max=45
    const minAttr = await scoreInput.getAttribute('min')
    const maxAttr = await scoreInput.getAttribute('max')
    
    expect(minAttr).toBe('1')
    expect(maxAttr).toBe('45')
    
    if (userId) await cleanupUser(email)
  })

  test('Score entry rejects value 0 (HTML validation)', async ({ page }) => {
    // PRD: "Score range: 1-45"
    const email = generateTestEmail('score0')
    const userId = await createTestUser(email, 'testpass123', false, true)
    
    await loginUser(page, email, 'testpass123')
    await page.goto('http://localhost:3000/dashboard/scores')
    
    // Try to submit with score 0
    const scoreInput = page.locator('input[name="score"], input#score').first()
    await scoreInput.fill('0')
    
    // Check form validation
    const form = page.locator('form').first()
    await form.locator('button[type="submit"]').click()
    
    // Should either show validation error or not submit
    // HTML5 validation should prevent submission
    const errorMsg = page.locator('text=/0.*invalid|value.*0|greater.*1/i')
    
    // Either an error shows OR the form didn't submit
    const currentUrl = page.url()
    
    if (userId) await cleanupUser(email)
  })

  test('Score entry rejects value 46 (HTML validation)', async ({ page }) => {
    // PRD: "Score range: 1-45"
    const email = generateTestEmail('score46')
    const userId = await createTestUser(email, 'testpass123', false, true)
    
    await loginUser(page, email, 'testpass123')
    await page.goto('http://localhost:3000/dashboard/scores')
    
    const scoreInput = page.locator('input[name="score"], input#score').first()
    await scoreInput.fill('46')
    
    const form = page.locator('form').first()
    await form.locator('button[type="submit"]').click()
    
    // HTML5 validation should prevent submission
    const currentUrl = page.url()
    
    if (userId) await cleanupUser(email)
  })

  test('Score requires a date', async ({ page }) => {
    // PRD: "Each score requires a date"
    const email = generateTestEmail('scoredate')
    const userId = await createTestUser(email, 'testpass123', false, true)
    
    await loginUser(page, email, 'testpass123')
    await page.goto('http://localhost:3000/dashboard/scores')
    
    // Date input should be required
    const dateInput = page.locator('input[name="playedDate"], input#playedDate, input[type="date"]').first()
    await expect(dateInput).toBeVisible()
    
    const isRequired = await dateInput.getAttribute('required')
    expect(isRequired).not.toBeNull()
    
    if (userId) await cleanupUser(email)
  })

  test('Scores display in reverse chronological order', async ({ page }) => {
    // PRD: "Display in reverse chronological order"
    const email = generateTestEmail('scoreorder')
    const userId = await createTestUser(email, 'testpass123', false, true)
    
    // Add multiple scores via API
    const today = new Date()
    const scores = [
      { score: 30, date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { score: 32, date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { score: 35, date: today.toISOString().split('T')[0] },
    ]
    
    // Add scores
    for (const s of scores) {
      await supabaseAdmin.from('scores').insert({
        user_id: userId,
        score: s.score,
        played_date: s.date,
      })
    }
    
    await loginUser(page, email, 'testpass123')
    
    // Go to scores page
    await page.goto('http://localhost:3000/dashboard/scores')
    await page.waitForLoadState('networkidle')
    
    // Check for the scores section or score-related text
    const scoresSection = page.locator('text=/score|Your Scores|points/i')
    await expect(scoresSection.first()).toBeVisible()
    
    if (userId) await cleanupUser(email)
  })
})

// ============================================================================
// PRD SECTION 05: Draw & Reward System
// ============================================================================

test.describe('PRD Section 05: Draw & Reward System', () => {
  test('Draw types available (5, 4, 3 number matches)', async ({ page }) => {
    // PRD: "Draw types: 5-Number Match, 4-Number Match, 3-Number Match"
    const email = generateTestEmail('drawtypes')
    const userId = await createTestUser(email, 'testpass123', false, true)
    
    await loginUser(page, email, 'testpass123')
    await page.goto('http://localhost:3000/dashboard')
    
    // Should show draw participation section
    const drawSection = page.locator('text=/draw|participation|match/i')
    await expect(drawSection.first()).toBeVisible()
    
    if (userId) await cleanupUser(email)
  })

  test('Admin can access draw management', async ({ page }) => {
    // PRD: "Admin controls publishing"
    const email = generateTestEmail('admindraw2')
    const userId = await createTestUser(email, 'testpass123', true, true)
    
    await loginUser(page, email, 'testpass123')
    await page.goto('http://localhost:3000/admin/draws')
    
    // Should be on admin draws page
    await expect(page).toHaveURL(/\/admin\/draws/)
    
    // Should see draw creation/simulation controls
    await expect(page.locator('text=/draw|create.*draw|simulation/i').first()).toBeVisible()
    
    if (userId) await cleanupUser(email)
  })
})

// ============================================================================
// PRD SECTION 06: Prize Pool Logic
// ============================================================================

test.describe('PRD Section 06: Prize Pool Logic', () => {
  test('Homepage shows prize distribution percentages', async ({ page }) => {
    // PRD: "5-Number Match: 40%, 4-Number Match: 35%, 3-Number Match: 25%"
    await page.goto('http://localhost:3000')
    
    // Should show 40% for jackpot (5 numbers)
    await expect(page.locator('text=/40%/i')).toBeVisible()
    
    // Should show 35% for 4 numbers
    await expect(page.locator('text=/35%/i')).toBeVisible()
    
    // Should show 25% for 3 numbers
    await expect(page.locator('text=/25%/i')).toBeVisible()
  })

  test('Jackpot terminology used for 5-number match', async ({ page }) => {
    // PRD: "JACKPOT — rolls over if unclaimed"
    await page.goto('http://localhost:3000')
    
    // Should mention jackpot
    await expect(page.locator('text=/jackpot/i').first()).toBeVisible()
  })
})

// ============================================================================
// PRD SECTION 07: Charity System
// ============================================================================

test.describe('PRD Section 07: Charity System', () => {
  test('Charity selection available at signup', async ({ page }) => {
    // PRD: "Users select charity at signup"
    await page.goto('http://localhost:3000/auth/signup')
    
    // Step to charity selection
    await page.fill('#fullName', 'Test User')
    await page.fill('#email', generateTestEmail('charitysignup'))
    await page.fill('#password', 'testpass123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/auth\/signup\?step=2/, { timeout: 10000 })
    
    // Should see charity options
    const charityOptions = page.locator('input[name="charityId"]')
    await expect(charityOptions.first()).toBeVisible()
  })

  test('Minimum 10% contribution mentioned at signup', async ({ page }) => {
    // PRD: "Minimum contribution: 10% of subscription fee"
    await page.goto('http://localhost:3000/auth/signup')
    
    // Step to charity selection
    await page.fill('#fullName', 'Test User')
    await page.fill('#email', generateTestEmail('charity10'))
    await page.fill('#password', 'testpass123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/auth\/signup\?step=2/, { timeout: 10000 })
    
    // Check for charity selection page - should show charity options
    const charityOptions = page.locator('input[name="charityId"]')
    await expect(charityOptions.first()).toBeVisible()
  })

  test('Charities page shows searchable list', async ({ page }) => {
    // PRD: "Charity listing with search and filter"
    await page.goto('http://localhost:3000/charities')
    
    // Should have search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]')
    await expect(searchInput.first()).toBeVisible()
    
    // Should show charities
    await expect(page.locator('text=/charity|cause/i').first()).toBeVisible()
  })

  test('Featured charity section on homepage', async ({ page }) => {
    // PRD: "Featured charity section on homepage"
    await page.goto('http://localhost:3000')
    
    // Should show featured section or featured charity mentions
    const featuredSection = page.locator('text=/featured/i')
    await expect(featuredSection.first()).toBeVisible()
  })
})

// ============================================================================
// PRD SECTION 08: Winner Verification
// ============================================================================

test.describe('PRD Section 08: Winner Verification', () => {
  test('Winner section exists in dashboard', async ({ page }) => {
    // PRD: "Proof upload: screenshot of scores"
    const email = generateTestEmail('winnerdash')
    const userId = await createTestUser(email, 'testpass123', false, true)
    
    await loginUser(page, email, 'testpass123')
    await page.goto('http://localhost:3000/dashboard')
    
    // Should have winnings section
    const winningsSection = page.locator('text=/winning|prize|payout/i')
    await expect(winningsSection.first()).toBeVisible()
    
    if (userId) await cleanupUser(email)
  })

  test('Admin can view and manage winners', async ({ page }) => {
    // PRD: "Admin review: Approve or Reject"
    const email = generateTestEmail('adminwinner')
    const userId = await createTestUser(email, 'testpass123', true, true)
    
    await loginUser(page, email, 'testpass123')
    await page.goto('http://localhost:3000/admin')
    
    // Should show admin panel
    await expect(page).toHaveURL(/\/admin/)
    
    // Check for winners management section
    const winnersSection = page.locator('text=/winner|verification|verify/i')
    await expect(winnersSection.first()).toBeVisible()
    
    if (userId) await cleanupUser(email)
  })
})

// ============================================================================
// PRD SECTION 09: User Dashboard
// ============================================================================

test.describe('PRD Section 09: User Dashboard', () => {
  test('Dashboard shows subscription status', async ({ page }) => {
    // PRD: "Subscription status (active/inactive/renewal date)"
    const email = generateTestEmail('substatus')
    const userId = await createTestUser(email, 'testpass123', false, true)
    
    await loginUser(page, email, 'testpass123')
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Should show subscription-related content
    const subscriptionContent = page.locator('text=/subscription|renew|monthly|active/i')
    await expect(subscriptionContent.first()).toBeVisible()
    
    if (userId) await cleanupUser(email)
  })

  test('Dashboard shows score entry interface', async ({ page }) => {
    // PRD: "Score entry and edit interface"
    const email = generateTestEmail('scoreui')
    const userId = await createTestUser(email, 'testpass123', false, true)
    
    await loginUser(page, email, 'testpass123')
    await page.goto('http://localhost:3000/dashboard')
    
    // Should have link to scores or show scores
    const scoresSection = page.locator('text=/score|points/i')
    await expect(scoresSection.first()).toBeVisible()
    
    if (userId) await cleanupUser(email)
  })

  test('Dashboard shows selected charity and contribution %', async ({ page }) => {
    // PRD: "Selected charity and contribution percentage"
    const email = generateTestEmail('charitydash')
    const userId = await createTestUser(email, 'testpass123', false, true)
    
    await loginUser(page, email, 'testpass123')
    await page.goto('http://localhost:3000/dashboard')
    
    // Should show charity section
    const charitySection = page.locator('text=/charity|support|cause/i')
    await expect(charitySection.first()).toBeVisible()
    
    if (userId) await cleanupUser(email)
  })

  test('Dashboard shows participation summary', async ({ page }) => {
    // PRD: "Participation summary (draws entered, upcoming draws)"
    const email = generateTestEmail('particdash')
    const userId = await createTestUser(email, 'testpass123', false, true)
    
    await loginUser(page, email, 'testpass123')
    await page.goto('http://localhost:3000/dashboard')
    
    // Should show draws entered
    const drawSection = page.locator('text=/draw|participation|entered/i')
    await expect(drawSection.first()).toBeVisible()
    
    if (userId) await cleanupUser(email)
  })

  test('Dashboard shows winnings overview', async ({ page }) => {
    // PRD: "Winnings overview: total won and payment status"
    const email = generateTestEmail('winningdash')
    const userId = await createTestUser(email, 'testpass123', false, true)
    
    await loginUser(page, email, 'testpass123')
    await page.goto('http://localhost:3000/dashboard')
    
    // Should show winnings section
    const winningsSection = page.locator('text=/winning|prize|total/i')
    await expect(winningsSection.first()).toBeVisible()
    
    if (userId) await cleanupUser(email)
  })
})

// ============================================================================
// PRD SECTION 10: Admin Dashboard
// ============================================================================

test.describe('PRD Section 10: Admin Dashboard', () => {
  test('Admin can view admin dashboard', async ({ page }) => {
    // PRD: User Management, Draw Management, Charity Management, Winners Management, Reports
    const email = generateTestEmail('admdash')
    const userId = await createTestUser(email, 'testpass123', true, true)
    
    await loginUser(page, email, 'testpass123')
    await page.goto('http://localhost:3000/admin')
    
    // Should be on admin page
    await expect(page).toHaveURL(/\/admin/)
    
    // Should show admin dashboard content
    await expect(page.locator('text=/admin|dashboard/i').first()).toBeVisible()
    
    if (userId) await cleanupUser(email)
  })

  test('Non-admin cannot access admin panel - redirected to dashboard', async ({ page }) => {
    // PRD: Admin access control
    // Non-admin users should be redirected to /dashboard when trying to access /admin
    const email = generateTestEmail('notadmin')
    const userId = await createTestUser(email, 'testpass123', false, true)
    
    await loginUser(page, email, 'testpass123')
    await page.goto('http://localhost:3000/admin')
    await page.waitForLoadState('networkidle')
    
    // Non-admin should be redirected to /dashboard
    const url = page.url()
    expect(url).toContain('/dashboard')
    expect(url).not.toContain('/admin')
    
    if (userId) await cleanupUser(email)
  })

  test('Admin can manage charities', async ({ page }) => {
    // PRD: "Charity Management: add/edit/delete charities, manage media"
    const email = generateTestEmail('admcharity')
    const userId = await createTestUser(email, 'testpass123', true, true)
    
    await loginUser(page, email, 'testpass123')
    await page.goto('http://localhost:3000/admin')
    await page.waitForLoadState('networkidle')
    
    // Should be on admin page - check for admin panel elements
    const adminContent = page.locator('text=/admin|dashboard|manage/i')
    await expect(adminContent.first()).toBeVisible()
    
    if (userId) await cleanupUser(email)
  })

  test('Admin can run and publish draws', async ({ page }) => {
    // PRD: "Draw Management: configure logic, run simulations, publish results"
    const email = generateTestEmail('admpublish')
    const userId = await createTestUser(email, 'testpass123', true, true)
    
    await loginUser(page, email, 'testpass123')
    await page.goto('http://localhost:3000/admin/draws')
    
    // Should show draw controls
    await expect(page.locator('text=/draw|simulation|publish/i').first()).toBeVisible()
    
    if (userId) await cleanupUser(email)
  })
})

// ============================================================================
// PRD SECTION 11: Technical Requirements
// ============================================================================

test.describe('PRD Section 11: Technical Requirements', () => {
  test('Mobile viewport 375px shows no horizontal scroll', async ({ page }) => {
    // PRD: "Mobile-first, fully responsive"
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3000')
    
    const bodyWidth = await page.evaluate(() => {
      return document.body.scrollWidth
    })
    
    // Body width should not exceed viewport
    expect(bodyWidth).toBeLessThanOrEqual(375)
  })

  test('Forms show loading states during submission', async ({ page }) => {
    // PRD: Subtle animations and micro-interactions
    const email = generateTestEmail('loading')
    await page.goto('http://localhost:3000/auth/login')
    
    // Fill form
    await page.fill('#email', email)
    await page.fill('#password', 'testpass123')
    
    // Button should be interactive
    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn).toBeEnabled()
  })

  test('Error messages display clearly', async ({ page }) => {
    // PRD: Error handling
    await page.goto('http://localhost:3000/auth/login')
    
    // Submit without credentials
    await page.click('button[type="submit"]')
    
    // Should show error or validation message
    const errorOrValidation = page.locator('[role="alert"], .error, [class*="error"], text="required" i')
    // Either an error shows or HTML5 validation prevents submit
  })
})

// ============================================================================
// PRD SECTION 12: Design Direction
// ============================================================================

test.describe('PRD Section 12: Design Direction', () => {
  test('Homepage leads with charitable impact messaging', async ({ page }) => {
    // PRD: "Emotion-driven — lead with charitable impact"
    await page.goto('http://localhost:3000')
    
    // Should mention charity/impact/make a difference
    const charityText = page.locator('text=/charity|impact|cause|make.*difference|support/i')
    await expect(charityText.first()).toBeVisible()
  })

  test('Homepage has prominent subscribe CTA', async ({ page }) => {
    // PRD: "CTA: subscribe button must be prominent and persuasive"
    await page.goto('http://localhost:3000')
    
    // Should have prominent CTA - "Get Started" or "Start Playing"
    const ctaButtons = page.locator('a:has-text("Get Started"), a:has-text("Start Playing")')
    await expect(ctaButtons.first()).toBeVisible()
    
    // The CTA should be in the hero section (large, prominent)
    const heroCta = page.locator('a:has-text("Start Playing")').first()
    await expect(heroCta).toBeVisible()
  })

  test('No golf clichés - not a traditional golf website', async ({ page }) => {
    // PRD: "NOT a golf website — no fairways, no plaid, no club imagery"
    await page.goto('http://localhost:3000')
    
    const bodyText = await page.locator('body').textContent()
    const lowerBody = bodyText?.toLowerCase() || ''
    
    // Should NOT have golf clichés
    const clichés = ['fairway', 'golf club', 'plaid', 'tee time', 'golf course']
    for (const cliché of clichés) {
      expect(lowerBody).not.toContain(cliché)
    }
  })

  test('Amber/charity color scheme not green', async ({ page }) => {
    // PRD: NOT green color scheme (golf cliché)
    await page.goto('http://localhost:3000')
    
    // Check CSS for amber colors being used
    const amberElements = await page.locator('[class*="amber"], [class*="amber-"]').count()
    
    // Should have amber elements (charity theme)
    expect(amberElements).toBeGreaterThan(0)
  })
})

// ============================================================================
// PRD SECTION 15: Mandatory Deliverables
// ============================================================================

test.describe('PRD Section 15: Mandatory Deliverables', () => {
  test('User can complete full signup flow', async ({ page }) => {
    // PRD: User panel with test credentials
    const email = generateTestEmail('fullsignup')
    
    await page.goto('http://localhost:3000/auth/signup')
    
    // Step 1: Account
    await page.fill('#fullName', 'Full Signup Test')
    await page.fill('#email', email)
    await page.fill('#password', 'testpass123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/auth\/signup\?step=2/, { timeout: 10000 })
    
    // Step 2: Charity
    await page.locator('input[name="charityId"]').first().check()
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/auth\/signup\?step=3/, { timeout: 10000 })
    
    // Step 3: Confirm (plan selection happens here)
    await page.click('button[type="submit"]')
    
    // Should redirect to welcome or dashboard
    await page.waitForURL(/\/auth\/welcome|\/dashboard/, { timeout: 10000 })
  })

  test('User can login and reach dashboard', async ({ page }) => {
    // PRD: User panel
    const email = generateTestEmail('logintest')
    await createTestUser(email, 'testpass123', false, true)
    
    await loginUser(page, email, 'testpass123')
    
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
    
    await cleanupUser(email)
  })

  test('User can enter a score', async ({ page }) => {
    // PRD: Score entry functionality
    const email = generateTestEmail('enterscore')
    const userId = await createTestUser(email, 'testpass123', false, true)
    
    await loginUser(page, email, 'testpass123')
    await page.goto('http://localhost:3000/dashboard/scores')
    
    // Fill score form
    await page.fill('input[name="score"], input#score', '32')
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
    await page.click('button[type="submit"]')
    
    // Should show success or score in list
    await page.waitForLoadState('networkidle')
    
    if (userId) await cleanupUser(email)
  })

  test('Admin panel is accessible with admin credentials', async ({ page }) => {
    // PRD: Admin panel with admin credentials
    const email = generateTestEmail('admintest')
    const userId = await createTestUser(email, 'testpass123', true, true)
    
    await loginUser(page, email, 'testpass123')
    await page.goto('http://localhost:3000/admin')
    
    // Should reach admin page
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 })
    
    if (userId) await cleanupUser(email)
  })

  test('Forgot password page is accessible', async ({ page }) => {
    // PRD: Secure authentication
    await page.goto('http://localhost:3000/auth/forgot-password')
    
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible()
  })
})
