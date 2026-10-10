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
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await expect(first).toBeFocused();
      expect(await first.evaluate(card => getComputedStyle(card).outlineStyle)).toBe('solid');
      if (route === '/get-involved') {
        expect(await page.locator('.v2-intent').evaluate(node => getComputedStyle(node).backgroundImage)).toContain('amaana-lattice-tile');
        const journey = await page.locator('.v2-journey-step').evaluateAll(steps => steps.map(step => ({
          gap: step.querySelector('span').getBoundingClientRect().top - step.querySelector('b').getBoundingClientRect().bottom,
          decoration: getComputedStyle(step, '::before').content,
        })));
        expect(journey).toHaveLength(5);
        expect(journey.every(step => step.gap >= 8 && step.decoration === 'none')).toBe(true);
      } else {
        const whatsapp = page.locator('.v2-intent-card[href^="https://wa.me/"]');
        await expect(whatsapp).toHaveAttribute('target', '_blank');
        await expect(whatsapp).toHaveAttribute('rel', /noopener/);
        const socials = page.locator('.v2-contact-social-links a');
        await expect(socials).toHaveCount(3);
        for (const social of await socials.all()) {
          await expect(social.locator('svg')).toHaveCount(1);
          await expect(social).toHaveAttribute('target', '_blank');
          await expect(social).toHaveAttribute('rel', /noreferrer/);
          const visibleLabel = (await social.locator('span').last().innerText()).trim();
          const accessibleName = await social.getAttribute('aria-label');
          expect(accessibleName?.startsWith(visibleLabel)).toBe(true);
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      if (width === 390 || width === 1440) {
        expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
      }
    }
    expect((await page.goto('/appeals')).ok()).toBe(true);
    for (const selector of ['#completed-causes', '.v2-appeal-method', '.v2-appeals-boundary']) {
      const surface = page.locator(selector);
      expect(await surface.evaluate(node => getComputedStyle(node).backgroundImage)).toContain('amaana-lattice-tile');
      expect(await surface.evaluate(node => getComputedStyle(node).backgroundSize)).toContain('104px 104px');
    }
    expect(await page.locator('.v2-appeal-method').evaluate(node => getComputedStyle(node, '::after').content)).toBe('none');
    expect(await page.locator('.v2-appeal-method').evaluate(node => getComputedStyle(node).backgroundImage)).toMatch(/^url\(".*amaana-lattice-tile/);
    expect(await page.locator('.v2-appeal-method').evaluate(node => getComputedStyle(node).backgroundBlendMode)).toMatch(/^normal/);
    const boundary = page.locator('.v2-appeals-boundary [data-section-heading="split"]');
    const geometry = await boundary.evaluate(node => {
      const label = node.querySelector('.v2-section-label');
      const title = node.querySelector('h2');
      const copy = node.querySelector('.v2-section-intro');
      const action = copy.querySelector('span');
      return {
        labelSize: parseFloat(getComputedStyle(label).fontSize),
        titleSize: parseFloat(getComputedStyle(title).fontSize),
        labelRule: getComputedStyle(label, '::before').width,
        actionGap: parseFloat(getComputedStyle(action).marginTop),
        border: getComputedStyle(copy).borderLeftWidth,
        title: title.getBoundingClientRect().toJSON(), copy: copy.getBoundingClientRect().toJSON(),
      };
    });
    expect(geometry.labelSize).toBe(12);
    expect(geometry.labelRule).toBe('40px');
    expect(geometry.titleSize).toBeLessThanOrEqual(56);
    expect(geometry.actionGap).toBeGreaterThanOrEqual(20);
    expect(geometry.border).toBe('0px');
    if (width > 900) expect(geometry.copy.left).toBeGreaterThan(geometry.title.right);
    else expect(geometry.copy.top).toBeGreaterThan(geometry.title.bottom);
    if (width === 390 || width === 1440) {
      expect((await new AxeBuilder({ page }).include('.v2-appeal-method').include('.v2-appeals-boundary').analyze()).violations).toEqual([]);
    }
    const carousel = page.getByRole('region', { name: 'Completed support outcomes', exact: true });
    await expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
    const slides = carousel.locator('[data-body-card]');
    expect(await slides.count()).toBeGreaterThan(0);
    expect(await carousel.locator('.campaign-pathway-card p').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).webkitLineClamp === 'none'))).toBe(true);
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
