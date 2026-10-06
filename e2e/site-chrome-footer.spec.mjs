import { expect, test } from '@playwright/test';

async function openFixture(page, width = 1440) {
  await page.setViewportSize({ width, height: 900 });
  await page.route('**/api/public/live-rail', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      items: [{
        id: 'appeal-fixture',
        kind: 'appeal',
        eyebrow: 'Live appeal',
        title: 'Verified medical support',
        subtitle: 'Synthetic browser acceptance item.',
        detailsHref: '/appeals',
        supportHref: '/donate',
        detailsCta: 'View',
        supportCta: 'Donate',
      }],
    }),
  }));
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const response = await page.goto('/browser-acceptance/gallery', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
}

test('shared header, reminder/live rail and footer use one deliberate desktop system', async ({ page }) => {
  await openFixture(page);

  const chrome = await page.evaluate(() => {
    const header = document.querySelector('.site-header .nav');
    const logo = document.querySelector('.site-header .brand-lockup');
    const reminder = document.querySelector('.amaana-reminders');
    return {
      headerHeight: header?.getBoundingClientRect().height ?? 0,
      logoWidth: logo?.getBoundingClientRect().width ?? 0,
      reminderHeight: reminder?.getBoundingClientRect().height ?? 0,
      viewport: document.documentElement.clientWidth,
      scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    };
  });

  expect(chrome.headerHeight).toBeGreaterThanOrEqual(76);
  expect(chrome.logoWidth).toBeGreaterThanOrEqual(70);
  expect(chrome.reminderHeight).toBeLessThanOrEqual(60);
  expect(chrome.scrollWidth).toBeLessThanOrEqual(chrome.viewport + 1);

  await expect(page.getByText('Reminder', { exact: true })).toBeVisible();
  await expect(page.locator('.amaana-reminder-lane')).toHaveAttribute('role', 'group');
  await expect(page.locator('.amaana-live-lane')).toHaveAttribute('role', 'group');
  await expect(page.getByText('AMAANA LIVE', { exact: true })).toBeVisible();
  await expect(page.getByText('Verified medical support', { exact: true })).toBeVisible();

  const ourWork = page.locator('.site-header .nav-link', { hasText: 'Our Work' });
  await ourWork.hover();
  await expect.poll(() => ourWork.evaluate(element => Number(getComputedStyle(element, '::after').opacity))).toBe(1);
  const underline = await ourWork.evaluate(element => {
    const style = getComputedStyle(element, '::after');
    return { opacity: Number(style.opacity), height: Number.parseFloat(style.height), transform: style.transform };
  });
  expect(underline.opacity).toBe(1);
  expect(underline.height).toBeGreaterThanOrEqual(3);
  expect(underline.transform).not.toBe('none');

  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  const footerGeometry = await page.evaluate(() => {
    const title = document.querySelector('.footer-lead h2')?.getBoundingClientRect();
    const intro = document.querySelector('.footer-intro')?.getBoundingClientRect();
    return { titleLeft: title?.left ?? 0, introLeft: intro?.left ?? 0 };
  });
  expect(Math.abs(footerGeometry.titleLeft - footerGeometry.introLeft)).toBeLessThanOrEqual(2);

  await expect(page.locator('.footer-socials a')).toHaveCount(4);
  await expect(page.locator('.footer-socials a[href*="threads.net"]')).toHaveCount(1);
  await expect(page.locator('.footer-social-icon svg')).toHaveCount(4);

  const footerLink = page.locator('.footer-links a').first();
  const before = await footerLink.evaluate(element => getComputedStyle(element).color);
  await footerLink.hover();
  await expect.poll(() => footerLink.evaluate(element => getComputedStyle(element).color)).not.toBe(before);
});

test('shared chrome and footer remain overflow-free on 390px mobile', async ({ page }) => {
  await openFixture(page, 390);
  const geometry = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    logoWidth: document.querySelector('.site-header .brand-lockup')?.getBoundingClientRect().width ?? 0,
    railHeight: document.querySelector('.amaana-reminders')?.getBoundingClientRect().height ?? 0,
  }));
  expect(geometry.logoWidth).toBeGreaterThanOrEqual(60);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.railHeight).toBeLessThanOrEqual(110);
  await expect(page.getByText('Reminder', { exact: true })).toBeVisible();
  await expect(page.getByText('AMAANA LIVE', { exact: true })).toBeVisible();
  const railText = await page.locator('.amaana-reminder-content strong, .amaana-live-content strong').evaluateAll(nodes =>
    nodes.map(node => ({ textOverflow: getComputedStyle(node).textOverflow, whiteSpace: getComputedStyle(node).whiteSpace })),
  );
  for (const item of railText) {
    expect(item.textOverflow).not.toBe('ellipsis');
    expect(item.whiteSpace).not.toBe('nowrap');
  }
});

