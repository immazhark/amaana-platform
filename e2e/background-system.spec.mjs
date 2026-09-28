import { expect, test } from '@playwright/test';

const widths = [320, 375, 390, 430, 768, 900, 1024, 1440, 1920];

for (const width of widths) {
  for (const route of ['/', '/impact']) {
    test(`background composition ${route} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.route('**/api/analytics/page-view', r => r.fulfill({ status: 204, body: '' }));
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.ok()).toBeTruthy();
      const marks = page.locator('.amaana-backdrop-emblem');
      await expect(marks).toHaveCount(2);
      const result = await page.evaluate(() => {
        const marks = [...document.querySelectorAll('.amaana-backdrop-emblem')].map(mark => {
          const style = getComputedStyle(mark);
          return {
            size: style.backgroundSize,
            asset: style.backgroundImage,
            decorative: mark.getAttribute('aria-hidden'),
          };
        });
        const surfaces = [...document.querySelectorAll('main section')].map(el => {
          const style = getComputedStyle(el);
          return { image:style.backgroundImage, size:style.backgroundSize, repeat:style.backgroundRepeat, height:el.getBoundingClientRect().height };
        }).filter(s=>s.image.includes('amaana-lattice-tile') && s.image.includes('amaana-emblem-watermark'));
        return { marks, surfaces, overflow:document.documentElement.scrollWidth>innerWidth };
      });
      expect(result.overflow).toBe(false);
      for (const mark of result.marks) {
expect(mark.size).toBe('contain');
        expect(mark.asset).toContain('/backgrounds/amaana-arch-emblem.svg');
        expect(mark.decorative).toBe('true');
      }
      expect(result.surfaces.length).toBeGreaterThanOrEqual(2);
      for (const surface of result.surfaces) {
        const sizes = surface.size.split(',').map(value=>value.trim());
        const repeats = surface.repeat.split(',').map(value=>value.trim());
        const latticeIndex = sizes.findIndex(value=>value === '104px 104px');
        expect(latticeIndex, 'surface retains the canonical 104px lattice layer').toBeGreaterThanOrEqual(0);
        expect(repeats[latticeIndex], 'canonical lattice layer repeats').toBe('repeat');
      }
      if (route === '/impact') {
        expect(Math.max(...result.surfaces.map(s=>s.height))-Math.min(...result.surfaces.map(s=>s.height))).toBeGreaterThan(500);
      }
    });
  }
}

