import { expect, test } from '@playwright/test';

// AF-R025: exercise the actual Impact stylesheet with synthetic wrapping text.
// No live impact data, donor identity, or beneficiary information is needed.
for (const width of [320, 390]) {
  test(`Impact card programme headings have legible wrapped line boxes at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
    const response = await page.goto('/impact', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();

    const metrics = await page.evaluate(() => {
      const copy = document.createElement('div');
      copy.className = 'v2-impact-tile-copy';
      copy.style.width = '8rem';
      copy.style.position = 'absolute';
      copy.style.left = '-10000px';
      const heading = document.createElement('h3');
      heading.textContent = 'Synthetic published programme title for narrow-screen wrapping checks';
      copy.append(heading);
      document.querySelector('main').append(copy);
      try {
        const style = getComputedStyle(heading);
        const range = document.createRange();
        range.selectNodeContents(heading);
        return {
          ratio: parseFloat(style.lineHeight) / parseFloat(style.fontSize),
          lineFragments: range.getClientRects().length,
        };
      } finally {
        copy.remove();
      }
    });
    expect(metrics.lineFragments).toBeGreaterThan(1);
    expect(metrics.ratio).toBeGreaterThanOrEqual(1.12);
    expect(metrics.ratio).toBeLessThanOrEqual(1.24);
  });
}
