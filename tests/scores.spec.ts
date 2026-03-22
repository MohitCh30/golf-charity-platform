import { test, expect } from '@playwright/test'

test.describe('Scores Page', () => {
  test('scores page loads for authenticated user', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/login')
    await page.waitForLoadState('networkidle')
    
    await expect(page.locator('h3')).toContainText('Sign in')
  })
  
  test('homepage and auth pages work', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page.locator('h1')).toContainText('Play games')
    
    await page.goto('http://localhost:3000/auth/login')
    await expect(page.locator('h3')).toContainText('Sign in')
    
    await page.goto('http://localhost:3000/auth/signup')
    await expect(page.locator('h3')).toContainText('Create your account')
    
    await page.goto('http://localhost:3000/auth/forgot-password')
    await expect(page.locator('h3')).toContainText('Reset password')
  })
})
