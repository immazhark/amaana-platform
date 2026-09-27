import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const reviewRoutes = [
  { slug: 'home', path: '/' },
  { slug: 'about', path: '/about' },
  { slug: 'our-work', path: '/our-work' },
  { slug: 'impact', path: '/impact' },
  { slug: 'compliance', path: '/compliance' },
  { slug: 'transparency', path: '/transparency' },
  { slug: 'privacy', path: '/privacy' },
  { slug: 'terms', path: '/terms' },
  { slug: 'refund-policy', path: '/refund-policy' },
  { slug: 'donate', path: '/donate' },
  { slug: 'request-assistance', path: '/request-assistance' },
  { slug: 'partner', path: '/partner' },
];

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
];

const outputDir = path.resolve(process.cwd(), 'launch-review');

test.beforeAll(async () => {
  await fs.mkdir(outputDir, { recursive: true });
});

test.describe('launch review screenshot capture', () => {
  for (const route of reviewRoutes) {
    for (const viewport of viewports) {
      test(`${route.slug} ${viewport.name} launch review capture`, async ({ page }) => {
        test.setTimeout(60_000);

        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.route('**/api/analytics/page-view', request =>
          request.fulfill({ status: 204, body: '' }),
        );

        const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
        expect(response, `Expected a document response for ${route.path}`).not.toBeNull();
        expect(response?.ok(), `Expected ${route.path} to render successfully`).toBeTruthy();
        await expect(page.locator('main#main')).toBeVisible();

        await page.evaluate(async () => {
          if (document.fonts?.ready) await document.fonts.ready;
          window.scrollTo(0, 0);
        });

        // Full-page screenshots do not naturally enter every off-screen element's
        // viewport. Force review-mode painting so content-visibility:auto remains
        // a runtime optimization without producing false blank panels in artifacts.
        await page.addStyleTag({
          content: '* { content-visibility: visible !important; }',
        });

        await page.screenshot({
          path: path.join(outputDir, `${route.slug}--${viewport.name}.jpg`),
          type: 'jpeg',
          quality: 82,
          fullPage: true,
          animations: 'disabled',
          caret: 'hide',
        });
      });
    }
  }

  test('mobile bottom-right companion viewport capture', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/analytics/page-view', request =>
      request.fulfill({ status: 204, body: '' }),
    );

    const response = await page.goto('/about', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    const companion = page.locator('.amaana-companion');
    await expect(companion).toBeVisible();

    await page.screenshot({
      path: path.join(outputDir, 'companion-bottom-right--mobile-viewport.jpg'),
      type: 'jpeg',
      quality: 90,
      fullPage: false,
      animations: 'disabled',
      caret: 'hide',
    });
  });

  test('mobile support bar and companion collision viewport capture', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/analytics/page-view', request =>
      request.fulfill({ status: 204, body: '' }),
    );

    const response = await page.goto('/browser-acceptance/mobile-support?state=open', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('complementary', { name: 'Quick support action' })).toBeVisible();
    await expect(page.locator('.amaana-companion')).toBeVisible();

    await page.screenshot({
      path: path.join(outputDir, 'companion-with-support-bar--mobile-viewport.jpg'),
      type: 'jpeg',
      quality: 90,
      fullPage: false,
      animations: 'disabled',
      caret: 'hide',
    });
  });

});
