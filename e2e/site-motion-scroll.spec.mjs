import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function open(page, route = '/about', fine = true) {
  // Headless Linux has no physical pointer. Exercise the fine-pointer policy explicitly.
  if (fine) await page.addInitScript(() => {
    const native = window.matchMedia.bind(window);
    window.matchMedia = query => {
      const result = native(query);
      if (query === '(pointer: fine)') Object.defineProperty(result, 'matches', { value: true });
      return result;
    };
  });
  await page.route('**/api/analytics/page-view', r => r.fulfill({ status: 204, body: '' }));
  const response = await page.goto(route, { waitUntil: 'load' });
  expect(response?.ok()).toBe(true);
  if (!route.startsWith('/browser-acceptance/')) await expect(page.locator('main h1')).toHaveCount(1);
}

test('fine-pointer smoothing loads on demand, settles and releases reduced-motion immediately', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await open(page);
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
  await page.mouse.move(700, 600);
  await page.mouse.wheel(0, 200);
  await expect(page.locator('html')).toHaveClass(/lenis/);
  const start = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 350);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(start + 300);
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('lenis-scrolling'))).toBe(false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
  await page.keyboard.press('Home');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  expect(errors).toEqual([]);
});

test('Motion feedback restores styles and responds to live preference changes', async ({ page }) => {
  await open(page);
  const action = page.locator('.nav-donate');
  await action.hover();
  await expect.poll(() => action.evaluate(n => n.style.translate)).toBe('0px -1px');
  await page.mouse.move(500, 400);
  await expect.poll(() => action.evaluate(n => n.style.translate)).toBe('');
  await action.focus();
  await expect(action).toBeFocused();
  await expect.poll(() => action.evaluate(n => n.style.translate)).toBe('0px -1px');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => action.evaluate(n => ({ translate: n.style.translate, scale: n.style.scale, animations: n.getAnimations().length }))).toEqual({ translate: '', scale: '', animations: 0 });
  await expect(action).toBeFocused();
});

test('route navigation destroys old scrolling and leaves the new page readable', async ({ page }) => {
  await open(page);
  await page.mouse.move(700, 500);
  await page.mouse.wheel(0, 200);
  await expect(page.locator('html')).toHaveClass(/lenis/);
  await page.locator('.nav-links').getByRole('link', { name: 'Our Work', exact: true }).click();
  await expect(page).toHaveURL(/\/our-work$/);
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
  await expect(page.locator('.amaana-navigation-loading')).toHaveCount(0);
});

test('nested carousel controls retain horizontal navigation while Lenis is active', async ({ page }) => {
  await open(page, '/browser-acceptance/body-carousel');
  await page.mouse.move(10, 20);
  await page.mouse.wheel(0, 100);
  await expect(page.locator('html')).toHaveClass(/lenis/);
  const carousel = page.locator('[data-carousel-mode]').first();
  const track = carousel.locator('[id^="carousel-"]');
  await track.scrollIntoViewIfNeeded();
  await track.focus();
  const start = await track.evaluate(n => n.scrollLeft);
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => track.evaluate(n => n.scrollLeft)).toBeGreaterThan(start);
  await expect(track).toBeFocused();
});

for (const route of ['/about', '/contact', '/request-assistance', '/donate', '/privacy', '/our-work/eid-gift-kits', '/admin/login']) {
  test(`reduced-motion content and keyboard skip link remain native: ${route}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, route);
    await page.mouse.move(600, 400);
    await page.mouse.wheel(0, 300);
    await expect(page.locator('html')).not.toHaveClass(/lenis/);
    const skip = page.locator('.v2-skip-link');
    await skip.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
    expect(await page.locator('#main').evaluate(n => getComputedStyle(n).opacity)).toBe('1');
    expect(await page.locator('#main').evaluate(n => n.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length)).toBe(0);
  });
}

test.describe('native touch', () => {
test.use({ hasTouch: true, isMobile: true });
test('touch layout keeps native scrolling and an accessible mobile menu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '/about', false);
  await page.mouse.move(150, 600);
  await page.mouse.wheel(0, 200);
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await expect(page.locator('#mobile-navigation')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeFocused();
});
});

for (const route of ['/', '/about', '/our-work', '/impact', '/stories', '/faith-and-reflections', '/contact', '/get-involved', '/get-involved/sponsor-education', '/partner', '/donate', '/request-assistance', '/privacy', '/terms', '/donation-policy', '/refund-policy', '/governance', '/transparency', '/compliance', '/recognition', '/how-we-verify', '/appeals', '/our-work/eid-gift-kits', '/our-work/taleem', '/our-work/winter-relief', '/programmes/medical-financial-relief']) {
  test(`enhanced text contrast: ${route}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, route, false);
    await expect(page.locator('main h1')).not.toContainText(/Something went wrong|temporarily unavailable|could not|not found/i);
    const audit = await new AxeBuilder({ page }).withTags(['wcag2aaa']).analyze();
    expect(audit.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
  });
}
