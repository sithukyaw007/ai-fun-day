import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:49741/ai-fun-day/',
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/serve-release.mjs',
    url: 'http://127.0.0.1:49741/ai-fun-day/',
    reuseExistingServer: false,
  },
})
