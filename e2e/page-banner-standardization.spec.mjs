import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = ['/', '/contact', '/compliance', '/request-assistance', '/request-assistance/received', '/request-assistance/status', '/donations/invalid/acknowledgement', '/our-work/emergency-neonatal-medical-aid', '/admin/login', '/admin/forbidden', '/missing-banner-review-page'];
for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`approved L1 banner is shared across page families at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204 }));
    let approved;
    for (const path of routes) {
      const response = await page.goto(path);
      expect(response.status(), path).toBe(path.startsWith('/missing-') ? 404 : 200);
      const banner = page.locator('.page-hero, .v3-home-banner, .v2-state-hero, .v2-receipt-hero, .admin-heading, .v2-not-found').first();
      await expect(banner, path).toBeVisible();
      const result = await banner.evaluate(node => {
        const style = getComputedStyle(node);
        const mark = node.querySelector(':scope > .amaana-backdrop-emblem');
        const artwork = mark ? getComputedStyle(mark) : getComputedStyle(node, '::after');
        return { surface: style.backgroundImage, size: style.backgroundSize, repeat: style.backgroundRepeat, mark: artwork.backgroundImage, markSize: artwork.backgroundSize, markVisible: artwork.display !== 'none', overflow: document.documentElement.scrollWidth > innerWidth + 1, h1: document.querySelectorAll('main h1').length };
      });
      approved ??= result.surface;
      expect(result.surface, path).toBe(approved);
      expect(result.surface, path).toContain('amaana-lattice-tile.svg');
      expect(result.surface, path).toContain('linear-gradient');
      expect(result.size, path).toBe('104px 104px, 100% 100%');
      expect(result.repeat, path).toBe('repeat, no-repeat');
      expect(result.mark, path).toContain('amaana-arch-emblem.svg');
      expect(result.markSize, path).toBe('contain');
      if (path === '/') {
        // Homepage owner override: reviewed artwork replaces the decorative emblem;
        // the shared gradient/lattice remains identical and the logo is only a fallback.
        expect(result.markVisible, path).toBe(false);
        const photo = page.locator('[data-active="true"] .v3-home-banner-media figure img');
        await expect(photo, path).toBeVisible();
        await expect.poll(() => photo.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
        expect(await page.locator('[data-active="true"] .v3-home-banner-media').evaluate(node => getComputedStyle(node).maskImage)).toContain('linear-gradient');
      } else expect(result.markVisible, path).toBe(true);
      expect(result.overflow, path).toBe(false);
      expect(result.h1, path).toBe(1);
      if (path === '/contact' || path === '/request-assistance/status' || path === '/admin/login') {
        const audit = await new AxeBuilder({ page }).include('.page-hero, .v2-state-hero, .admin-heading').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), path).toEqual([]);
      }
    }
  });
}
