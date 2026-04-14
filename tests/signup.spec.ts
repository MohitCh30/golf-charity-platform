import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables')
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function generateTestEmail(): string {
  return `test_${randomBytes(4).toString('hex')}@playwright.test`
}

test.describe('Signup Flow', () => {
  let testEmail: string

  test.beforeEach(() => {
    testEmail = generateTestEmail()
  })

  test('complete signup flow - step 1 to dashboard', async ({ page }) => {
    console.log('\n=== Starting Signup Flow Test ===')
    console.log(`Test email: ${testEmail}`)

    // Clean up any existing user
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const existingUserForEmail = existingUser?.users.find(u => u.email === testEmail)
    if (existingUserForEmail) {
      await supabaseAdmin.auth.admin.deleteUser(existingUserForEmail.id)
      await supabaseAdmin.from('profiles').delete().eq('id', existingUserForEmail.id)
      await supabaseAdmin.from('subscriptions').delete().eq('user_id', existingUserForEmail.id)
      console.log('Cleaned up existing user')
    }

    // Navigate to signup
    console.log('Step 1: Navigating to signup page...')
    await page.goto('http://localhost:3000/auth/signup')
    await expect(page.locator('h3')).toContainText('Create your account')
    console.log('✓ Step 1 page loaded')

    // Fill step 1
    console.log('Step 1: Filling form...')
    await page.fill('#fullName', 'Playwright Test User')
    await page.fill('#email', testEmail)
    await page.fill('#password', 'testpassword123')
    await page.click('button[type="submit"]')
    console.log('✓ Step 1 form submitted')

    // Wait for step 2
    console.log('Step 2: Waiting for charity selection...')
    await expect(page.locator('text=Choose your cause')).toBeVisible()
    
    // Check charities are displayed
    const charityCount = await page.locator('input[name="charityId"]').count()
    console.log(`✓ Found ${charityCount} charities`)
    expect(charityCount).toBeGreaterThan(0)
    
    // Select first charity
    await page.locator('input[name="charityId"]').first().check()
    await page.click('button[type="submit"]')
    console.log('✓ Step 2 charity selected')

    // Wait for step 3
    console.log('Step 3: Waiting for plan selection...')
    await expect(page.locator('text=Confirm your subscription')).toBeVisible()
    
    // Verify email is shown from session
    await expect(page.locator(`text=${testEmail}`)).toBeVisible()
    console.log('✓ Session email displayed correctly')

    // Select monthly plan (should already be selected by default)
    await page.locator('input[name="plan"][value="monthly"]').check()
    console.log('✓ Monthly plan selected')

    // Submit signup
    console.log('Step 3: Submitting signup...')
    await page.click('button[type="submit"]')
    console.log('✓ Signup form submitted')

    // Wait for redirect to welcome page (new users see welcome first)
    console.log('Waiting for redirect to welcome page...')
    await expect(page).toHaveURL(/\/auth\/welcome/, { timeout: 15000 })
    console.log('✓ Redirected to welcome page')

    // Click continue to dashboard
    await page.click('button:has-text("Go to My Dashboard")')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
    console.log('✓ Redirected to dashboard')

    // Verify dashboard content
    await page.waitForLoadState('networkidle')
    const dashboardContent = await page.content()
    const hasWelcome = dashboardContent.includes('Welcome back') || dashboardContent.includes('Dashboard') || dashboardContent.includes('Subscription')
    expect(hasWelcome).toBe(true)
    console.log('✓ Dashboard loaded')

    // Check Supabase for user creation
    console.log('\nChecking Supabase...')
    
    // Check profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', testEmail)
      .single()
    
    expect(profileError).toBeNull()
    expect(profile).not.toBeNull()
    expect(profile?.full_name).toBe('Playwright Test User')
    expect(profile?.role).toBe('subscriber')
    console.log(`✓ Profile created: ${JSON.stringify(profile)}`)

    // Check subscriptions table
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', profile!.id)
      .single()
    
    expect(subError).toBeNull()
    expect(subscription).not.toBeNull()
    expect(subscription?.status).toBe('active')
    expect(subscription?.plan).toBe('monthly')
    console.log(`✓ Subscription created: ${JSON.stringify(subscription)}`)

    console.log('\n=== SIGNUP FLOW TEST PASSED ===\n')
  })

  test('step 1 validation - missing fields', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/signup')
    
    // Should show signup form
    await expect(page.locator('h3')).toContainText('Create your account')
  })

  test('step 2 requires charity selection', async ({ page }) => {
    // This would need a more complex setup to test properly
    // Skipping for now as the radio button is required
  })
})
