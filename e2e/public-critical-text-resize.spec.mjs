import { expect, test } from '@playwright/test';

// AF-R042: distinguish 200% root-text enlargement from a 400% zoom-equivalent
// *CSS viewport* reflow (1280px / 4 = 320px). Neither is real browser zoom
// or physical assistive-technology acceptance.
// Check priority public routes without submitting forms or loading payments.
const routes = [
  { path: '/contact', label: 'Contact' },
  { path: '/donate', label: 'Donate' },
  { path: '/request-assistance', label: 'Request Assistance' },
];

const reflowScenarios = [
  { width: 390, rootPercent: 200, rootMin: 32, label: '200% enlarged text' },
  { width: 320, rootPercent: 100, rootMin: 16, label: '400% zoom-equivalent viewport' },
];

for (const { width, rootPercent, rootMin, label } of reflowScenarios) {
  for (const route of routes) {
    test(`${route.label} contains page content with ${label} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.route('**/api/analytics/page-view', request =>
        request.fulfill({ status: 204, body: '' }),
      );
      // Apply only the 200% text scale before hydration. At 400% zoom,
      // browser CSS viewport width decreases, while root font-size in CSS
      // pixels does not become 64px on an unchanged desktop viewport.
      if (rootPercent > 100) await page.addInitScript(scale => {
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
      }, rootPercent);

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
      expect(geometry.documentWidth, `${route.path}: page overflow with ${label}`)
        .toBeLessThanOrEqual(geometry.viewportWidth + 1);
    });
  }
}
