import { expect, test } from '@playwright/test';

for (const width of [390, 1440]) {
  test(`transparency keeps its canonical record without the retired folio CSS at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
    expect((await page.goto('/transparency', { waitUntil: 'load' }))?.ok()).toBe(true);

    await expect(page.locator('#transparency-record')).toBeVisible();
    await expect(page.getByRole('link', { name: 'How accountability works' }).first()).toHaveAttribute(
      'href', '#transparency-record',
    );

    const styles = await page.evaluate(() => {
      let inspected = 0;
      const legacyRules = [];
      for (const sheet of document.styleSheets) {
        // CSS for this route is served from the same origin.
        const rules = sheet.cssRules;
        inspected += 1;
        for (const rule of rules) {
          if (/\.v2-transparency-folio\s*\{/.test(rule.cssText)) legacyRules.push(rule.cssText);
        }
      }
      return { inspected, legacyRules };
    });
    expect(styles.inspected).toBeGreaterThan(0);
    expect(styles.legacyRules).toEqual([]);
  });
}
