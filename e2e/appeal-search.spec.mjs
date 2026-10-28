import { expect, test } from '@playwright/test';

test('public appeal search preserves GET state and rejects malformed search values', async ({ page }) => {
  const response = await page.goto('/appeals?q=zz-no-matching-appeal-84621', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole('searchbox', { name: 'Search active appeals', exact: true })).toHaveValue('zz-no-matching-appeal-84621');
  await expect(page.getByRole('heading', { name: /No active appeals match this search|No Public Appeal Is Open Right Now/ })).toBeVisible();
  await page.getByRole('link', { name: 'Clear appeal search', exact: true }).click();
  await expect(page.getByRole('searchbox', { name: 'Search active appeals', exact: true })).toHaveValue('');
  await page.goto('/appeals?q=PRIVATE_REJECTED_ONE&q=PRIVATE_REJECTED_TWO', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('searchbox', { name: 'Search active appeals', exact: true })).toHaveValue('');
  await expect(page.locator('#appeal-search-error')).toBeVisible();
  await expect(page.locator('main')).not.toContainText('PRIVATE_REJECTED_');
});
