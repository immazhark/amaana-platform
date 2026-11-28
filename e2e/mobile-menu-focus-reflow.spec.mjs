import { expect, test } from '@playwright/test';

for (const sizes of [[[320, 320], [390, 320], [768, 320], [1020, 320]], [[320, 400], [390, 480], [320, 844], [390, 844]]]) {
  test(`mobile menu keeps focused links clear at ${sizes.map(size => size.join('x')).join(', ')}`, async ({ page }) => {
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: sizes[0][0], height: sizes[0][1] });
    expect((await page.goto('/about')).ok()).toBe(true);
    const toggle = page.locator('button[aria-controls="mobile-navigation"]');
    const nav = page.getByRole('navigation', { name: 'Mobile navigation', exact: true });
    const links = nav.getByRole('link');
    for (const [width, height] of sizes) {
      await page.setViewportSize({ width, height });
      for (const scale of [1, 2]) {
        await page.evaluate(async scale => {
          const root = document.documentElement;
          root.style.removeProperty('font-size');
          root.style.fontSize = `${parseFloat(getComputedStyle(root).fontSize) * scale}px`;
          await document.fonts.ready;
        }, scale);
        await toggle.click();
        await expect(nav).toBeVisible();
        await expect(links).toHaveCount(13);
        for (let index = 0; index < 13; index++) {
          if (index > 0) await page.keyboard.press('Tab');
          const link = links.nth(index);
          await expect(link).toBeFocused();
          await expect.poll(() => link.evaluate(node => {
            const menu = node.closest('nav');
            const bounds = node.getBoundingClientRect();
            const viewport = menu.getBoundingClientRect();
            const style = getComputedStyle(node);
            const outline = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
            return bounds.height >= 44 && bounds.top >= viewport.top + outline - 1 &&
              bounds.bottom <= Math.min(viewport.bottom, innerHeight) - outline + 1 &&
              bounds.left >= viewport.left + outline - 1 && bounds.right <= viewport.right - outline + 1;
          }), `${width}x${height} / ${scale * 100}% / link ${index + 1}`).toBe(true);
        }
        await page.keyboard.press('Tab');
        await expect(toggle).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(links.last()).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(nav).toBeHidden();
        await expect(toggle).toBeFocused();
        await expect(page.locator('body')).not.toHaveClass(/af-menu-lock/);
      }
    }
  });
}
