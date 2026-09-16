import { defineConfig, devices } from '@playwright/test';

const appWorkspace = process.env.AMAANA_APP_WORKSPACE ?? process.cwd();

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 7_500 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['line'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    colorScheme: 'light',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run start',
    cwd: appWorkspace,
    url: 'http://127.0.0.1:3000/api/health/live',
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      ...process.env,
      AMAANA_BROWSER_ACCEPTANCE: 'true',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
