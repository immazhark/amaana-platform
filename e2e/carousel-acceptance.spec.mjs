import { expect, test } from '@playwright/test';

async function open(page, path, width = 1440) {
  await page.setViewportSize({ width, height: width <= 430 ? 844 : 900 });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  expect(response?.ok(), `${path} should render`).toBeTruthy();
  await expect(page.locator('main#main')).toBeVisible();
}

test('long programme histories use a keyboard-operable compact carousel', async ({ page }) => {
  await open(page, '/our-work/eid-gift-kits');

  const carousel = page.getByRole('region', { name: 'Programme years' });
  await expect(carousel).toBeVisible();

  const slides = carousel.locator('[aria-roledescription="slide"]');
  const slideCount = await slides.count();
  expect(slideCount).toBeGreaterThan(3);

  const status = carousel.locator('[aria-live="polite"]');
  await expect(status).toContainText(`1 / ${slideCount}`);

  await carousel.getByRole('button', { name: 'Next slide' }).click();
  await expect(status).toContainText(`2 / ${slideCount}`);

  const viewport = carousel.locator('[tabindex="0"]');
  await viewport.focus();
  await page.keyboard.press('End');
  await expect(status).toContainText(`${slideCount} / ${slideCount}`);
  const next = carousel.getByRole('button', { name: 'Next slide' });
  await expect(next).toBeEnabled();
  await next.click();
  await expect(status).toContainText(`1 / ${slideCount}`);

  await page.keyboard.press('Home');
  await expect(status).toContainText(`1 / ${slideCount}`);
  const previous = carousel.getByRole('button', { name: 'Previous slide' });
  await expect(previous).toBeEnabled();
  await previous.click();
  await expect(status).toContainText(`${slideCount} / ${slideCount}`);
});

test('programme carousel scrolls internally without creating mobile page overflow', async ({ page }) => {
  await open(page, '/our-work/eid-gift-kits', 390);

  const carousel = page.getByRole('region', { name: 'Programme years' });
  await expect(carousel).toBeVisible();

  const dimensions = await page.evaluate(() => {
    const viewport = document.querySelector('[aria-label^="Slide viewport. Programme years."]');
    return {
      documentClientWidth: document.documentElement.clientWidth,
      documentScrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      carouselClientWidth: viewport?.clientWidth ?? 0,
      carouselScrollWidth: viewport?.scrollWidth ?? 0,
    };
  });

  expect(dimensions.documentScrollWidth).toBeLessThanOrEqual(dimensions.documentClientWidth + 1);
  expect(dimensions.carouselScrollWidth).toBeGreaterThan(dimensions.carouselClientWidth);
});


for (const width of [390, 1440]) {
  test(`homepage carousel begins at the left edge at ${width}`, async ({ page }) => {
    await open(page, '/', width);
    const carousel = page.getByRole('region', { name: 'Amaana programme areas' });
    const first = carousel.locator('[aria-roledescription="slide"]').first();
    const viewport = carousel.locator('[tabindex="0"]');
    const [v, f] = await Promise.all([viewport.boundingBox(), first.boundingBox()]);
    expect(Math.abs(v.x - f.x)).toBeLessThanOrEqual(2);
    await expect(carousel.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    await expect(first.locator('a')).toHaveAttribute('href', '/programmes/medical-financial-relief');
    const dimensions = await page.evaluate(() => ({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
  });
}

