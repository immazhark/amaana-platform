import { expect, test } from '@playwright/test';

async function openFixture(page, state = 'open') {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const response = await page.goto(`/browser-acceptance/mobile-support?state=${state}`, { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
}

function overlaps(first, second) {
  return !(
    first.x + first.width <= second.x ||
    second.x + second.width <= first.x ||
    first.y + first.height <= second.y ||
    second.y + second.height <= first.y
  );
}

test('open appeal fixture exposes the mobile support action without page overflow', async ({ page }) => {
  await openFixture(page);

  const support = page.getByRole('complementary', { name: 'Quick support action' });
  await expect(support).toBeVisible();
  await expect(support.getByRole('link', { name: 'Support this appeal' })).toHaveAttribute('href', '/donate/browser-acceptance');

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    mainPaddingBottom: getComputedStyle(document.querySelector('main')).paddingBottom,
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  expect(parseFloat(dimensions.mainPaddingBottom)).toBeGreaterThan(60);
});

test('closed appeal fixture has no persistent support action', async ({ page }) => {
  await openFixture(page, 'closed');
  await expect(page.getByRole('complementary', { name: 'Quick support action' })).toHaveCount(0);
});

test('mobile support action and back-to-top control do not overlap after scrolling', async ({ page }) => {
  await openFixture(page);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  const support = page.getByRole('complementary', { name: 'Quick support action' });
  const backToTop = page.getByRole('button', { name: 'Back to top' });
  await expect(support).toBeVisible();
  await expect(backToTop).toBeVisible();

  const supportBox = await support.boundingBox();
  const backBox = await backToTop.boundingBox();
  expect(supportBox).not.toBeNull();
  expect(backBox).not.toBeNull();
  expect(overlaps(supportBox, backBox), 'Support action overlaps Back to top').toBe(false);
});
