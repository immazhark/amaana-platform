import { expect, test } from '@playwright/test';

for (const width of [390, 1280]) {
  test(`donation route labels remain readable at ${width}px and enlarged text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
    const response = await page.goto('/donate', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    const routes = page.getByRole('group', { name: 'Donation routes', exact: true });
    const labels = routes.locator('article > span');
    await expect(labels).toHaveCount(2);
    for (const label of await labels.all()) {
      await expect(label).toBeVisible();
      expect(await label.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(12);
    }
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    for (const label of await labels.all()) {
      expect(await label.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(24);
      const fits = await label.evaluate(node => {
        const bounds = node.getBoundingClientRect();
        const card = node.closest('article').getBoundingClientRect();
        return bounds.left >= card.left - 1 && bounds.right <= card.right + 1;
      });
      expect(fits).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
}
