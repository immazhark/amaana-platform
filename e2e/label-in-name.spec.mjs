import { expect, test } from '@playwright/test';

// AF-R034: WCAG 2.5.3 Label in Name across the component families named in the tracker:
// Contact social links, public-media links, gallery Enlarge buttons, appeal/reflection cards,
// impact tiles, participation cards and story archive actions.
const routes = [
  '/contact', '/our-work', '/impact', '/stories', '/faith-and-reflections', '/appeals',
  '/browser-acceptance/gallery',
];

const normalise = value => value.replace(/\s+/g, ' ').trim().toLowerCase();

for (const route of routes) {
  test(`AF-R034 visible link and button text is contained in its accessible name: ${route}`, async ({ page }) => {
    await page.route('**/api/analytics/page-view', r => r.fulfill({ status: 204, body: '' }));
    const response = await page.goto(route, { waitUntil: 'load' });
    expect(response?.ok()).toBe(true);
    const report = await page.evaluate(() => {
      const visibleText = element => {
        const clone = element.cloneNode(true);
        // Decorative glyphs and visually hidden helper text are not part of the visible label.
        clone.querySelectorAll('[aria-hidden="true"], .sr-only, .visually-hidden').forEach(node => node.remove());
        return (clone.textContent ?? '');
      };
      const isVisible = element => {
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return box.width > 0 && box.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };
      const checked = [];
      for (const element of document.querySelectorAll('a[href][aria-label], button[aria-label], [role="link"][aria-label], [role="button"][aria-label]')) {
        if (!isVisible(element)) continue;
        checked.push({ label: element.getAttribute('aria-label') ?? '', text: visibleText(element), tag: element.tagName.toLowerCase(), className: String(element.className).slice(0, 60) });
      }
      return checked;
    });
    const withVisibleText = report.filter(item => normalise(item.text));
    const mismatches = withVisibleText.filter(item => !normalise(item.label).includes(normalise(item.text)));
    expect(mismatches, `Accessible name must contain the visible label: ${JSON.stringify(mismatches, null, 1)}`).toEqual([]);
  });
}
