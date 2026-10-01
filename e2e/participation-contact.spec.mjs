import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`participation, contact and completed outcomes at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204 }));
    for (const route of ['/get-involved', '/contact']) {
      expect((await page.goto(route)).ok()).toBe(true);
      const first = page.locator('.v2-intent-card').first();
      const geometry = await page.locator('.v2-intent-card').evaluateAll(cards => cards.map(card => {
        const heading = card.querySelector('h3').getBoundingClientRect();
        const copy = card.querySelector('p').getBoundingClientRect();
        return { gap: copy.top - heading.bottom, decoration: getComputedStyle(card, '::before').content };
      }));
      expect(geometry.length).toBe(route === '/contact' ? 6 : 5);
      expect(geometry.every(card => card.gap >= 8 && card.decoration === 'none')).toBe(true);
      await first.hover();
      await first.focus();
      expect(await first.evaluate(card => getComputedStyle(card).outlineStyle)).toBe('solid');
      if (route === '/get-involved') {
        const journey = await page.locator('.v2-journey-step').evaluateAll(steps => steps.map(step => ({
          gap: step.querySelector('span').getBoundingClientRect().top - step.querySelector('b').getBoundingClientRect().bottom,
          decoration: getComputedStyle(step, '::before').content,
        })));
        expect(journey).toHaveLength(5);
        expect(journey.every(step => step.gap >= 8 && step.decoration === 'none')).toBe(true);
      } else {
        const socials = page.locator('.v2-contact-social-links a');
        await expect(socials).toHaveCount(3);
        for (const social of await socials.all()) {
          await expect(social.locator('svg')).toHaveCount(1);
          await expect(social).toHaveAttribute('target', '_blank');
          await expect(social).toHaveAttribute('rel', /noreferrer/);
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      if (width === 390 || width === 1440) {
        expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
      }
    }
    expect((await page.goto('/appeals')).ok()).toBe(true);
    const carousel = page.getByRole('region', { name: 'Completed support outcomes', exact: true });
    await expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
    const slides = carousel.locator('[data-body-card]');
    expect(await slides.count()).toBeGreaterThan(0);
    await expect(carousel.locator('.work-visual-placeholder svg')).toHaveCount(0);
    for (const visual of await carousel.locator('.work-visual-placeholder').all()) {
      expect(await visual.evaluate(node => getComputedStyle(node).backgroundImage)).toContain('amaana-lattice-tile');
    }
    if (await slides.count() > 1) {
      await carousel.getByRole('button', { name: 'Next slide', exact: true }).click();
      await expect(carousel.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
      await carousel.getByRole('button', { name: 'Previous slide', exact: true }).click();
      await expect(carousel.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}
