import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = ['/privacy', '/terms', '/donation-policy', '/refund-policy'];
for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`policy contents and native section jumps remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204 }));
    for (const route of routes) {
      expect((await page.goto(route)).ok()).toBe(true);
      if (route === '/privacy') {
        const label = page.locator('#privacy-data-classes');
        const style = await label.evaluate(node => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height, clip: getComputedStyle(node).clipPath, display: getComputedStyle(node).display }));
        expect(style.width).toBe(1);
        expect(style.height).toBe(1);
        expect(style.clip).toBe('inset(50%)');
        expect(style.display).not.toBe('none');
        await expect(page.getByRole('region', { name: 'How information is treated' })).toBeAttached();
      }
      const toc = page.getByRole('navigation', { name: 'On this page' });
      const metrics = await toc.locator('a').evaluateAll(nodes => nodes.map(node => {
        const box = node.getBoundingClientRect();
        return { height: box.height, width: box.width, display: getComputedStyle(node).display };
      }));
      expect(metrics.length).toBeGreaterThan(2);
      for (const item of metrics) {
        expect(item.height).toBeGreaterThanOrEqual(44);
        expect(item.width).toBeGreaterThanOrEqual(44);
        expect(item.display).toBe('grid');
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
      const third = toc.locator('a').nth(2);
      const href = await third.getAttribute('href');
      // Use real keyboard traversal so :focus-visible follows browser input modality.
      await toc.locator('a').first().focus();
      await toc.locator('a').first().press('Tab');
      await toc.locator('a').nth(1).press('Tab');
      await expect(third).toBeFocused();
      await expect.poll(() => third.evaluate(node => parseFloat(getComputedStyle(node).outlineWidth))).toBeGreaterThanOrEqual(3);
      expect(await third.evaluate(node => getComputedStyle(node).outlineColor)).not.toContain('rgba');
      await third.press('Enter');
      await expect(page).toHaveURL(new RegExp(`${href}$`));
      const target = page.locator(href);
      await expect.poll(() => target.evaluate(node => node.querySelector('h2').getBoundingClientRect().top - document.querySelector('.site-header').getBoundingClientRect().bottom)).toBeGreaterThanOrEqual(16);
      await expect(target.getByRole('heading')).toBeInViewport();
      const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
    }
  });
}

test('long contents remain reachable on a short desktop screen and direct fragments clear the header', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 600 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/terms');
  const aside = page.locator('.v2-policy-layout > aside');
  const last = aside.getByRole('navigation', { name: 'On this page' }).locator('a').last();
  await last.focus();
  await expect(last).toBeFocused();
  const geometry = await last.evaluate(node => {
    const link = node.getBoundingClientRect();
    const aside = node.closest('aside').getBoundingClientRect();
    return { top: link.top, bottom: link.bottom, asideTop: aside.top, asideBottom: aside.bottom, height: aside.height };
  });
  expect(geometry.height).toBeLessThanOrEqual(600 - 80 - 48);
  expect(geometry.top).toBeGreaterThanOrEqual(geometry.asideTop);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.asideBottom + 1);
  await last.press('Enter');
  await expect(page).toHaveURL(/#policy-10$/);
  await page.goto('/privacy#policy-03');
  await expect.poll(() => page.locator('#policy-03 h2').evaluate(node => node.getBoundingClientRect().top - document.querySelector('.site-header').getBoundingClientRect().bottom)).toBeGreaterThanOrEqual(16);
});

for (const width of [390, 1440]) {
  test(`loading announcement stays nonvisual and accessible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    let release;
    const navigation = new Promise(resolve => { release = resolve; });
    await page.route('**/terms*', async route => { await navigation; await route.continue(); });
    try {
      await page.goto('/privacy');
      await page.locator('.v2-policy-layout > aside > a[href="/terms"]').click();
      const overlay = page.locator('.amaana-navigation-loading');
      await expect(overlay).toBeVisible();
      await expect(overlay).toHaveAttribute('role', 'status');
      await expect(overlay).toHaveAttribute('aria-label', 'Loading page');
      const announcement = overlay.locator('.sr-only');
      await expect(announcement).toHaveText('Loading page');
      const label = await announcement.evaluate(node => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height, clip: getComputedStyle(node).clipPath, hidden: node.getAttribute('aria-hidden') }));
      expect(label.width).toBe(1);
      expect(label.height).toBe(1);
      expect(label.clip).toBe('inset(50%)');
      expect(label.hidden).not.toBe('true');
      await expect(overlay.locator('.amaana-loading-dots i')).toHaveCount(3);
      expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    } finally { release(); }
    await expect(page).toHaveURL(/\/terms$/);
    await expect(page.locator('.amaana-navigation-loading')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  });
}
