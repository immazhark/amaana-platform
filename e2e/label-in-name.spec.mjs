import { expect, test } from '@playwright/test';

// AF-R034: WCAG 2.5.3 Label in Name across the component families named in the tracker:
// Contact social links, public-media links, gallery Enlarge buttons, appeal/reflection cards,
// impact tiles, participation cards and story archive actions.
const routes = [
  '/contact', '/our-work', '/impact', '/stories', '/faith-and-reflections', '/appeals',
  '/browser-acceptance/gallery',
];

// Decorative arrows/bullets are glyphs, not label text.
const normalise = value => value.replace(/[→←↗↑↓•]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

for (const route of routes) {
  test(`AF-R034 visible link and button text is contained in its accessible name: ${route}`, async ({ page }) => {
    await page.route('**/api/analytics/page-view', r => r.fulfill({ status: 204, body: '' }));
    const response = await page.goto(route, { waitUntil: 'load' });
    expect(response?.ok()).toBe(true);
    const report = await page.evaluate(() => {
      // Visible label parts: each rendered text node, excluding decorative/hidden content and
      // descriptive paragraphs (a card's description is supplementary, not the control's label).
      const visibleParts = element => {
        const clone = element.cloneNode(true);
        clone.querySelectorAll('[aria-hidden="true"], .sr-only, .visually-hidden, p').forEach(node => node.remove());
        const parts = [];
        const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) parts.push(node.textContent ?? '');
        return parts;
      };
      const isVisible = element => {
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return box.width > 0 && box.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };
      const checked = [];
      for (const element of document.querySelectorAll('a[href][aria-label], button[aria-label], [role="link"][aria-label], [role="button"][aria-label]')) {
        if (!isVisible(element)) continue;
        checked.push({ label: element.getAttribute('aria-label') ?? '', parts: visibleParts(element), tag: element.tagName.toLowerCase(), className: String(element.className).slice(0, 60) });
      }
      return checked;
    });
    const mismatches = report.flatMap(item => {
      const label = normalise(item.label);
      const missing = item.parts.map(normalise).filter(part => part && !label.includes(part));
      return missing.length ? [{ ...item, missing }] : [];
    });
    expect(mismatches, `Accessible name must contain the visible label: ${JSON.stringify(mismatches, null, 1)}`).toEqual([]);
  });
}
