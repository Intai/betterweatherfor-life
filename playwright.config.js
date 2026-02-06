import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

export default defineConfig({
  testDir: './app',
  testMatch: '**/docs/*.spec.js',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  maxFailures: 1,
  retries: 0,
  workers: 1,
  timeout: 120000, // 2 minutes for all tests
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  expect: {
    timeout: 30000, // 30 seconds for assertions
  },
  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  }],
  webServer: [{
    command: 'make dev-bg',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  }],
})
