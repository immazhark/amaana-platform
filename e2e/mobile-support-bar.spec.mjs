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

test('mobile support action, companion dock and back-to-top control remain collision-free', async ({ page }) => {
  await openFixture(page);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  const support = page.getByRole('complementary', { name: 'Quick support action' });
  const companion = page.locator('.amaana-companion-dock');
  const backToTop = page.getByRole('button', { name: 'Back to top' });
  await expect(support).toBeVisible();
  await expect(companion).toBeVisible();
  await expect(backToTop).toBeVisible();

  const supportBox = await support.boundingBox();
  const companionBox = await companion.boundingBox();
  const backBox = await backToTop.boundingBox();
  expect(supportBox).not.toBeNull();
  expect(companionBox).not.toBeNull();
  expect(backBox).not.toBeNull();
  expect(overlaps(supportBox, companionBox), 'Support action overlaps bottom-right companion dock').toBe(false);
  expect(overlaps(supportBox, backBox), 'Support action overlaps Back to top').toBe(false);
  expect(overlaps(companionBox, backBox), 'Bottom-right companion dock overlaps Back to top').toBe(false);
});

for (const width of [320, 360, 375, 390, 391, 414, 430, 760]) {
  test(`mobile support action reflows at ${width}px with enlarged text`, async ({ page }) => {
    await openFixture(page);
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(() => {
      const root = document.documentElement;
      root.style.fontSize = `${parseFloat(getComputedStyle(root).fontSize) * 2}px`;
    });
    await page.evaluate(() => document.fonts.ready);
    const support = page.getByRole('complementary', { name: 'Quick support action' });
    const action = support.getByRole('link', { name: 'Support this appeal' });
    await action.focus();
    await expect(action).toBeFocused();
    const geometry = await action.evaluate(element => {
      const bounds = element.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(element);
      const text = range.getBoundingClientRect();
      const bar = element.closest('aside').getBoundingClientRect();
      const style = getComputedStyle(element);
      const focusMargin = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
      return {
        left: bounds.left,
        right: bounds.right,
        viewport: document.documentElement.clientWidth,
        focusMargin,
        textFits: text.left >= bounds.left - 1 && text.right <= bounds.right + 1,
        barHeight: bar.height,
        reserved: parseFloat(getComputedStyle(document.querySelector('main')).paddingBottom),
      };
    });
    expect(geometry.left).toBeGreaterThanOrEqual(geometry.focusMargin - 1);
    expect(geometry.right + geometry.focusMargin).toBeLessThanOrEqual(geometry.viewport + 1);
    expect(geometry.textFits).toBe(true);
    expect(geometry.barHeight).toBeLessThanOrEqual(geometry.reserved + 1);
  });
}