test('homepage hero fixture preserves breathing room and two-column editorial alignment', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const response = await page.goto('/browser-acceptance/home-hero', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();

  const result = await page.evaluate(() => {
    const carousel = document.querySelector('.v3-home-banner-carousel');
    const content = document.querySelector('[data-active="true"] .v3-home-banner-content');
    const actions = document.querySelector('[data-active="true"] .v3-home-banner-actions');
    if (!carousel || !content || !actions) return null;
    const carouselRect = carousel.getBoundingClientRect();
    const actionsRect = actions.getBoundingClientRect();
    const style = getComputedStyle(content);
    return {
      height: carouselRect.height,
      bottomGap: carouselRect.bottom - actionsRect.bottom,
      copyWidth: content.querySelector(".v3-home-banner-copy").getBoundingClientRect().width,
      columns: style.gridTemplateColumns.split(" ").length,
      contentWidth: content.getBoundingClientRect().width,
      decorativeCount: document.querySelectorAll('.v3-home-banner-story-art,.v3-home-banner-story-year,.v3-home-banner-story-mark').length,
      viewport: document.documentElement.clientWidth,
      scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    };
  });

  expect(result).not.toBeNull();
  expect(result.height).toBeGreaterThanOrEqual(360);
  expect(result.bottomGap).toBeGreaterThanOrEqual(20);
  expect(result.columns).toBe(2);
  expect(result.copyWidth / result.contentWidth).toBeGreaterThan(0.48);
  expect(result.copyWidth / result.contentWidth).toBeLessThan(0.55);
  expect(result.decorativeCount).toBe(0);
  await expect(page.locator('.hero-dots')).toHaveAttribute('role', 'group');
  await expect(page.getByRole('group', { name: 'Choose a banner slide' })).toBeVisible();
  expect(result.scrollWidth).toBeLessThanOrEqual(result.viewport + 1);
});

for (const width of [1440, 1280, 1024, 768, 390, 320]) {
  test(`shared chrome, real home carousel and five Highlights at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/public/live-rail', route => route.fulfill({ json: { items: [] } }));
    await page.goto('/browser-acceptance/home-hero', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.v3-proof-item')).toHaveCount(5);
    await expect(page.locator('.v3-timeline')).toHaveAttribute('role', 'group');
    await expect(page.locator('.v3-proof-item').last()).toContainText('₹12,14,520');
    const metricWidths = await page.locator('.v3-proof-item strong').evaluateAll(nodes => nodes.map(node => ({ width: node.clientWidth, scroll: node.scrollWidth })));
    for (const metric of metricWidths) expect(metric.scroll).toBeLessThanOrEqual(metric.width + 1);
    const geometry = await page.evaluate(() => {
      const rect = selector => document.querySelector(selector).getBoundingClientRect();
      const hero = rect('.v3-home-banner-carousel');
      const buttons = rect('[data-active="true"] .v3-home-banner-actions');
      const copy = rect('[data-active="true"] .v3-home-banner-content');
      const nav = rect('.site-header .nav');
      const footer = rect('.site-footer > .container');
      const lead = rect('.footer-lead');
      const grid = rect('.footer-grid-v2');
      const reminder = rect('.amaana-reminder-inner');
      return {
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        bottomGap: hero.bottom - buttons.bottom,
        topGap: buttons.top - hero.top,
        edges: [copy.left, footer.left, reminder.left], navLeft: nav.left,
        footerGap: grid.top - lead.bottom,
        companionPosition: getComputedStyle(document.querySelector('.amaana-companion')).position,
      };
    });
    expect(geometry.overflow).toBe(false);
    expect(geometry.bottomGap).toBeGreaterThanOrEqual(20);
    expect(geometry.topGap).toBeGreaterThanOrEqual(0);
    for (const left of geometry.edges) expect(Math.abs(left - geometry.navLeft)).toBeLessThanOrEqual(1);
    expect(geometry.footerGap).toBeLessThanOrEqual(1);
    expect(geometry.companionPosition).toBe('fixed');
    await page.locator('.site-footer').scrollIntoViewIfNeeded();
    if (width <= 520) {
      await page.locator('.footer-nav-toggle').first().click();
      const targets = await page.locator('.footer-nav-group').first().locator('.footer-links a').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
      for (const height of targets) expect(height).toBeGreaterThanOrEqual(44);
    }
  });
}

test('footer current route stays gold and matches Home typography', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/browser-acceptance/home-hero');
  const home = await page.locator('.footer-lead h2').evaluate(node => getComputedStyle(node).fontSize);
  await page.goto('/about');
  await expect(page.locator('.footer-links a[aria-current="page"]')).toHaveText('Our Story');
  const current = await page.locator('.footer-links a[aria-current="page"]').evaluate(node => getComputedStyle(node).color);
  expect(current).toBe('rgb(255, 217, 90)');
  expect(await page.locator('.footer-lead h2').evaluate(node => getComputedStyle(node).fontSize)).toBe(home);
});

test('Amaana Live rotates independently and pauses for hover, focus and reduced motion', async ({ page }) => {
  await page.clock.install();
  const items = ['First verified need', 'Second verified need'].map((title, index) => ({
    id: `fixture-${index}`, kind: 'appeal', eyebrow: 'Live appeal', title,
    detailsHref: '/appeals', supportHref: '/donate', detailsCta: 'View', supportCta: 'Donate',
  }));
  await page.route('**/api/public/live-rail', route => route.fulfill({ json: { items } }));
  await page.goto('/browser-acceptance/home-hero');
  const title = page.locator('.amaana-live-content strong');
  await expect(title).toHaveText(items[0].title);
  const reminder = await page.locator('.amaana-reminder-content strong').textContent();
  await page.clock.runFor(12_100);
  await expect(title).toHaveText(items[1].title);
  await expect(page.locator('.amaana-reminder-content strong')).toHaveText(reminder);
  await page.locator('.amaana-live-lane').hover();
  await page.clock.runFor(24_100);
  await expect(title).toHaveText(items[1].title);
  await page.mouse.move(1, 500);
  await page.locator('.amaana-live-link').focus();
  await page.clock.runFor(24_100);
  await expect(title).toHaveText(items[1].title);
  await page.locator('.amaana-live-link').evaluate(node => node.blur());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.runFor(24_100);
  await expect(title).toHaveText(items[1].title);
});
