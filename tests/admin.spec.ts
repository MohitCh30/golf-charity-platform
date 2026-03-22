import { test, expect } from '@playwright/test'

test.describe('Admin Page', () => {
  test('admin page redirects to login for unauthenticated users', async ({ page }) => {
    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
  
  test('admin page accessible after login', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/login')
    await expect(page.locator('h3')).toContainText('Sign in')
  })
})
