import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function fixture(page, route, width = 1440) {
  await page.setViewportSize({ width, height: 1000 });
  await page.route('**/api/public/live-rail', route => route.fulfill({ json: { items: [] } }));
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204 }));
  await page.goto(`/browser-acceptance/${route}`);
}

test('header hover preserves clear underline and white support label', async ({ page }) => {
  await fixture(page, 'home-hero');
  const link = page.locator('.site-header .nav-link').first();
  await link.hover();
  await expect.poll(() => link.evaluate(node => getComputedStyle(node, '::after').opacity)).toBe('1');
  expect(await link.evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  const support = page.locator('.site-header .nav-donate');
  await support.hover();
  await expect.poll(() => support.evaluate(node => getComputedStyle(node).color)).toBe('rgb(255, 253, 248)');
  await support.focus();
  expect(await support.evaluate(node => getComputedStyle(node).color)).toBe('rgb(255, 253, 248)');
});

for (const width of [1920, 1440, 1024, 768, 390, 320]) {
  test(`Home and portfolio screenshot corrections at ${width}px`, async ({ page }) => {
    await fixture(page, 'home-hero', width);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const home = await page.evaluate(() => {
      const hero = document.querySelector('.v3-home-banner-carousel').getBoundingClientRect();
      const logo = document.querySelector('.v3-home-story-logo>span').getBoundingClientRect();
      const actions = document.querySelector('.v3-home-banner-actions').getBoundingClientRect();
      const footer = document.querySelector('.footer-lead h2');
      return {
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        height: hero.height, logo: logo.width,
        bottomGap: hero.bottom - actions.bottom,
        controlsOverlap: [...document.querySelectorAll('.v3-home-banner-carousel button')].some(node => { const r = node.getBoundingClientRect(); return r.left < actions.right && r.right > actions.left && r.top < actions.bottom && r.bottom > actions.top; }),
        footerFont: parseFloat(getComputedStyle(footer).fontSize),
        footerWidth: footer.getBoundingClientRect().width,
        patterns: [...document.querySelectorAll('.v3-eid,.v3-trust')].map(node => getComputedStyle(node).backgroundImage),
        animation: getComputedStyle(document.querySelector('.v3-proof-item strong')).animationName,
        companion: getComputedStyle(document.querySelector('.amaana-companion')).position,
      };
    });
    expect(home.overflow).toBe(false);
    expect(home.bottomGap).toBeGreaterThanOrEqual(20);
    expect(home.controlsOverlap).toBe(false);
    expect(home.animation).toBe('none');
    expect(home.companion).toBe('fixed');
    for (const pattern of home.patterns) expect(pattern.startsWith('url(')).toBe(true);
    if (width >= 1024) {
      expect(home.height).toBeGreaterThanOrEqual(432);
      expect(home.logo).toBeGreaterThanOrEqual(224);
      expect(home.footerFont).toBeLessThanOrEqual(36);
    }
    await expect(page.locator('.v3-quick-links a')).toHaveCount(5);
    await expect(page.locator('.v3-quick-links a svg')).toHaveCount(10);
    expect(await page.locator('.v3-quick-links a').first().evaluate(node => getComputedStyle(node).color)).toBe('rgb(255, 253, 248)');

    await fixture(page, 'portfolio', width);
    const summary = page.locator('.v2-cause-summary').first();
    const alignment = await summary.evaluate(node => {
      const row = node.getBoundingClientRect();
      const toggle = node.querySelector('.v2-cause-summary-toggle').getBoundingClientRect();
      return row.right - toggle.right;
    });
    expect(alignment).toBeLessThanOrEqual(25);
    const number = summary.locator('.v2-cause-number');
    await expect(number).toBeVisible();
    const numberBox = await number.boundingBox();
    const titleBox = await summary.locator('.v2-cause-summary-title').boundingBox();
    expect(numberBox.x + numberBox.width).toBeLessThanOrEqual(titleBox.x - 4);
    await summary.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(summary).toBeFocused();
    const focus = await summary.evaluate(node => ({ width: parseFloat(getComputedStyle(node).outlineWidth), offset: parseFloat(getComputedStyle(node).outlineOffset) }));
    expect(focus.width).toBeGreaterThanOrEqual(2);
    expect(focus.offset).toBeGreaterThanOrEqual(2);
    await page.keyboard.press('Enter');
    await expect(page.locator('details').first()).toHaveAttribute('open', '');
    const rows = await page.locator('details').first().locator('.v2-initiative-row').evaluateAll(nodes => nodes.map(node => {
      const text = node.querySelector('.v2-initiative-copy p');
      const logo = node.querySelector('.work-visual-placeholder-mark img');
      return { length: text.textContent.length, width: node.getBoundingClientRect().width,
        overflow: node.scrollWidth > node.clientWidth + 1,
        logoComplete: logo.complete && logo.naturalWidth > 0,
        labelHidden: getComputedStyle(node.querySelector('.work-visual-placeholder-label')).display === 'none',
      };
    }));
    expect(rows.length).toBeGreaterThan(1);
    for (const row of rows) {
      expect(row.length).toBeLessThanOrEqual(180);
      expect(row.overflow).toBe(false);
      expect(row.logoComplete).toBe(true);
      expect(row.labelHidden).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const select = page.locator('select').first();
    const control = await select.evaluate(node => ({ appearance: getComputedStyle(node).appearance, padding: parseFloat(getComputedStyle(node).paddingRight) }));
    expect(control.appearance).toBe('none');
    expect(control.padding).toBeGreaterThanOrEqual(40);
    await select.selectOption({ label: 'Medical & Financial Relief' });
    await expect(select).toHaveValue('Medical & Financial Relief');
    await page.keyboard.press('Shift+Tab');
  });
}

test('Highlights gradient moves and disables on reduced-motion preference', async ({ page }) => {
  await fixture(page, 'home-hero');
  const metric = page.locator('.v3-proof-item strong').first();
  const before = await metric.evaluate(node => getComputedStyle(node).backgroundPosition);
  await expect.poll(() => metric.evaluate(node => getComputedStyle(node).backgroundPosition)).not.toBe(before);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await metric.evaluate(node => getComputedStyle(node).animationName)).toBe('none');
});

test('corrected dark Home surfaces and expanded portfolio have no serious accessibility violations', async ({ page }) => {
  await fixture(page, 'home-hero');
  const home = await new AxeBuilder({ page }).include('.v3-eid').include('.v3-trust').analyze();
  expect(home.violations.filter(issue => ['serious', 'critical'].includes(issue.impact))).toEqual([]);
  await fixture(page, 'portfolio');
  await page.locator('summary').first().click();
  const portfolio = await new AxeBuilder({ page }).include('.v2-cause-stack').analyze();
  expect(portfolio.violations.filter(issue => ['serious', 'critical'].includes(issue.impact))).toEqual([]);
});
