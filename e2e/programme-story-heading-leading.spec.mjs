import { expect, test } from '@playwright/test';

// AF-R025: test the real published programme story, not generated media or copy.
for (const width of [320, 390]) {
  test(`programme story h2 wraps with readable leading at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
    const response = await page.goto('/our-work/taleem', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    const heading = page.locator('.campaign-story-layout h2');
    await expect(heading).toHaveText('How the programme took shape');
    const box = await heading.evaluate(node => {
      const styles = getComputedStyle(node);
      const height = parseFloat(styles.lineHeight);
      const rect = node.getBoundingClientRect();
      return {
        ratio: height / parseFloat(styles.fontSize),
        lines: rect.height / height,
        left: rect.left,
        right: rect.right,
      };
    });
    expect(box.ratio).toBeGreaterThanOrEqual(1.12);
    expect(box.ratio).toBeLessThanOrEqual(1.24);
    expect(box.lines).toBeGreaterThanOrEqual(1.45);
    expect(box.left).toBeGreaterThanOrEqual(-1);
    expect(box.right).toBeLessThanOrEqual(width + 1);
  });
}
