import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('verify homepage loads, charity section shows, CTA links work', async ({ page }) => {
    await page.goto('http://localhost:3000')
    
    await expect(page.locator('h1')).toContainText('Play games')
    
    await expect(page.getByRole('heading', { name: /help others/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /win prizes/i })).toBeVisible()

    const startPlayingButton = page.locator('a:has-text("Start Playing")')
    await expect(startPlayingButton).toBeVisible()

    const exploreCharitiesButton = page.locator('a:has-text("Explore Charities")')
    await expect(exploreCharitiesButton).toBeVisible()

    await expect(page.getByText('How it works')).toBeVisible()
    await expect(page.getByText('Featured Charities')).toBeVisible()
    await expect(page.getByText('Draw Mechanics')).toBeVisible()

    await expect(page.getByRole('heading', { name: 'Subscribe' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Enter Scores' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Win & Give' })).toBeVisible()

    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    await expect(footer.locator('text=GolfGive')).toBeVisible()

    await page.goto('http://localhost:3000/auth/login')
    await expect(page.locator('h3')).toContainText('Sign in')

    await page.goto('http://localhost:3000/auth/signup')
    await expect(page.locator('h3')).toContainText('Create your account')
  })

  test('navigation works correctly', async ({ page }) => {
    await page.goto('http://localhost:3000')
    
    const signInLink = page.locator('a:has-text("Sign In")').first()
    await signInLink.click()
    await expect(page).toHaveURL(/\/auth\/login/)

    await page.goto('http://localhost:3000')
    const getStartedButton = page.locator('a:has-text("Get Started")')
    await getStartedButton.click()
    await expect(page).toHaveURL(/\/auth\/signup/)
  })
})
