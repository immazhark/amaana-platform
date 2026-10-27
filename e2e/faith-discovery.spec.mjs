import { expect, test } from '@playwright/test';

test('reviewed reflection filters preserve GET state and reject repeated values', async ({ page }) => {
  const response = await page.goto('/faith-and-reflections?q=zz-review-query-84621&format=ARTICLE', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole('searchbox', { name: 'Search reviewed reflections', exact: true })).toHaveValue('zz-review-query-84621');
  await expect(page.getByRole('combobox', { name: 'Format', exact: true })).toHaveValue('ARTICLE');
  await page.getByRole('link', { name: 'Clear reflection filters', exact: true }).click();
  await expect(page.getByRole('searchbox', { name: 'Search reviewed reflections', exact: true })).toHaveValue('');
  await expect(page.getByRole('combobox', { name: 'Format', exact: true })).toHaveValue('');
  await page.goto('/faith-and-reflections?q=PRIVATE_REPEAT_ONE&q=PRIVATE_REPEAT_TWO', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#faith-search-error')).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Search reviewed reflections', exact: true })).toHaveValue('');
  await expect(page.locator('main')).not.toContainText('PRIVATE_REPEAT_');
});
