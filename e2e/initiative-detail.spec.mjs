import { expect, test } from '@playwright/test';

const cases = [
  ['auto-rickshaw-livelihood-support', 'auto-rickshaw', '₹95,000'],
  ['emergency-neonatal-medical-aid', 'discharged', '₹107,520'],
];
for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`initiative narratives and shared detail geometry at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204 }));
    for (const [slug, detail, amount] of cases) {
      const response = await page.goto(`/our-work/${slug}`);
      expect(response.ok()).toBe(true);
      const story = page.locator('#programme-story');
      await expect(story).toContainText(detail);
      await expect(story).toContainText(amount);
      await expect(story).not.toContainText('The documented outcome for this work is');
      await expect(page.locator('.campaign-clinical-note')).toHaveCount(0);
      const geometry = await page.evaluate(() => {
        const next = document.querySelector('.campaign-next');
        const title = next.querySelector('h2').getBoundingClientRect();
        const actions = next.querySelector('.v2-hero-actions').getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          actionGap: actions.top - title.bottom,
          actionLeft: actions.left,
          titleRight: title.right,
          titleLeft: title.left,
          shellLeft: next.querySelector('.v2-shell').getBoundingClientRect().left,
          headingSize: parseFloat(getComputedStyle(next.querySelector('h2')).fontSize),
          backgrounds: [...document.querySelectorAll('.canonical-programme>section:not(.page-hero)')].map(node => getComputedStyle(node).backgroundImage),
          parentPattern: getComputedStyle(document.querySelector('.canonical-programme')).backgroundImage,
          footerPadding: parseFloat(getComputedStyle(document.querySelector('.footer-lead')).paddingTop),
          companion: getComputedStyle(document.querySelector('.amaana-companion')).position,
        };
      });
      expect(geometry.overflow).toBe(false);
      expect(Math.abs(geometry.titleLeft - geometry.shellLeft)).toBeLessThan(2);
      expect(geometry.headingSize).toBeLessThanOrEqual(56);
      if (width > 900) expect(geometry.actionLeft).toBeGreaterThan(geometry.titleRight);
      else expect(geometry.actionGap).toBeGreaterThanOrEqual(19);
      expect(geometry.backgrounds.every(background => background === 'none')).toBe(true);
      expect(geometry.parentPattern).toContain('amaana-lattice-tile');
      expect(geometry.footerPadding).toBeGreaterThanOrEqual(28);
      expect(geometry.companion).toBe('fixed');
    }
  });
}

test('programme-year cards render approved edition media without generic placeholders', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204 }));
  const response = await page.goto('/our-work/qurbani-meat-distribution');
  expect(response.ok()).toBe(true);
  const cards = page.locator('#programme-pathways .campaign-pathway-card');
  expect(await cards.count()).toBeGreaterThan(1);
  const visuals = cards.locator('.canonical-pathway-visual');
  await expect(visuals.locator('img')).toHaveCount(await cards.count());
  await expect(visuals.locator('.work-visual-placeholder')).toHaveCount(0);
  for (const img of await visuals.locator('img').all()) {
    await expect.poll(() => img.evaluate(node => node.complete && node.naturalWidth > 0)).toBe(true);
  }
});

for (const width of [390, 1440]) {
  for (const slug of ['eid-gift-kits', 'taleem']) {
    test(`umbrella programme keeps one continuous background: ${slug} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204 }));
      const response = await page.goto(`/our-work/${slug}`);
      expect(response.ok()).toBe(true);
      await expect(page.locator('#programme-pathways')).toBeVisible();
      const backgrounds = await page.locator('.canonical-programme').evaluate(node => ({
        parent: getComputedStyle(node).backgroundImage,
        sections: [...node.querySelectorAll(':scope > section:not(.page-hero)')].map(section => ({
          id: section.id,
          image: getComputedStyle(section).backgroundImage,
          color: getComputedStyle(section).backgroundColor,
        })),
      }));
      expect(backgrounds.parent).toContain('amaana-lattice-tile');
      expect(backgrounds.sections.length).toBeGreaterThan(2);
      expect(backgrounds.sections.every(section => section.image === 'none' && section.color === 'rgba(0, 0, 0, 0)')).toBe(true);
    });
  }
}
