import { expect, test } from '@playwright/test';

test('Faith library hover and keyboard focus honor reduced motion', async ({ page }) => {
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const response = await page.goto('/faith-and-reflections', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBe(true);

  await page.evaluate(() => {
    const root = document.querySelector('.v2-faith-page');
    if (!root) throw new Error('Faith page root is missing');
    const grid = document.createElement('div');
    grid.className = 'v2-faith-library-grid';
    grid.dataset.motionFixture = 'true';
    const card = document.createElement('a');
    card.className = 'v2-faith-library-item';
    card.href = '#synthetic-faith-item';
    card.textContent = 'Synthetic reviewed item';
    grid.append(card);
    root.append(grid);
  });

  const card = page.locator('[data-motion-fixture="true"] .v2-faith-library-item');
  for (const reducedMotion of ['reduce', 'no-preference']) {
    await page.emulateMedia({ reducedMotion });
    await card.hover();
    if (reducedMotion === 'reduce') {
      await expect(card).toHaveCSS('transform', 'none');
      await expect(card).toHaveCSS('transition-property', 'none');
    } else {
      await expect.poll(() => card.evaluate(element => getComputedStyle(element).transform))
        .not.toBe('none');
    }

    await page.mouse.move(0, 0);
    await page.keyboard.press('Tab');
    await card.focus();
    await expect.poll(() => card.evaluate(element => element.matches(':focus-visible'))).toBe(true);
    if (reducedMotion === 'reduce') {
      await expect(card).toHaveCSS('transform', 'none');
      await expect(card).toHaveCSS('transition-property', 'none');
    } else {
      await expect.poll(() => card.evaluate(element => getComputedStyle(element).transform))
        .not.toBe('none');
    }
  }
});
