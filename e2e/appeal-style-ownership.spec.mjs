import { expect, test } from '@playwright/test';

for (const width of [320, 390, 1440]) {
  test(`route-owned appeal styles retain cards and detail progress at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
    const response = await page.goto('/browser-acceptance/appeals');
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'Appeal stylesheet acceptance' })).toBeVisible();
    await expect(page.getByRole('progressbar')).toHaveCount(2);
    const cards = page.locator('.v2-appeal-card');
    await expect(cards).toHaveCount(2);
    await expect(cards.first()).toHaveCSS('display', 'flex');
    // Shared accessibility authority uses 0.01ms to finish transition events.
    const durations = await cards.first().evaluate(el => getComputedStyle(el).transitionDuration.split(',').map(value => Number.parseFloat(value)));
    expect(durations.every(value => value <= 0.00001)).toBe(true);
    await expect(cards.first().locator('.v2-appeal-card-body')).toHaveCSS('display', 'flex');
    for (const bar of await page.locator('.v2-appeal-progress').all()) {
      await expect(bar).toHaveCSS('overflow', 'hidden');
      const dimensions = await bar.evaluate(el => ({ bar: el.getBoundingClientRect().width, fill: el.firstElementChild.getBoundingClientRect().width, height: el.getBoundingClientRect().height }));
      expect(dimensions.height).toBeGreaterThan(0);
      expect(dimensions.fill / dimensions.bar).toBeCloseTo(0.2, 2);
    }
    const link = cards.first().getByRole('link');
    await link.focus();
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS('outline-style', 'solid');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
