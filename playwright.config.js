import { execSync } from 'child_process'
import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

// Derived here rather than only in the specs so that the workers (which inherit this environment)
// and globalTeardown all resolve the same VRT build.
const gitOutput = command => {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    // Not a git checkout.
    return ''
  }
}

// The VRT SDK has no default branch name. Leave it unset when it cannot be
// derived rather than guessing, so a wrong branch can never pollute another
// branch's baselines - VRT specs then fail with "branchName is not specified".
process.env.VRT_BRANCHNAME ||= gitOutput('git branch --show-current')
// One build per commit: the VRT backend upserts a build on (project, ciBuildId), so every worker
// reports into a single build and globalTeardown can find it again to close it.
process.env.VRT_CIBUILDID ||= gitOutput('git rev-parse HEAD')
// Default soft-assert to true unless the project opted into strict mode
process.env.VRT_ENABLESOFTASSERT ??= 'true'

// PLAYWRIGHT_WEB_SERVER is ours, not one of Playwright's own PLAYWRIGHT_* variables - it
// overrides the webServer command below. The Makefile e2e targets set it: prod-e2e points
// BASE_URL at nginx and PLAYWRIGHT_WEB_SERVER at the prod compose profile, while
// k8s-prod-e2e clears it because the site it tests is already deployed. Nullish coalescing
// rather than || so that cleared empty string means "manage no server" instead of the default.
const baseURL = process.env.BASE_URL || 'http://localhost:3000'
const webServerCommand = process.env.PLAYWRIGHT_WEB_SERVER ?? 'make dev-bg'

export default defineConfig({
  testDir: './app',
  testMatch: '**/docs/*.spec.js',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  maxFailures: 1,
  retries: 0,
  workers: 1,
  timeout: 60000, // 1 minute for all tests
  reporter: 'html',
  // Closes the VRT build once per run - see the file for why afterAll cannot own this.
  globalTeardown: './app/(app)/docs/vrt-teardown.js',
  use: {
    baseURL,
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
  // No server to manage when testing an already deployed site - see PLAYWRIGHT_WEB_SERVER above.
  webServer: webServerCommand ? [{
    command: webServerCommand,
    url: baseURL,
    timeout: 120000, // 2 minutes, the production stage may need a cold build
    reuseExistingServer: !process.env.CI,
  }] : undefined,
})
