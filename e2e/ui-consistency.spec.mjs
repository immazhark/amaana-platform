import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`light banners preserve legible confirmation and Home interactions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204 }));
    for (const path of ['/request-assistance/received', '/donations/invalid/acknowledgement']) {
      await page.goto(path);
      const heading = page.locator('main h1');
      await expect(heading).toBeVisible();
      const style = await heading.evaluate(node => ({ color: getComputedStyle(node).color, size: parseFloat(getComputedStyle(node).fontSize), overflow: document.documentElement.scrollWidth > innerWidth + 1 }));
      expect(style.color).toBe('rgb(18, 34, 57)');
      expect(style.size).toBeLessThanOrEqual(width < 600 ? 61 : 83);
      expect(style.overflow).toBe(false);
      if (path.includes('received')) {
        const steps = page.locator('.v2-state-steps');
        const panel = await steps.evaluate(node => ({ background: getComputedStyle(node).backgroundColor, color: getComputedStyle(node).color }));
        expect(panel.background).not.toMatch(/rgba\(.*0\.04\)/);
        expect(panel.color).toBe('rgb(255, 253, 248)');
        const audit = await new AxeBuilder({ page }).include('.v2-state-hero').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
      }
    }
    await page.goto('/contact');
    const social = page.locator('.v2-contact-social-section');
    const geometry = await social.evaluate(node => {
      const title = node.querySelector('h2').getBoundingClientRect();
      const subtitle = node.querySelector('.v2-section-intro').getBoundingClientRect();
      return { titleRight: title.right, titleBottom: title.bottom, subtitleLeft: subtitle.left, subtitleTop: subtitle.top };
    });
    if (width > 900) expect(geometry.subtitleLeft).toBeGreaterThan(geometry.titleRight);
    else expect(geometry.subtitleTop).toBeGreaterThan(geometry.titleBottom);
    const contactAudit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(contactAudit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
    await page.goto('/browser-acceptance/home-hero');
    const action = page.locator('.v3-home-banner-actions .v3-btn.secondary').first();
    await action.hover();
    await expect.poll(() => action.evaluate(node => getComputedStyle(node).color)).toBe('rgb(18, 34, 57)');
    await action.focus();
    await expect.poll(() => action.evaluate(node => getComputedStyle(node).color)).toBe('rgb(18, 34, 57)');
  });
}
