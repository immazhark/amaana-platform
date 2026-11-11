import { expect, test } from '@playwright/test';

// AF-R025: verify real Stories ethics content without adding fabricated media.
for (const width of [320, 390]) {
  test(`Stories editorial ethic headings retain readable leading at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
    const response = await page.goto('/stories', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();

    const section = page.locator('.v2-stories-ethic-list');
    const headings = section.locator('h3');
    await expect(headings).toHaveCount(3);
    await expect(headings).toHaveText([
      'Permission before publication',
      'Proof without exposure',
      'Facts without embellishment',
    ]);

    const metrics = await headings.evaluateAll(nodes => nodes.map(node => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return {
        ratio: parseFloat(style.lineHeight) / parseFloat(style.fontSize),
        left: rect.left,
        right: rect.right,
      };
    }));
    for (const metric of metrics) {
      expect(metric.ratio).toBeGreaterThanOrEqual(1.12);
      expect(metric.ratio).toBeLessThanOrEqual(1.24);
      expect(metric.left).toBeGreaterThanOrEqual(-1);
      expect(metric.right).toBeLessThanOrEqual(width + 1);
    }
  });
}
