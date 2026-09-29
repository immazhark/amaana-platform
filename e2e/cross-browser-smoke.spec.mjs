import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/our-work',
  '/impact',
  '/donate',
  '/request-assistance',
  '/privacy',
];

async function open(page, path, width) {
  await page.setViewportSize({ width, height: width <= 375 ? 812 : 900 });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  expect(response, `Expected a document response for ${path}`).not.toBeNull();
  expect(response?.ok(), `Expected ${path} to render successfully`).toBeTruthy();
  await expect(page.locator('main#main')).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);
}

test.describe('cross-browser public-surface smoke', () => {
  for (const width of [375, 1440]) {
    for (const path of routes) {
      test(`${path} stays contained and navigable at ${width}px`, async ({ page }) => {
        await open(page, path, width);

        const geometry = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        }));
        expect(geometry.scrollWidth, `${path} overflowed horizontally at ${width}px`).toBeLessThanOrEqual(geometry.clientWidth + 1);

        const skip = page.getByRole('link', { name: 'Skip to content' });
        await page.keyboard.press('Tab');
        await expect(skip).toBeFocused();
      });
    }
  }
});
