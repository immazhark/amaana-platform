import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`institutional and policy surfaces use the available width at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204 }));
    for (const [route, selector] of [['/governance', '.canonical-block:nth-child(4)'], ['/transparency', '.canonical-block:nth-child(3)']]) {
      expect((await page.goto(route)).ok()).toBe(true);
      const geometry = await page.locator(selector).evaluate(node => {
        const block = node.getBoundingClientRect(), body = node.parentElement.getBoundingClientRect();
        return { width: block.width, available: body.width, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
      });
      expect(Math.abs(geometry.width - geometry.available)).toBeLessThan(2);
      expect(geometry.overflow).toBe(false);
    }
    const boundary = page.locator('[data-trust-evidence-boundary]');
    expect(await boundary.evaluate(node => getComputedStyle(node).borderBottomWidth)).toBe('0px');
    await page.goto('/recognition');
    const heading = await page.locator('.canonical-block .af-section-heading').first().evaluate(node => ({ left: node.getBoundingClientRect().left, parentLeft: node.parentElement.getBoundingClientRect().left, width: node.getBoundingClientRect().width, available: node.parentElement.getBoundingClientRect().width }));
    expect(Math.abs(heading.left - heading.parentLeft)).toBeLessThan(2);
    expect(Math.abs(heading.width - heading.available)).toBeLessThan(2);
    await page.goto('/partner');
    const gap = await page.locator('.canonical-actions').evaluate(node => node.querySelector('a').getBoundingClientRect().top - node.previousElementSibling.getBoundingClientRect().bottom);
    expect(gap).toBeGreaterThanOrEqual(24);
    for (const route of ['/donation-policy', '/refund-policy', '/privacy', '/terms']) {
      expect((await page.goto(route)).ok()).toBe(true);
      const policy = await page.locator('.v2-policy-page').evaluate(node => ({
        pattern: getComputedStyle(node).backgroundImage,
        principleColor: getComputedStyle(node.querySelector('.v2-policy-principles')).color,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        prose: [...node.querySelectorAll('.v2-policy-sections article p')].map(p => ({ width: p.getBoundingClientRect().width, available: p.parentElement.getBoundingClientRect().width })),
      }));
      expect(policy.pattern).toContain('amaana-lattice-tile.svg');
      expect(policy.principleColor).toBe('rgb(18, 34, 57)');
      expect(policy.overflow).toBe(false);
      for (const p of policy.prose) expect(Math.abs(p.width - p.available)).toBeLessThan(2);
      if (route === '/refund-policy') {
        await expect(page.locator('[aria-labelledby="refund-security-title"] svg')).toHaveCount(1);
        expect(await page.locator('#refund-security-title').evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeLessThanOrEqual(27);
      }
      const audit = await new AxeBuilder({ page }).include('.v2-policy-principles').include('.v2-policy-body').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(audit.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
    }
  });

  test(`sponsorship and follow-up presentation stays aligned at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/get-involved/sponsor-education');
    await expect(page.locator('.taleem-school .taleem-section-number')).toHaveCount(0);
    const closing = await page.locator('.taleem-closing .v2-shell').evaluate(node => {
      const title = node.firstElementChild.getBoundingClientRect(), actions = node.lastElementChild.getBoundingClientRect();
      return { titleRight: title.right, titleBottom: title.bottom, actionsLeft: actions.left, actionsTop: actions.top };
    });
    if (width > 760) expect(closing.actionsLeft).toBeGreaterThan(closing.titleRight);
    else expect(closing.actionsTop).toBeGreaterThan(closing.titleBottom);
    const paths = await page.locator('.taleem-path a').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().top));
    if (width > 760) expect(Math.abs(paths[0] - paths[1])).toBeLessThan(2);
    expect(await page.locator('.taleem-school').evaluate(n => getComputedStyle(n).backgroundImage)).toContain('amaana-lattice-tile.svg');
    const audit = await new AxeBuilder({ page }).include('#sponsorship-paths').include('.taleem-closing').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(audit.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
    await page.goto('/request-assistance');
    const flow = await page.locator('.v2-assistance-after-flow').evaluate(node => ({ overflow: document.documentElement.scrollWidth > innerWidth + 1, heights: [...node.children].map(n => n.getBoundingClientRect().height) }));
    expect(flow.overflow).toBe(false);
    for (const height of flow.heights) expect(height).toBeLessThan(150);
  });
}
