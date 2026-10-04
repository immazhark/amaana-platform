import fs from 'node:fs/promises';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = ['/', '/about', '/our-work', '/impact', '/stories', '/faith-and-reflections', '/get-involved', '/get-involved/sponsor-education', '/partner', '/appeals', '/donate', '/request-assistance', '/request-assistance/status', '/request-assistance/received', '/contact', '/governance', '/transparency', '/compliance', '/recognition', '/how-we-verify', '/privacy', '/terms', '/donation-policy', '/refund-policy', '/our-work/eid-gift-kits', '/our-work/qurbani-meat-distribution', '/our-work/taleem', '/our-work/winter-relief', '/our-work/dates-distribution', '/our-work/hyderabad-flood-relief-2020', '/programmes/medical-financial-relief', '/programmes/emergency-relief', '/programmes/ramadan-eid', '/programmes/seasonal-relief', '/our-work/emergency-neonatal-medical-aid', '/admin/login', '/admin/forbidden', '/donations/invalid/acknowledgement', '/missing-regression-audit-page'];

async function open(page, route) {
  await page.route('**/api/analytics/page-view', request => request.fulfill({ status: 204, body: '' }));
  const response = await page.goto(route, { waitUntil: 'load' });
  expect(response?.status()).toBe(route === '/missing-regression-audit-page' ? 404 : 200);
  await expect(page.locator('main h1')).toHaveCount(1);
}

