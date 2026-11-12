import { expect, test } from '@playwright/test';

for (const width of [320, 390]) {
  test(`Mr. Khaja information hero shows approved target without activating checkout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));

    const response = await page.goto('/medical-support/mr-khaja', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBe(true);

    const hero = page.locator('.page-hero--long-title');
    await expect(hero).toBeVisible();
    await expect(hero).toContainText('₹5,00,000');
    await expect(hero).toContainText(/approved fundraising target/i);
    await expect(hero).toContainText(/dedicated checkout.*not yet active/i);
    await expect(hero.getByRole('link', { name: 'Enquire about support in India' })).toBeVisible();

    const horizontalOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(horizontalOverflow).toBe(false);
  });
}
