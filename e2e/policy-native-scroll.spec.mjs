import { expect, test } from '@playwright/test';

for (const route of ['/privacy', '/terms', '/donation-policy', '/refund-policy']) {
  test(`${route} sidebar keeps wheel and Home/End browser-owned`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 700 });
    await page.addInitScript(() => {
      const matchMedia = window.matchMedia.bind(window);
      window.matchMedia = query => {
        const result = matchMedia(query);
        if (query === '(pointer: fine)') Object.defineProperty(result, 'matches', { value: true });
        return result;
      };
    });
    await page.route('**/api/analytics/page-view', r => r.fulfill({ status: 204, body: '' }));
    const response = await page.goto(route, { waitUntil: 'load' });
    expect(response?.ok()).toBe(true);
    const sidebar = page.locator('.v2-policy-layout > aside');
    await expect(sidebar.getByRole('navigation', { name: 'On this page' })).toHaveCount(1);
    await expect(sidebar).toHaveAttribute('data-native-scroll', 'true');
    // Starting the real enhancement proves the client effect has mounted.
    await page.mouse.move(1200, 400);
    await page.mouse.wheel(0, 150);
    await expect(page.locator('html')).toHaveClass(/lenis/);
    for (const key of ['Home', 'End']) {
      const outcome = await sidebar.evaluate((node, key) => {
        const link = node.querySelector('a');
        if (!link) throw new Error('Policy sidebar link missing');
        link.focus({ preventScroll: true });
        const original = window.scrollTo;
        let calls = 0;
        window.scrollTo = (...args) => { calls += 1; original.apply(window, args); };
        try {
          link.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
          return { calls, active: document.documentElement.classList.contains('lenis') };
        } finally { window.scrollTo = original; }
      }, key);
      expect(outcome).toEqual({ calls: 0, active: false });
      await sidebar.evaluate(node => node.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 50 })));
      // A later task lets the dynamic import resolve if an exclusion regresses.
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await expect(page.locator('html')).not.toHaveClass(/lenis/);
      if (key === 'Home') {
        await page.mouse.move(1200, 400);
        await page.mouse.wheel(0, 100);
        await expect(page.locator('html')).toHaveClass(/lenis/);
      }
    }
  });
}
