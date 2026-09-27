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
});
