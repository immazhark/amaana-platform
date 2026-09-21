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
  await expect(carousel.getByRole('button', { name: 'Next slide' })).toBeDisabled();

  await page.keyboard.press('Home');
  await expect(status).toContainText(`1 / ${slideCount}`);
  await expect(carousel.getByRole('button', { name: 'Previous slide' })).toBeDisabled();
});

test('programme carousel scrolls internally without creating mobile page overflow', async ({ page }) => {
  await open(page, '/our-work/eid-gift-kits', 390);

  const carousel = page.getByRole('region', { name: 'Programme years' });
  await expect(carousel).toBeVisible();

  const dimensions = await page.evaluate(() => {
    const viewport = document.querySelector('[aria-label^="Programme years. Use left and right arrow keys"]');
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


test('homepage documented work uses a centered rotating focus carousel', async ({ page }) => {
  await open(page, '/', 1440);

  const carousel = page.getByRole('region', { name: 'Amaana programme areas' });
  await expect(carousel).toHaveAttribute('data-carousel-mode', 'focus');

  const slides = carousel.locator('[aria-roledescription="slide"]');
  expect(await slides.count()).toBeGreaterThan(2);
  await expect(slides.filter({ has: page.locator('[aria-current="true"]') })).toHaveCount(0);

  const active = carousel.locator('[aria-roledescription="slide"][aria-current="true"]');
  await expect(active).toHaveCount(1);

  const viewport = carousel.locator('[tabindex="0"]');
  const centered = await Promise.all([viewport.boundingBox(), active.boundingBox()]);
  expect(centered[0]).not.toBeNull();
  expect(centered[1]).not.toBeNull();
  const viewportCenter = centered[0].x + centered[0].width / 2;
  const activeCenter = centered[1].x + centered[1].width / 2;
  expect(Math.abs(viewportCenter - activeCenter)).toBeLessThanOrEqual(3);

  const second = slides.nth(1);
  await second.click({ position: { x: 8, y: 8 } });
  await expect(second).toHaveAttribute('aria-current', 'true');
  await expect(page).toHaveURL(/\/$/);

  await expect(carousel.getByRole('button', { name: 'Pause automatic slides' })).toBeVisible();
});

test('homepage focus carousel remains centered and contained on mobile', async ({ page }) => {
  await open(page, '/', 390);

  const carousel = page.getByRole('region', { name: 'Amaana programme areas' });
  const active = carousel.locator('[aria-roledescription="slide"][aria-current="true"]');
  const viewport = carousel.locator('[tabindex="0"]');
  const boxes = await Promise.all([viewport.boundingBox(), active.boundingBox()]);
  expect(boxes[0]).not.toBeNull();
  expect(boxes[1]).not.toBeNull();
  expect(Math.abs((boxes[0].x + boxes[0].width / 2) - (boxes[1].x + boxes[1].width / 2))).toBeLessThanOrEqual(4);

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});
