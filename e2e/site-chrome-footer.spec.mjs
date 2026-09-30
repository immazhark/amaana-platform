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
  await expect(page.getByText('AMAANA LIVE', { exact: true })).toBeVisible();
  await expect(page.getByText('Verified medical support', { exact: true })).toBeVisible();

  const ourWork = page.locator('.site-header .nav-link', { hasText: 'Our Work' });
  await ourWork.hover();
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
  const after = await footerLink.evaluate(element => getComputedStyle(element).color);
  expect(after).not.toBe(before);
});

test('shared chrome and footer remain overflow-free on 390px mobile', async ({ page }) => {
  await openFixture(page, 390);
  const geometry = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    logoWidth: document.querySelector('.site-header .brand-lockup')?.getBoundingClientRect().width ?? 0,
  }));
  expect(geometry.logoWidth).toBeGreaterThanOrEqual(60);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewport + 1);
  await expect(page.getByText('Reminder', { exact: true })).toBeVisible();
  await expect(page.getByText('AMAANA LIVE', { exact: true })).toBeVisible();
});

test('homepage hero fixture preserves breathing room and the 45/55 editorial split', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const response = await page.goto('/browser-acceptance/home-hero', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();

  const result = await page.evaluate(() => {
    const carousel = document.querySelector('.v3-home-banner-carousel');
    const content = document.querySelector('.v3-home-banner-content');
    const actions = document.querySelector('.v3-home-banner-actions');
    if (!carousel || !content || !actions) return null;
    const carouselRect = carousel.getBoundingClientRect();
    const actionsRect = actions.getBoundingClientRect();
    const style = getComputedStyle(content);
    return {
      height: carouselRect.height,
      bottomGap: carouselRect.bottom - actionsRect.bottom,
      paddingRight: Number.parseFloat(style.paddingRight),
      contentWidth: content.getBoundingClientRect().width,
      decorativeCount: document.querySelectorAll('.v3-home-banner-story-art,.v3-home-banner-story-year,.v3-home-banner-story-mark').length,
      viewport: document.documentElement.clientWidth,
      scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    };
  });

  expect(result).not.toBeNull();
  expect(result.height).toBeGreaterThanOrEqual(360);
  expect(result.bottomGap).toBeGreaterThanOrEqual(20);
  expect(result.paddingRight / result.contentWidth).toBeGreaterThan(0.52);
  expect(result.paddingRight / result.contentWidth).toBeLessThan(0.58);
  expect(result.decorativeCount).toBe(0);
  expect(result.scrollWidth).toBeLessThanOrEqual(result.viewport + 1);
});