for (const [device, width, height] of [['mobile', 390, 844], ['desktop', 1440, 1000]]) {
  for (const route of routes) {
    test(`site audit ${device}: ${route}`, async ({ page }) => {
      test.setTimeout(60_000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await open(page, route);
      await page.evaluate(async () => { await document.fonts.ready; });
      const metrics = await page.evaluate(() => {
        const visible = n => n.getBoundingClientRect().width > 0 && !n.closest('[hidden],[inert],[aria-hidden="true"]');
        const viewport = document.documentElement.clientWidth;
        const headingOversize = [...document.querySelectorAll('main h2')].filter(n => visible(n) && !n.closest('.v3-home-banner') && parseFloat(getComputedStyle(n).fontSize) > 56.1).map(n => ({ text: n.textContent, size: getComputedStyle(n).fontSize }));
        const escapedTracks = [...document.querySelectorAll('[data-carousel-mode] [id^="carousel-"]')].filter(n => visible(n) && (n.getBoundingClientRect().left < -1 || n.getBoundingClientRect().right > viewport + 1)).map(n => n.getAttribute('aria-label'));
        const brokenAnchors = [...document.querySelectorAll('main a[href^="#"]')].filter(n => n.getAttribute('href').length > 1 && !document.getElementById(decodeURIComponent(n.getAttribute('href').slice(1)))).map(n => n.getAttribute('href'));
        return { overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > viewport + 1, headingOversize, escapedTracks, brokenAnchors };
      });
      expect(metrics).toEqual({ overflow: false, headingOversize: [], escapedTracks: [], brokenAnchors: [] });
      if (route === '/contact') {
        const markers = page.locator('.v2-intent-card > span[aria-hidden="true"]');
        await expect(markers).toHaveCount(6);
        expect(await markers.allTextContents()).toEqual(Array(6).fill(''));
        await expect(markers.locator('svg')).toHaveCount(6);
      }
      if (device === 'mobile') {
        const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        expect(audit.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
      }
      await page.addStyleTag({ content: '* { content-visibility: visible !important; }' });
      await page.evaluate(async () => {
        for (let top = 0; top < document.documentElement.scrollHeight; top += innerHeight * .8) {
          window.scrollTo(0, top);
          await new Promise(resolve => setTimeout(resolve, 60));
        }
        window.scrollTo(0, 0);
      });
      const directory = path.resolve(process.cwd(), 'site-audit', device);
      await fs.mkdir(directory, { recursive: true });
      const slug = route === '/' ? 'home' : route.slice(1).replaceAll('/', '--');
      await page.screenshot({ path: path.join(directory, `${slug}.jpg`), type: 'jpeg', quality: 65, fullPage: true, animations: 'disabled', caret: 'hide' });
      await fs.writeFile(path.join(directory, `${slug}.json`), JSON.stringify({ route, width, height, metrics, pageErrors: errors }, null, 2));
      expect(errors, `Runtime errors on ${route}`).toEqual([]);
    });
  }
}

for (const width of [320, 720, 1440]) {
  test(`tracking hydration and failed-request retry at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [], requests = [];
    let firstRequest;
    page.on('pageerror', error => errors.push(error.message));
    await open(page, '/request-assistance/status');
    await expect(page.getByRole('heading', { name: 'Tracking link unavailable', exact: true })).toBeVisible();
    expect(errors).toEqual([]);
    await page.route('**/api/assistance/status', request => {
      requests.push(request.request().postDataJSON());
      if (requests.length === 1) { firstRequest = request; return; }
      return request.fulfill({ status: 200, json: { found: true, status: 'UNDER_VERIFICATION', createdAt: '2026-10-01T09:00:00.000Z', updatedAt: '2026-10-02T09:00:00.000Z' } });
    });
    const credentials = { reference: 'AMA-AUDIT-SYNTHETIC', token: 'synthetic-regression-token-only-123456' };
    await page.goto(`/request-assistance/status#${new URLSearchParams(credentials)}`);
    await expect(page.getByRole('heading', { name: 'Checking your private request…', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start a new request', exact: true })).toHaveCount(0);
    await expect.poll(() => Boolean(firstRequest)).toBe(true);
    await firstRequest.fulfill({ status: 503, json: { error: 'Temporarily unavailable' } });
    await expect(page.getByRole('heading', { name: 'Unable to check your request', exact: true })).toBeVisible();
    expect(await page.evaluate(() => location.search + location.hash)).toBe('');
    await expect(page.getByRole('link', { name: 'Start a new request', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Try tracking again', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Under verification', exact: true })).toBeVisible();
    expect(requests).toEqual([credentials, credentials]);
    expect(errors).toEqual([]);
  });
}

test('confirmation needs a private reference and automatic slides do not interrupt live regions', async ({ page }) => {
  await open(page, '/request-assistance/received');
  await expect(page.getByRole('heading', { name: 'Request confirmation unavailable', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Track this request', exact: true })).toHaveCount(0);
  await page.goto('/request-assistance/received#reference=AMA-AUDIT-SYNTHETIC&token=synthetic-regression-token-only-123456');
  await expect(page.getByRole('heading', { name: /Your request is now in/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Track this request', exact: true })).toBeVisible();
  await page.goto('/browser-acceptance/body-carousel');
  const carousel = page.getByRole('region', { name: 'Body carousel acceptance', exact: true });
  await expect(carousel.locator('[aria-atomic="true"]')).toHaveAttribute('aria-live', 'off');
  await carousel.getByRole('button', { name: 'Pause automatic slides', exact: true }).click();
  await expect(carousel.locator('[aria-atomic="true"]')).toHaveAttribute('aria-live', 'polite');
});

for (const [device, width] of [['mobile', 390], ['desktop', 1440]]) {
  test(`published individual routes discovered from indexes: ${device}`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const discovered = new Set();
    for (const index of ['/our-work', '/appeals', '/stories', '/faith-and-reflections']) {
      await open(page, index);
      const links = await page.locator('main a[href]').evaluateAll(nodes => nodes.map(n => new URL(n.href).pathname).filter(p => /^\/(our-work|appeals|stories|faith-and-reflections)\/[^/]+$/.test(p)));
      for (const href of links) discovered.add(href);
    }
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const directory = path.resolve(process.cwd(), 'site-audit', device);
    await fs.mkdir(directory, { recursive: true });
    for (const route of discovered) {
      if (routes.includes(route)) continue;
      await open(page, route);
      const geometry = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
      expect(geometry.content, route).toBeLessThanOrEqual(geometry.viewport + 1);
      await page.addStyleTag({ content: '* { content-visibility: visible !important; }' });
      await page.screenshot({ path: path.join(directory, `${route.slice(1).replaceAll('/', '--')}.jpg`), type: 'jpeg', quality: 65, fullPage: true, animations: 'disabled' });
    }
    await fs.writeFile(path.join(directory, 'discovered-routes.json'), JSON.stringify([...discovered].sort(), null, 2));
    expect(errors).toEqual([]);
  });
}
