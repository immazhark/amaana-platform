import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 390, 768, 900, 1020]) {
  for (const height of [320, 844, 1000]) {
    test(`shared navigation dismissal, scrolling and focus at ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204 }));
      expect((await page.goto('/about')).ok()).toBe(true);
      const toggle = page.locator('button[aria-controls="mobile-navigation"]');
      const nav = page.getByRole('navigation', { name: 'Mobile navigation', exact: true });
      await toggle.click();
      await expect(nav).toBeVisible();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await expect(nav.getByRole('link', { name: 'Our Work', exact: true })).toBeFocused();
      await expect(page.locator('.mobile-menu-backdrop')).toBeVisible();
      expect(await page.evaluate(() => getComputedStyle(document.body).overflowY)).toBe('hidden');
      expect(await nav.evaluate(node => node.getBoundingClientRect().bottom)).toBeLessThanOrEqual(height + 1);
      const targetSizes = await nav.locator('a').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
      expect(targetSizes.every(size => size >= 44)).toBe(true);
      const support = nav.getByRole('link', { name: 'Donate', exact: true });
      await support.focus();
      const box = await support.boundingBox();
      expect(box.y + box.height).toBeLessThanOrEqual(height + 1);
      await page.keyboard.press('Tab');
      await expect(toggle).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(support).toBeFocused();
      expect((await new AxeBuilder({ page }).include('.site-header').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
      if (height >= 844) {
        const headerBottom = await page.locator('.site-header').evaluate(node => node.getBoundingClientRect().bottom);
        expect(headerBottom).toBeLessThan(height - 2);
        await page.mouse.click(8, height - 2);
      } else {
        await page.keyboard.press('Escape');
      }
      await expect(nav).toBeHidden();
      await expect(toggle).toBeFocused();
      expect(await page.evaluate(() => getComputedStyle(document.body).overflowY)).not.toBe('hidden');
      await toggle.click();
      await page.setViewportSize({ width: 1440, height: 900 });
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(nav).toBeHidden();
      await expect(page.locator('.mobile-menu-backdrop')).toHaveCount(0);
      await expect(page.locator('.site-header .brand')).toBeFocused();
      expect(await page.evaluate(() => getComputedStyle(document.body).overflowY)).not.toBe('hidden');
      await page.setViewportSize({ width, height });
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(nav).toBeHidden();
    });
  }
}

test('menu route navigation closes the overlay and releases scrolling', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 900, height: 1000 });
  expect((await page.goto('/about')).ok()).toBe(true);
  await page.getByRole('button', { name: 'Open navigation menu', exact: true }).click();
  await page.getByRole('navigation', { name: 'Mobile navigation', exact: true }).getByRole('link', { name: 'Contact', exact: true }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole('button', { name: 'Open navigation menu', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.mobile-menu-backdrop')).toHaveCount(0);
  expect(await page.evaluate(() => getComputedStyle(document.body).overflowY)).not.toBe('hidden');
  await expect(page.locator('main h1')).toHaveText('Start with the right conversation.');
  expect(errors).toEqual([]);
});

// Keep a real Next Link transition pending; a final-page assertion alone cannot
// detect a loading indicator that disappears immediately after preventDefault.
for (const width of [320, 1440]) {
  for (const destination of [
    { label: 'Our Work', path: 'our-work' },
    { label: 'Impact', path: 'impact' },
  ]) {
    test(`branded indicator replaces skeletons for ${destination.label} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      // All routes, including prefetch, are held until assertions have finished.
      let release;
      const gate = new Promise(resolve => { release = resolve; });
      await page.route(`**/${destination.path}*`, async route => {
        await gate;
        await route.continue();
      });
      await page.goto('/about');
      await expect(page.locator('main h1')).toBeVisible();
      try {
        if (width < 1024) {
          await page.getByRole('button', { name: 'Open navigation menu', exact: true }).click();
          await page.getByRole('navigation', { name: 'Mobile navigation', exact: true })
            .getByRole('link', { name: destination.label, exact: true }).click();
        } else {
          await page.locator('.nav-links').getByRole('link', { name: destination.label, exact: true }).click();
        }
        const indicator = page.locator('.amaana-navigation-loading');
        await expect(indicator).toBeVisible();
        await expect(indicator.locator('.amaana-loading-logo')).toBeVisible();
        await expect(indicator.locator('.amaana-loading-dots i')).toHaveCount(3);
        await expect(indicator.locator('[data-loading-view]')).toHaveCount(0);
        // Two frames run the former cancellation callback without relying on
        // network timing or assuming that a status visible for one frame is useful.
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await expect(indicator).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      } finally {
        release();
      }
      await expect(page).toHaveURL(new RegExp(`/${destination.path}$`));
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('.amaana-navigation-loading')).toHaveCount(0);
      await expect(page.locator('body')).not.toHaveClass(/af-navigation-lock/);
    });
  }
}

test('returning through router.push never reopens an old navigation overlay', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/browser-acceptance/navigation-origin');
  await expect(page.getByRole('heading', { name: 'Navigation origin fixture' })).toBeVisible();

  // First transition is an actual client-side Link, so the shared loader
  // records origin as the route being left.
  await page.getByRole('link', { name: 'Go to navigation destination' }).click();
  await expect(page).toHaveURL(/\/browser-acceptance\/navigation-destination$/);
  await expect(page.getByRole('heading', { name: 'Navigation destination fixture' })).toBeVisible();
  await expect(page.locator('.amaana-navigation-loading')).toHaveCount(0);

  // Second transition is programmatic, with no click listener to replace
  // the previous pending-from path. The old code erroneously reactivates
  // the overlay when we return to the origin pathname.
  await page.getByRole('button', { name: 'Return programmatically' }).click();
  await expect(page).toHaveURL(/\/browser-acceptance\/navigation-origin$/);
  await expect(page.getByRole('heading', { name: 'Navigation origin fixture' })).toBeVisible();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(
    () => requestAnimationFrame(resolve),
  )));
  await expect(page.locator('.amaana-navigation-loading')).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveClass(/af-navigation-lock/);
});

for (const reducedMotion of ['reduce', 'no-preference']) {
  test(`Back to top restores the keyboard destination with ${reducedMotion} motion`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion });
    await page.goto('/about');
    await page.locator('main h1').waitFor();
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    const button = page.getByRole('button', { name: 'Back to top', exact: true });
    await expect(button).toBeVisible();
    await button.focus();
    await expect(button).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1);
    await expect(button).toHaveCount(0);
    await expect(page.locator('main#main')).toBeFocused();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.querySelector('main#main')?.contains(document.activeElement))).toBe(true);
  });
}
