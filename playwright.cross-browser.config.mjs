import { defineConfig, devices } from '@playwright/test';

const appWorkspace = process.env.AMAANA_APP_WORKSPACE ?? process.cwd();

export default defineConfig({
  testDir: './e2e',
  testMatch: /cross-browser-smoke\.spec\.mjs/,
  timeout: 30_000,
  expect: { timeout: 7_500 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['line']] : [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    colorScheme: 'light',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run start',
    cwd: appWorkspace,
    url: 'http://127.0.0.1:3000/api/health/live',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      AMAANA_BROWSER_ACCEPTANCE: 'true',
    },
  },
  projects: [
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
