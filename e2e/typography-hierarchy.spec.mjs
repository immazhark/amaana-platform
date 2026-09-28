import { expect, test } from '@playwright/test';

const cases = [
  { route: '/stories', selector: '.v2-stories-feature-copy h2', fixture: '<div class="v2-stories-feature-copy"><h2>Featured field note</h2></div>' },
  { route: '/faith-and-reflections', selector: '.v2-faith-standard h2', fixture: '<section class="v2-faith-standard"><h2>Editorial trust</h2></section>' },
  { route: '/faith-and-reflections', selector: '.v2-faith-feature-copy h2', fixture: '<div class="v2-faith-feature-copy"><h2>Featured reflection</h2></div>' },
  { route: '/our-work', selector: '.v2-cause-summary-title', fixture: '<details class="v2-cause-disclosure"><summary class="v2-cause-summary"><h2 class="v2-cause-summary-heading"><span class="v2-cause-summary-copy"><span class="v2-cause-summary-title">Medical & Financial Relief</span></span></h2></summary></details>' },
];

for (const width of [1440, 390]) {
  test(`route-specific editorial headings remain subordinate to PageHero at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width <= 430 ? 844 : 1000 });
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));

    for (const sample of cases) {
      const response = await page.goto(sample.route, { waitUntil: 'domcontentloaded' });
      expect(response?.ok(), `${sample.route} should render`).toBeTruthy();

      const metrics = await page.evaluate(({ selector, fixture }) => {
        let hero = document.querySelector('.page-hero__title');
        if (!hero) {
          const host = document.createElement('section');
          host.className = 'page-hero page-hero--level1';
          host.setAttribute('data-visual-test-fixture', 'page-hero');
          host.innerHTML = '<div class="page-hero__shell"><div class="page-hero__grid"><div class="page-hero__copy"><h1 class="page-hero__title">Amaana Foundation</h1></div></div></div>';
          document.body.appendChild(host);
          hero = host.querySelector('.page-hero__title');
        }

        let heading = document.querySelector(selector);
        if (!heading) {
          const host = document.createElement('div');
          host.setAttribute('data-visual-test-fixture', 'route-heading');
          host.innerHTML = fixture;
          document.body.appendChild(host);
          heading = document.querySelector(selector);
        }

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


test('canonical public typography roles stay restrained and consistent', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  for (const route of ['/about', '/get-involved', '/governance', '/transparency', '/compliance']) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.ok(), `${route} should render`).toBeTruthy();
    const metrics = await page.evaluate(() => {
      const hero = document.querySelector('.page-hero__title');
      const nav = document.querySelector('.site-header .nav-link');
      const active = document.querySelector('.site-header .nav-link.active');
      const button = document.querySelector('.page-hero__button, .v2-button');
      const label = document.querySelector('.page-hero__eyebrow, .v2-section-label');
      const textLink = document.querySelector('.v2-text-link, .canonical-block a');
      const read = node => node ? {
        family: getComputedStyle(node).fontFamily,
        weight: Number.parseInt(getComputedStyle(node).fontWeight, 10),
        decoration: getComputedStyle(node).textDecorationLine,
      } : null;
      return { hero: read(hero), nav: read(nav), active: read(active), button: read(button), label: read(label), textLink: read(textLink) };
    });
    expect(metrics.hero?.family).toMatch(/Georgia|Times New Roman/i);
    expect(metrics.hero?.weight).toBeLessThanOrEqual(500);
    if (metrics.nav) expect(metrics.nav.weight).toBeLessThanOrEqual(600);
    if (metrics.active) expect(metrics.active.weight).toBeLessThanOrEqual(700);
    if (metrics.button) expect(metrics.button.weight).toBeLessThanOrEqual(700);
    if (metrics.label) expect(metrics.label.weight).toBeLessThanOrEqual(700);
    if (metrics.textLink) {
      expect(metrics.textLink.weight).toBeLessThanOrEqual(700);
      expect(metrics.textLink.decoration).toContain('underline');
    }
  }
});

test('canonical trust and about narrative sections are not rendered as repetitive boxed cards', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  for (const route of ['/about', '/governance', '/transparency']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const surfaces = await page.locator('.canonical-body > .canonical-block').evaluateAll(nodes => nodes.map(node => {
      const style = getComputedStyle(node);
      return { radius: parseFloat(style.borderRadius), shadow: style.boxShadow, left: style.borderLeftWidth, right: style.borderRightWidth };
    }));
    for (const surface of surfaces) {
      expect(surface.radius).toBeLessThanOrEqual(1);
      expect(surface.shadow).toBe('none');
      expect(parseFloat(surface.left)).toBe(0);
      expect(parseFloat(surface.right)).toBe(0);
    }
  }
});
