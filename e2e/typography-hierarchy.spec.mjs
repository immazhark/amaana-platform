import { expect, test } from '@playwright/test';

const cases = [
  { route: '/stories', selector: '.v2-stories-feature-copy h2', fixture: '<div class="v2-stories-feature-copy"><h2>Featured field note</h2></div>' },
  { route: '/faith-and-reflections', selector: '.v2-faith-standard h2', fixture: '<section class="v2-faith-standard"><h2>Editorial trust</h2></section>' },
  { route: '/faith-and-reflections', selector: '.v2-faith-feature-copy h2', fixture: '<div class="v2-faith-feature-copy"><h2>Featured reflection</h2></div>' },
];

for (const width of [1440, 390]) {
  test(`route-specific editorial headings remain subordinate to PageHero at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width <= 430 ? 844 : 1000 });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));

    for (const sample of cases) {
      const response = await page.goto(sample.route, { waitUntil: 'domcontentloaded' });
      expect(response?.ok(), `${sample.route} should render`).toBeTruthy();
      await expect(page.locator('.page-hero__title')).toBeVisible();

      const metrics = await page.evaluate(({ selector, fixture }) => {
        let heading = document.querySelector(selector);
        if (!heading) {
          const host = document.createElement('div');
          host.setAttribute('data-visual-test-fixture', 'route-heading');
          host.innerHTML = fixture;
          document.body.appendChild(host);
          heading = document.querySelector(selector);
        }
        const hero = document.querySelector('.page-hero__title');
        return hero && heading ? {
          heroSize: parseFloat(getComputedStyle(hero).fontSize),
          headingSize: parseFloat(getComputedStyle(heading).fontSize),
          family: getComputedStyle(heading).fontFamily,
        } : null;
      }, sample);

      expect(metrics, `${sample.selector} should resolve`).toBeTruthy();
      expect(metrics.heroSize - metrics.headingSize, `${sample.selector} should remain clearly below the PageHero title`).toBeGreaterThanOrEqual(8);
      expect(metrics.family).toMatch(/Georgia|Times New Roman/i);
    }
  });
}
