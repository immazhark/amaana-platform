import { expect, test } from '@playwright/test';

for (const width of [390, 1280]) {
  test(`donation route labels remain readable at ${width}px and enlarged text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
    const response = await page.goto('/donate', { waitUntil: 'load' });
    expect(response?.ok()).toBeTruthy();
    const routes = page.getByRole('group', { name: 'Donation routes', exact: true });
    const labels = routes.locator('article > span');
    await expect(labels).toHaveCount(2);
    for (const label of await labels.all()) {
      await expect(label).toBeVisible();
      const metrics = await label.evaluate(node => ({
        root: parseFloat(getComputedStyle(document.documentElement).fontSize),
        text: parseFloat(getComputedStyle(node).fontSize),
      }));
      expect(metrics.root).toBeGreaterThanOrEqual(16);
      expect(metrics.text).toBeGreaterThanOrEqual(12);
    }
    // Load an enlarged document, as in the shared typography regressions.
    // Measuring an in-place mutation during hydration produced inconsistent
    // computed sizes; assert the root and label sizes from the same document.
    await page.addInitScript(() => {
      const applyScale = () => {
        const style = document.createElement('style');
        style.textContent = 'html:root { font-size: 200% !important; }';
        document.head.append(style);
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyScale, { once: true });
      } else {
        applyScale();
      }
    });
    expect((await page.reload({ waitUntil: 'load' }))?.ok()).toBeTruthy();
    await expect(labels).toHaveCount(2);
    for (const label of await labels.all()) {
      await expect(label).toBeVisible();
      const metrics = await label.evaluate(node => ({
        root: parseFloat(getComputedStyle(document.documentElement).fontSize),
        text: parseFloat(getComputedStyle(node).fontSize),
      }));
      expect(metrics.root).toBeGreaterThanOrEqual(32);
      expect(metrics.text).toBeGreaterThanOrEqual(24);
      const fits = await label.evaluate(node => {
        const bounds = node.getBoundingClientRect();
        const card = node.closest('article').getBoundingClientRect();
        return bounds.left >= card.left - 1 && bounds.right <= card.right + 1;
      });
      expect(fits).toBe(true);
    }
    for (const article of await routes.locator('article').all()) {
      expect(await article.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
      for (const link of await article.locator('a').all()) {
        const inside = await link.evaluate(node => {
          const bounds = node.getBoundingClientRect();
          const card = node.closest('article').getBoundingClientRect();
          return bounds.left >= card.left - 1 && bounds.right <= card.right + 1;
        });
        expect(inside).toBe(true);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
}
