import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const representativeRoutes = [
  { path: '/', family: 'Home' },
  { path: '/about', family: 'Level 1' },
  { path: '/get-involved/sponsor-education', family: 'Level 2' },
  { path: '/governance', family: 'Trust & Policies' },
  { path: '/donate', family: 'Purpose · action' },
  { path: '/how-we-verify', family: 'Purpose · information' },
  { path: '/recognition', family: 'Purpose · recognition' },
  { path: '/request-assistance', family: 'Assistance journey' },
];

const acceptanceWidths = [1440, 1024, 768, 430, 390, 360];

async function openPublicPage(page, path) {
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  expect(response, `Expected a document response for ${path}`).not.toBeNull();
  expect(response?.ok(), `Expected ${path} to render successfully`).toBeTruthy();
  await expect(page.locator('main#main')).toBeVisible();
}

function rectanglesOverlap(first, second) {
  return !(
    first.x + first.width <= second.x ||
    second.x + second.width <= first.x ||
    first.y + first.height <= second.y ||
    second.y + second.height <= first.y
  );
}

test.describe('representative public accessibility', () => {
  for (const route of representativeRoutes) {
    test(`${route.family}: ${route.path} has no serious or critical axe violations`, async ({ page }) => {
      await openPublicPage(page, route.path);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const blocking = results.violations
        .filter(violation => violation.impact === 'critical' || violation.impact === 'serious')
        .map(violation => ({
          id: violation.id,
          impact: violation.impact,
          help: violation.help,
          nodes: violation.nodes.map(node => ({
            target: node.target,
            html: node.html,
            failureSummary: node.failureSummary,
          })),
        }));

      expect(blocking, `Blocking accessibility violations on ${route.path}`).toEqual([]);
    });
  }
});

test.describe('responsive containment', () => {
  for (const route of representativeRoutes) {
    for (const width of acceptanceWidths) {
      test(`${route.family}: ${route.path} contains content at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: width <= 430 ? 844 : 900 });
        await openPublicPage(page, route.path);

        const dimensions = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        }));

        expect(
          dimensions.scrollWidth,
          `${route.path} overflowed horizontally at ${width}px`,
        ).toBeLessThanOrEqual(dimensions.clientWidth + 1);
      });
    }
  }
});

test('skip link moves focus to the main content landmark', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPublicPage(page, '/about');

  const skipLink = page.getByRole('link', { name: 'Skip to content' });
  const main = page.locator('main#main');
  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(main).toBeFocused();
});

test('representative public pages expose one primary heading and an English document language', async ({ page }) => {
  for (const route of representativeRoutes) {
    await openPublicPage(page, route.path);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('main#main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
  }
});

test('desktop keyboard order starts with the skip link and primary home link', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPublicPage(page, '/about');

  const skipLink = page.getByRole('link', { name: 'Skip to content' });
  const primaryNav = page.getByRole('navigation', { name: 'Primary navigation' });
  const homeLink = primaryNav.getByRole('link', { name: 'Amaana Foundation home' });

  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(homeLink).toBeFocused();
});

test('mobile navigation opens, moves focus inside, closes with Escape and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPublicPage(page, '/about');

  const toggle = page.locator('button[aria-controls="mobile-navigation"]');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.focus();
  await page.keyboard.press('Enter');

  const mobileNav = page.getByRole('navigation', { name: 'Mobile navigation' });
  await expect(mobileNav).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(mobileNav.getByRole('link', { name: 'Our Work' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(mobileNav).toBeHidden();
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('reduced-motion preference disables reminder autoplay', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPublicPage(page, '/donate');

  expect(await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  const autoplay = page.locator('.amaana-reminder-controls button').first();
  await expect(autoplay).toBeDisabled();
  await expect(autoplay).toHaveText('Motion off');
});

test('mobile floating companion and Back to top controls do not overlap', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPublicPage(page, '/about');

  await page.evaluate(() => window.scrollTo(0, Math.max(1000, document.body.scrollHeight)));

  const backToTop = page.getByRole('button', { name: 'Back to top' });
  const companion = page.locator('.amaana-companion-dock');
  await expect(backToTop).toBeVisible();
  await expect(companion).toBeVisible();

  const backBox = await backToTop.boundingBox();
  const companionBox = await companion.boundingBox();
  expect(backBox).not.toBeNull();
  expect(companionBox).not.toBeNull();
  expect(rectanglesOverlap(backBox, companionBox), 'Floating controls overlap at 390px').toBe(false);

  await backToTop.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(10);
});
