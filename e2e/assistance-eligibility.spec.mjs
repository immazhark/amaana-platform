import { expect, test } from '@playwright/test';

test('an out-of-area beneficiary is told so and cannot continue to sensitive fields', async ({ page }) => {
  await page.goto('/request-assistance');
  await expect(page.getByRole('heading', { name: 'Who we can currently help' })).toBeVisible();
  await expect(page.locator('a[href^="tel:"], a[href*="wa.me"]')).toHaveCount(0);
  await page.getByLabel('Somewhere else').check();
  await expect(page.getByRole('status').filter({ hasText: 'Hyderabad service area' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue to need →' })).toBeDisabled();
  await page.getByLabel('In our Hyderabad service area').check();
  await expect(page.getByRole('button', { name: 'Continue to need →' })).toBeEnabled();
});
