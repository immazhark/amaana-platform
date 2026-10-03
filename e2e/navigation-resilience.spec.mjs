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
      const support = nav.getByRole('link', { name: 'Support a verified need', exact: true });
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
  await page.setViewportSize({ width: 900, height: 1000 });
  expect((await page.goto('/about')).ok()).toBe(true);
  await page.getByRole('button', { name: 'Open navigation menu', exact: true }).click();
  await page.getByRole('navigation', { name: 'Mobile navigation', exact: true }).getByRole('link', { name: 'Contact', exact: true }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole('button', { name: 'Open navigation menu', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.mobile-menu-backdrop')).toHaveCount(0);
  expect(await page.evaluate(() => getComputedStyle(document.body).overflowY)).not.toBe('hidden');
});
