import { expect, test } from '@playwright/test';

async function openGallery(page, width) {
  await page.setViewportSize({ width, height: width <= 430 ? 844 : 900 });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const response = await page.goto('/browser-acceptance/gallery', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'Initiative gallery interaction' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Open image/ })).toHaveCount(13);
}

test('initiative gallery keeps three desktop columns and two compact mobile columns without overflow', async ({ page }) => {
  for (const [width, expectedColumns] of [[1440, 3], [390, 2], [320, 2]]) {
    await openGallery(page, width);
    const geometry = await page.locator('[aria-label="Programme photographs"]').evaluate((grid, columns) => {
      const cards = Array.from(grid.querySelectorAll('figure'));
      const rects = cards.map(card => card.getBoundingClientRect());
      const top = rects[0]?.top ?? 0;
      const firstRow = rects.filter(rect => Math.abs(rect.top - top) <= 2);
      return {
        columns,
        firstRowCount: firstRow.length,
        minCardWidth: Math.min(...rects.map(rect => rect.width)),
        viewport: document.documentElement.clientWidth,
        scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      };
    }, expectedColumns);

    expect(geometry.firstRowCount).toBe(expectedColumns);
    expect(geometry.minCardWidth).toBeGreaterThan(width === 320 ? 130 : 150);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewport + 1);
  }
});

test('initiative gallery lightbox owns the modal layer, traps focus and restores the triggering thumbnail', async ({ page }) => {
  await openGallery(page, 390);

  const first = page.getByRole('button', { name: /Open image 1 of 13/ });
  await first.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close' })).toBeFocused();
  await expect(dialog).toContainText('Image 1 of 13');

  const layering = await page.evaluate(() => {
    const backdrop = document.querySelector('[role="presentation"]');
    const companion = document.querySelector('.amaana-companion');
    const panel = document.querySelector('.amaana-companion-panel');
    return {
      backdrop: backdrop ? Number.parseInt(getComputedStyle(backdrop).zIndex || '0', 10) : 0,
      companion: companion ? Number.parseInt(getComputedStyle(companion).zIndex || '0', 10) : 0,
      panel: panel ? Number.parseInt(getComputedStyle(panel).zIndex || '0', 10) : 0,
      bodyOverflow: getComputedStyle(document.body).overflow,
    };
  });
  expect(layering.backdrop).toBeGreaterThan(layering.companion);
  expect(layering.backdrop).toBeGreaterThan(layering.panel);
  expect(layering.bodyOverflow).toBe('hidden');

  await page.keyboard.press('ArrowRight');
  await expect(dialog).toContainText('Image 2 of 13');
  await page.keyboard.press('ArrowLeft');
  await expect(dialog).toContainText('Image 1 of 13');

  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(first).toBeFocused();
  const overflow = await page.evaluate(() => document.body.style.overflow);
  expect(overflow).toBe('');
});

test('initiative gallery lightbox remains contained at 320px and preserves usable controls', async ({ page }) => {
  await openGallery(page, 320);
  await page.getByRole('button', { name: /Open image 2 of 13/ }).click();

  const dialog = page.getByRole('dialog');
  const geometry = await dialog.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const buttons = Array.from(element.querySelectorAll('button')).map(button => button.getBoundingClientRect());
    return {
      viewportWidth: document.documentElement.clientWidth,
      viewportHeight: window.innerHeight,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      minButtonHeight: Math.min(...buttons.map(rect => rect.height)),
      scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    };
  });

  expect(geometry.left).toBeGreaterThanOrEqual(-1);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  expect(geometry.top).toBeGreaterThanOrEqual(-1);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight + 1);
  expect(geometry.minButtonHeight).toBeGreaterThanOrEqual(44);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);

  await expect(dialog.getByRole('button', { name: 'Previous', exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Next', exact: true })).toBeVisible();
  for (const name of ['Previous', 'Next']) {
    await expect(dialog.getByRole('button', { name, exact: true }).locator('svg')).toHaveAttribute('aria-hidden', 'true');
  }

  const imageBox = await dialog.locator('img').evaluate(image => {
    const rect = image.getBoundingClientRect();
    return {
      ratio: rect.width / rect.height,
      naturalRatio: image.naturalWidth / image.naturalHeight,
    };
  });
  expect(Math.abs(imageBox.ratio - imageBox.naturalRatio)).toBeLessThan(0.02);

  await page.mouse.click(2, 2);
  await expect(dialog).toHaveCount(0);
});
