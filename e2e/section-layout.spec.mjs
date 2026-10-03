import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 390, 768, 900, 1024, 1440, 1920]) {
  test(`shared section hierarchy and closing actions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/browser-acceptance/home-hero');
    const hierarchy = await page.evaluate(() => ({ banner: parseFloat(getComputedStyle(document.querySelector('.v3-home-banner-brandline')).fontSize), body: Math.max(...[...document.querySelectorAll('.v3-section h2')].map(n => parseFloat(getComputedStyle(n).fontSize))) }));
    expect(hierarchy.banner).toBeGreaterThan(hierarchy.body);
    await page.goto('/browser-acceptance/section-layout');
    const layout = await page.evaluate(() => {
      const box = node => node.getBoundingClientRect();
      const shell = box(document.querySelector('.v2-section .v2-shell'));
      const closing = document.querySelector('.v2-closing');
      const title = box(closing.querySelector('h2')), intro = box(closing.querySelector('.v2-section-intro')), actions = box(closing.querySelector('.v2-hero-actions'));
      const evidence = document.querySelector('.v2-section.dark');
      return { overflow: document.documentElement.scrollWidth > innerWidth + 1, shellLeft: shell.left, closingLeft: box(closing.querySelector('.v2-shell')).left, title, intro, actions, fonts: [...document.querySelectorAll('main h2')].map(n => parseFloat(getComputedStyle(n).fontSize)), grouped: box(evidence.querySelector('.v2-section-label')).bottom <= box(evidence.querySelector('h2')).top };
    });
    expect(layout.overflow).toBe(false);
    expect(layout.closingLeft).toBe(layout.shellLeft);
    expect(layout.grouped).toBe(true);
    for (const font of layout.fonts) expect(font).toBeLessThanOrEqual(56);
    expect(Math.abs(layout.actions.left - layout.intro.left)).toBeLessThan(2);
    expect(layout.actions.top - layout.intro.bottom).toBeGreaterThanOrEqual(23);
    if (width > 900) expect(layout.intro.left).toBeGreaterThan(layout.title.right);
    else expect(layout.intro.top - layout.title.bottom).toBeGreaterThanOrEqual(19);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
    if (width === 390 || width === 1920) await page.screenshot({ path: `/tmp/amaana-sections-${width}.png`, fullPage: true });
    await page.goto('/contact');
    const contact = await page.locator('.v2-closing').evaluate(node => ({ intro: node.querySelector('.v2-section-intro').getBoundingClientRect().left, actions: node.querySelector('.v2-hero-actions').getBoundingClientRect().left }));
    expect(Math.abs(contact.intro - contact.actions)).toBeLessThan(2);
  });
}
