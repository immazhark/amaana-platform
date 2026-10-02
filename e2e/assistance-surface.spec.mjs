import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`private intake has continuous artwork and aligned guidance at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204 }));
    expect((await page.goto('/request-assistance')).ok()).toBe(true);
    const before = page.locator('.v2-assistance-before');
    const surface = await before.evaluate(node => {
      const style = getComputedStyle(node);
      const heading = node.querySelector('h2').getBoundingClientRect();
      const copy = node.querySelector('.v2-section-intro').getBoundingClientRect();
      return { image: style.backgroundImage, repeat: style.backgroundRepeat, size: style.backgroundSize, heading: { right: heading.right, bottom: heading.bottom }, copy: { left: copy.left, top: copy.top } };
    });
    // A repeated colour gradient created visible square bands; only the lattice may tile.
    expect(surface.image).toMatch(/^url\(.*amaana-lattice-tile/);
    expect(surface.repeat).toBe('repeat, no-repeat');
    expect(surface.size).toBe('104px 104px, 100% 100%');
    if (width > 900) expect(surface.copy.left).toBeGreaterThan(surface.heading.right);
    else expect(surface.copy.top).toBeGreaterThan(surface.heading.bottom);
    await expect(before).toContainText('Uploads remain private.');
    const after = await page.locator('.v2-assistance-after').evaluate(node => ({ image: getComputedStyle(node).backgroundImage, repeat: getComputedStyle(node).backgroundRepeat }));
    expect(after.image).toContain('amaana-lattice-tile.svg');
    expect(after.repeat).toBe('no-repeat, repeat');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
  });
}
