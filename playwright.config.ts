import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 10000
  },
  use: {
    headless: true,
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
    timeout: 60000,
  },
});
