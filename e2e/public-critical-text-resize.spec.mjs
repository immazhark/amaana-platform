import { expect, test } from '@playwright/test';

// AF-R042: this is synthetic 200/400% *root text enlargement* coverage.
// It is not native browser zoom or physical assistive-technology acceptance.
// Check priority public routes without submitting forms or loading payments.
const routes = [
  { path: '/contact', label: 'Contact' },
  { path: '/donate', label: 'Donate' },
  { path: '/request-assistance', label: 'Request Assistance' },
];

const textScales = [
  { width: 390, percent: 200, rootMin: 32 },
  { width: 1280, percent: 400, rootMin: 64 },
];

for (const { width, percent, rootMin } of textScales) {
  for (const route of routes) {
    test(`${route.label} contains page content at ${percent}% enlarged text and ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.route('**/api/analytics/page-view', request =>
        request.fulfill({ status: 204, body: '' }),
      );
      // Apply the text scale before React hydration, rather than mutating font
      // sizes mid-page. This avoids measuring mixed style/layout generations.
      await page.addInitScript(scale => {
        const apply = () => {
          const style = document.createElement('style');
          style.dataset.amaanaSyntheticTextScale = String(scale);
          style.textContent = `html:root { font-size: ${scale}% !important; }`;
          document.head.append(style);
        };
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', apply, { once: true });
        } else {
          apply();
        }
      }, percent);

      const response = await page.goto(route.path, { waitUntil: 'load' });
      expect(response?.ok(), route.path).toBeTruthy();
      const main = page.locator('main#main');
      await expect(main).toBeVisible();
      const heading = main.locator('h1').first();
      await expect(heading).toBeVisible();

      const geometry = await page.evaluate(() => {
        const title = document.querySelector('main#main h1');
        const box = title?.getBoundingClientRect();
        return {
          rootFontPx: parseFloat(getComputedStyle(document.documentElement).fontSize),
          documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
          viewportWidth: document.documentElement.clientWidth,
          headingText: title?.textContent?.trim() ?? '',
          headingLeft: box?.left ?? -1000,
          headingRight: box?.right ?? 100000,
        };
      });

      expect(geometry.rootFontPx, route.path).toBeGreaterThanOrEqual(rootMin);
      expect(geometry.headingText.length, route.path).toBeGreaterThan(4);
      expect(geometry.headingLeft, route.path).toBeGreaterThanOrEqual(-1);
      expect(geometry.headingRight, route.path).toBeLessThanOrEqual(width + 1);
      expect(geometry.documentWidth, `${route.path}: page overflow with ${percent}% root text`)
        .toBeLessThanOrEqual(geometry.viewportWidth + 1);
    });
  }
}
