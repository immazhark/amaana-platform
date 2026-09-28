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
        const overlaps = (a,b) => Math.min(a.right,b.right)-Math.max(a.left,b.left)>1
          && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
        const marks = [...document.querySelectorAll('.amaana-backdrop-emblem')].map(mark => {
          const box = mark.getBoundingClientRect();
          const parent = mark.parentElement;
          const bounds = parent.getBoundingClientRect();
          const protectedContent = parent.querySelectorAll('.page-hero__copy,.page-hero__visual,.footer-lead>*,.footer-grid,.footer-note,.v3-home-banner-carousel');
          const isFooterMark = Boolean(mark.closest('.site-footer'));
          return {
            contained: box.right>bounds.left && box.left<bounds.right && box.bottom>bounds.top && box.top<bounds.bottom,
            overlapping: isFooterMark && [...protectedContent].some(el=>overlaps(box,el.getBoundingClientRect())),
            size: getComputedStyle(mark).backgroundSize,
            asset: getComputedStyle(mark).backgroundImage,
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
        expect(mark.contained, 'whole arch and emblem stay inside their section and viewport').toBe(true);
        expect(mark.overlapping, 'identity must not collide with text, cards or links').toBe(false);
        expect(mark.size).toBe('contain');
        expect(mark.asset).toContain('/backgrounds/amaana-arch-emblem.svg');
        expect(mark.decorative).toBe('true');
      }
      expect(result.surfaces.length).toBeGreaterThanOrEqual(2);
      for (const surface of result.surfaces) {
        expect(surface.size.split(',').at(-1).trim()).toBe('104px 104px');
        expect(surface.repeat.split(',').at(-1).trim()).toBe('repeat');
      }
      if (route === '/impact') {
        expect(Math.max(...result.surfaces.map(s=>s.height))-Math.min(...result.surfaces.map(s=>s.height))).toBeGreaterThan(500);
      }
    });
  }
}

