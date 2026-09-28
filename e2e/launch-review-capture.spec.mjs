import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const reviewRoutes = [
  { slug: 'home', path: '/' },
  { slug: 'about', path: '/about' },
  { slug: 'our-work', path: '/our-work' },
  { slug: 'impact', path: '/impact' },
  { slug: 'stories', path: '/stories' },
  { slug: 'faith', path: '/faith-and-reflections' },
  { slug: 'get-involved', path: '/get-involved' },
  { slug: 'appeals', path: '/appeals' },
  { slug: 'compliance', path: '/compliance' },
  { slug: 'transparency', path: '/transparency' },
  { slug: 'governance', path: '/governance' },
  { slug: 'how-we-verify', path: '/how-we-verify' },
  { slug: 'recognition', path: '/recognition' },
  { slug: 'partner', path: '/partner' },
  { slug: 'contact', path: '/contact' },
  { slug: 'privacy', path: '/privacy' },
  { slug: 'terms', path: '/terms' },
  { slug: 'donation-policy', path: '/donation-policy' },
  { slug: 'refund-policy', path: '/refund-policy' },
  { slug: 'donate', path: '/donate' },
  { slug: 'request-assistance', path: '/request-assistance' },
  { slug: 'request-status', path: '/request-assistance/status' },
  { slug: 'eid-gift-kits', path: '/our-work/eid-gift-kits' },
  { slug: 'qurbani', path: '/our-work/qurbani-meat-distribution' },
  { slug: 'taleem', path: '/our-work/taleem' },
  { slug: 'winter-relief', path: '/our-work/winter-relief' },
  { slug: 'dates-distribution', path: '/our-work/dates-distribution' },
  { slug: 'flood-relief', path: '/our-work/hyderabad-flood-relief-2020' },
  { slug: 'medical-assistance', path: '/our-work/medical-financial-assistance' },
];

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1366, height: 900 },
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'large-desktop', width: 1920, height: 1080 },
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
        await expect(page.locator('body')).not.toHaveClass(/error/i);
        const geometry = await page.evaluate(() => ({
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: document.documentElement.clientWidth,
          headingCount: document.querySelectorAll('main h1').length,
        }));
        expect(geometry.headingCount, `Expected a real route heading for ${route.path}`).toBeGreaterThanOrEqual(1);
        expect(geometry.documentWidth, `Horizontal overflow on ${route.path} at ${viewport.name}`).toBeLessThanOrEqual(geometry.viewportWidth + 1);

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
