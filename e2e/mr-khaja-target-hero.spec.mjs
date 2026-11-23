import { expect, test } from '@playwright/test';

for (const width of [320, 390]) {
  test(`Mr. Khaja closed information hero does not invite contributions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));

    const response = await page.goto('/medical-support/mr-khaja', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBe(true);

    const hero = page.locator('.page-hero--long-title');
    await expect(hero).toBeVisible();
    await expect(hero).toContainText('Collection for this appeal is closed');
    await expect(hero).not.toContainText(/approved fundraising target|dedicated checkout.*not yet active/i);
    await expect(hero.getByRole('link', { name: 'Browse current appeals' })).toBeVisible();
    await expect(hero.getByRole('link', { name: /Enquire about support in India/i })).toHaveCount(0);

    const horizontalOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(horizontalOverflow).toBe(false);
  });
}
