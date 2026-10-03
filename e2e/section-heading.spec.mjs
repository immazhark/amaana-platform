import { expect, test } from '@playwright/test';

const pages = ['/', '/stories', '/contact', '/get-involved', '/compliance', '/recognition', '/transparency', '/how-we-verify', '/our-work', '/appeals', '/impact', '/faith-and-reflections', '/our-work/emergency-neonatal-medical-aid'];
for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`body introductions and balanced footer edges at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204 }));
    for (const path of pages) {
      const response = await page.goto(path);
      expect(response.ok(), path).toBe(true);
      const result = await page.evaluate(() => {
        const headings = [...document.querySelectorAll('[data-section-heading="split"]')].map(node => {
          const label = node.querySelector('.v2-section-label');
          const title = node.querySelector('h2');
          const intro = node.querySelector('.v2-section-intro');
          const a = title.getBoundingClientRect(), b = intro.getBoundingClientRect();
          const line = getComputedStyle(label, '::before');
          const closing = node.closest('.v2-closing, .v3-closing');
          const actions = closing?.querySelector('.v2-hero-actions, .v3-actions')?.getBoundingClientRect();
          return { label: label.textContent.trim(), title: title.textContent.trim(), intro: intro.textContent.trim(), lineWidth: parseFloat(line.width), lineContent: line.content, horizontal: b.left >= a.right - 1, stacked: b.top >= a.bottom + 19, baselineGap: Math.abs(b.bottom - a.bottom), weight: getComputedStyle(title).fontWeight, font: parseFloat(getComputedStyle(title).fontSize), closing: Boolean(closing), actionGap: actions ? actions.top - b.bottom : null, actionLeft: actions ? Math.abs(actions.left - b.left) : null };
        });
        return { headings, gallery: Boolean(document.querySelector("#campaign-gallery")), story: document.querySelector("#programme-story .campaign-story-copy")?.textContent.trim(), top: parseFloat(getComputedStyle(document.querySelector('.footer-lead')).paddingTop), bottom: parseFloat(getComputedStyle(document.querySelector('.footer-note')).paddingBottom), overflow: document.documentElement.scrollWidth > innerWidth + 1, companion: getComputedStyle(document.querySelector('.amaana-companion')).position };
      });
      // Full process/story content retains its composition; photograph introductions exist only with a gallery.
      const programme = path === "/our-work/emergency-neonatal-medical-aid";
      if (programme) expect(result.story?.length, path).toBeGreaterThan(0);
      if (path !== "/how-we-verify" && (!programme || result.gallery)) expect(result.headings.length, path).toBeGreaterThan(0);
      for (const heading of result.headings) {
        expect(heading.label.length, path).toBeGreaterThan(0);
        expect(heading.title.length, path).toBeGreaterThan(0);
        expect(heading.intro.length, path).toBeGreaterThan(0);
        expect(heading.lineContent, path).not.toBe('none');
        expect(heading.lineWidth, path).toBe(40);
        expect(heading.weight, path).toBe('500');
        expect(heading.font, path).toBeLessThanOrEqual(56);
        if (width > 900) { expect(heading.horizontal, path).toBe(true); if (!heading.closing) expect(heading.baselineGap, path).toBeLessThan(2); }
        else expect(heading.stacked, path).toBe(true);
        if (heading.closing) { expect(heading.actionGap, path).toBeGreaterThanOrEqual(23); expect(heading.actionLeft, path).toBeLessThan(2); }
      }
      expect(result.top, path).toBe(result.bottom);
      expect(result.top, path).toBeGreaterThanOrEqual(80);
      expect(result.overflow, path).toBe(false);
      expect(result.companion, path).toBe('fixed');
    }
  });
}
