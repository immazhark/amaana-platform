import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`programme carousel typography and SVG controls at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const route of ['emergency-relief', 'ramadan-eid', 'medical-financial-relief', 'seasonal-relief']) {
      await page.goto(`/programmes/${route}`);
      const section = page.locator('#programme-list');
      if (route !== 'seasonal-relief') await expect(section.locator('[data-carousel-mode="cards"]')).toBeVisible();
      await expect(section.locator('.af-section-heading h2')).toHaveText('Explore the documented work');
      await expect(section.locator('article')).not.toHaveCount(0);
      expect(await section.evaluate(node => {
        const heading = node.querySelector('article h3,article h2');
        const shell = node.querySelector('.v2-shell').getBoundingClientRect();
        const carousel = (node.querySelector('[data-carousel-mode]') ?? node.querySelector('.canonical-pathways--single')).getBoundingClientRect();
        return Math.abs(shell.width - carousel.width) < 2 && parseFloat(getComputedStyle(heading).fontSize) <= (heading.tagName === 'H3' ? 28 : 56) && document.documentElement.scrollWidth <= innerWidth + 1;
      })).toBe(true);
      const next = section.getByRole('button', { name: 'Next slide' });
      if (await next.count()) {
        await expect(next.locator('svg')).toHaveAttribute('aria-hidden', 'true');
        expect(await next.evaluate(node => node.getBoundingClientRect().width)).toBeGreaterThanOrEqual(44);
        await next.click();
        await expect(section.locator('[aria-live="polite"]')).toContainText('2 /');
      }
      if (route === 'emergency-relief') {
        await expect(section.locator('[data-programme-artwork="hyderabad-flood-relief-2020"]')).toHaveCount(1);
        // COVID has no separately identified source photograph: never mislabel flood artwork as COVID.
        await expect(section.locator('[data-programme-artwork="covid-essential-support-2020"]')).toHaveCount(0);
        if ([390, 1440].includes(width)) expect((await new AxeBuilder({ page }).include('#programme-list').analyze()).violations).toEqual([]);
      }
    }
  });
}

for (const width of [390, 1440]) {
  test(`R-025 single-programme heading keeps readable line spacing at ${width}px and 200% text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/programmes/seasonal-relief', { waitUntil: 'domcontentloaded' });
    const heading = page.locator('.canonical-pathways--single article h2');
    await expect(heading).toHaveCount(1);
    for (const scale of ['100%', '200%']) {
      await page.evaluate(value => { document.documentElement.style.fontSize = value; }, scale);
      const metrics = await heading.evaluate(node => {
        const style = getComputedStyle(node);
        const fontSize = parseFloat(style.fontSize);
        const lineHeight = parseFloat(style.lineHeight);
        return { fontSize, lineHeight, width: node.getBoundingClientRect().width };
      });
      expect(metrics.lineHeight / metrics.fontSize).toBeGreaterThanOrEqual(1.1);
      expect(metrics.width).toBeGreaterThan(0);
    }
  });
}

for (const width of [390, 1440]) {
  test(`R-025 trust-evidence heading retains readable multiline leading at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/transparency', { waitUntil: 'domcontentloaded' });
    const heading = page.locator('.canonical-body [data-trust-evidence-boundary] .v2-section-title');
    await expect(heading).toHaveCount(1);
    for (const scale of ['100%', '200%']) {
      await page.evaluate(value => { document.documentElement.style.fontSize = value; }, scale);
      const ratio = await heading.evaluate(node => {
        const style = getComputedStyle(node);
        return parseFloat(style.lineHeight) / parseFloat(style.fontSize);
      });
      expect(ratio).toBeGreaterThanOrEqual(1.1);
    }
  });
}

test('homepage canonical fallbacks load and functional controls contain SVG rather than glyphs', async ({ page, request }) => {
  for (const name of ['origin', 'eid', 'medical', 'taleem', 'qurbani']) {
    const response = await request.get(`/hero/${name}.webp`);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/webp');
  }
  await page.goto('/');
  const hero = page.locator('[data-cinematic]');
  await expect(hero.locator('img[src*="origin.webp"]')).toHaveCount(1);
  for (const label of ['Previous slide', 'Next slide', 'Pause automatic slides']) await expect(hero.getByRole('button', { name: label }).locator('svg')).toHaveAttribute('aria-hidden', 'true');
  const expected = new Map([[2, 'eid.webp'], [4, 'taleem.webp'], [5, 'qurbani.webp']]);
  for (const [index, asset] of expected) {
    await hero.getByRole('button', { name: `Show slide ${index} of 5` }).click();
    const image = hero.locator('[data-active="true"] .v3-home-banner-media figure img');
    await expect(image).toHaveAttribute('src', new RegExp(asset));
    await expect.poll(() => image.evaluate(node => node.complete && node.naturalWidth > 0)).toBe(true);
  }
});
