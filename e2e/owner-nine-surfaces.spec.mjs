import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`owner's nine surface corrections at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204 }));
    for (const [route, selectors] of [
      ['/stories', ['.v2-stories-ethic']],
      ['/faith-and-reflections', ['.v2-faith-standard']],
      ['/contact', ['.v2-contact-safety']],
      ['/get-involved/sponsor-education', ['.taleem-closing']],
      ['/partner', []],
      ['/compliance', ['.v2-compliance-strip', '.v2-compliance-pending']],
    ]) {
      expect((await page.goto(route)).ok(), route).toBe(true);
      for (const selector of new Set(selectors)) {
        const surface = page.locator(selector === '.v2-contact-safety' ? '.v2-contact-safety >> ..' : selector);
        const image = await surface.evaluate(node => getComputedStyle(node).backgroundImage);
        expect(image, `${route} ${selector}`).toContain('amaana-lattice-tile');
        if (selector === '.v2-stories-ethic' || selector === '.v2-compliance-pending') expect(image).toMatch(/^url\(".*amaana-lattice-tile/);
        expect(await surface.evaluate(node => getComputedStyle(node).backgroundSize)).toContain('104px 104px');
      }
      if (route === '/faith-and-reflections') {
        const heading = page.locator('#faith-standard-title');
        expect(await heading.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeLessThanOrEqual(56);
        const sizes = await page.evaluate(() => [document.querySelector('.page-hero__title'), document.querySelector('#faith-standard-title')].map(node => parseFloat(getComputedStyle(node).fontSize)));
        expect(sizes[0] - sizes[1]).toBeGreaterThanOrEqual(8);
        await expect(heading.locator('..').locator('..')).toHaveAttribute('data-section-heading', 'split');
        const empty = page.locator('[class*="emptyState"]');
        if (await empty.count()) expect(await empty.evaluate(node => Math.abs(node.getBoundingClientRect().width - node.parentElement.getBoundingClientRect().width))).toBeLessThan(2);
        expect(await page.locator('.v2-faith-standard').evaluate(node => getComputedStyle(node, '::before').content)).toBe('none');
      }
      if (route === '/contact') {
        const contacts = page.locator('.v2-closing a[href^="mailto:"], .v2-closing a[href^="tel:"]');
        await expect(contacts).toHaveCount(2);
        for (const link of await contacts.all()) {
          await expect(link.locator('svg')).toHaveCount(1);
          expect(await link.evaluate(node => node.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
          await link.focus();
          expect(await link.evaluate(node => getComputedStyle(node).outlineStyle)).toBe('solid');
        }
      }
      if (route === '/get-involved/sponsor-education') {
        const actions = await page.locator('.taleem-closing .v2-hero-actions').evaluate(node => ({ direction: getComputedStyle(node).flexDirection, gap: parseFloat(getComputedStyle(node).gap) }));
        expect(actions.direction).toBe('row');
        expect(actions.gap).toBeGreaterThanOrEqual(16);
      }
      if (route === '/partner') {
        await expect(page.locator('#partnership-areas li svg')).toHaveCount(8);
        expect(await page.locator('#partnership-areas ul').evaluate(node => Math.abs(node.getBoundingClientRect().width - node.parentElement.getBoundingClientRect().width))).toBeLessThan(2);
      }
      if (route === '/compliance') {
        await expect(page.locator('.v2-compliance-strip article')).toHaveCount(4);
        await expect(page.locator('.v2-compliance-strip')).toContainText('Provisional approvals');
        await expect(page.locator('.v2-compliance-pending')).toContainText('Tax-certificate functionality remains disabled.');
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBe(true);
      if (width === 390 || width === 1440) expect((await new AxeBuilder({ page }).include('main').analyze()).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), route).toEqual([]);
    }
  });
}
