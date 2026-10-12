import { expect, test } from '@playwright/test';

for (const width of [390, 1280]) {
  for (const surface of [
    { path: '/governance', selector: '.governance-summary span', count: 3 },
    { path: '/privacy', selector: '.v2-policy-principles span', count: 3 },
    { path: '/privacy', selector: '.v2-policy-layout > aside > p', count: 1 },
  ]) {
    test(`readable labels ${surface.selector} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
      const response = await page.goto(surface.path, { waitUntil: 'domcontentloaded' });
      expect(response?.ok()).toBeTruthy();
      const labels = page.locator(surface.selector);
      await expect(labels).toHaveCount(surface.count);
      for (const label of await labels.all()) {
        expect(await label.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(12);
      }
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      for (const label of await labels.all()) {
        expect(await label.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(24);
        expect(await label.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
      }
    });
  }
}
