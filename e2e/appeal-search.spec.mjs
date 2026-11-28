import { expect, test } from '@playwright/test';
import { waitForPublicOverview } from './helpers/public-overview-ready.mjs';

test('public appeal search preserves GET state and rejects malformed search values', async ({ page }) => {
  const response = await page.goto('/appeals?q=zz-no-matching-appeal-84621', { waitUntil: 'domcontentloaded' });
  await waitForPublicOverview(page, '/appeals?q=zz-no-matching-appeal-84621');
  expect(response?.ok()).toBeTruthy();
  const search = page.getByRole('search', { name: 'Search active appeals', exact: true });
  await expect(search).toHaveCount(1);
  await expect(search.getByRole('searchbox')).toHaveAttribute('enterkeyhint', 'search');
  await expect(page.getByRole('searchbox', { name: 'Search active appeals', exact: true })).toHaveValue('zz-no-matching-appeal-84621');
  await expect(page.getByRole('heading', { name: /No active appeals match this search|No Public Appeal Is Open Right Now/ })).toBeVisible();
  await page.getByRole('link', { name: 'Clear appeal search', exact: true }).click();
  await expect(page.getByRole('searchbox', { name: 'Search active appeals', exact: true })).toHaveValue('');
  await search.getByRole('searchbox').fill('zz-keyboard-search-84621');
  await search.getByRole('searchbox').press('Enter');
  await expect(page).toHaveURL(/\/appeals\?q=zz-keyboard-search-84621#current-appeals$/);
  await expect(search.getByRole('searchbox')).toHaveValue('zz-keyboard-search-84621');
  await page.goto('/appeals?q=PRIVATE_REJECTED_ONE&q=PRIVATE_REJECTED_TWO', { waitUntil: 'domcontentloaded' });
  await waitForPublicOverview(page, '/appeals?q=PRIVATE_REJECTED_ONE&q=PRIVATE_REJECTED_TWO');
  await expect(page.getByRole('searchbox', { name: 'Search active appeals', exact: true })).toHaveValue('');
  await expect(page.locator('#appeal-search-error')).toBeVisible();
  await expect(page.locator('main')).not.toContainText('PRIVATE_REJECTED_');
});
