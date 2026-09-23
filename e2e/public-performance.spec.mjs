import { expect, test } from '@playwright/test';

async function cssPayload(page, path) {
  const response = await page.goto(path, { waitUntil: 'load' });
  expect(response, `Expected a document response for ${path}`).not.toBeNull();
  expect(response?.ok(), `Expected ${path} to render successfully`).toBeTruthy();

  const hrefs = await page.locator('link[rel="stylesheet"]').evaluateAll(nodes =>
    [...new Set(nodes.map(node => node.href).filter(Boolean))],
  );

  const bodies = [];
  let bytes = 0;
  for (const href of hrefs) {
    const stylesheet = await page.context().request.get(href);
    expect(stylesheet.ok(), `Expected stylesheet ${href} to load`).toBeTruthy();
    const body = await stylesheet.text();
    bodies.push(body);
    bytes += Buffer.byteLength(body);
  }

  return { hrefs, bytes, css: bodies.join('\n') };
}

test('homepage documentary CSS stays route-scoped', async ({ page }) => {
  const home = await cssPayload(page, '/');
  expect(home.css, 'Homepage must receive documentary field layout CSS').toContain('.v3-field-grid');

  const about = await cssPayload(page, '/about');
  expect(about.css, 'Non-home routes must not receive homepage documentary field layout CSS').not.toContain('.v3-field-grid');

  console.log(`CSS delivery: home=${home.bytes} bytes/${home.hrefs.length} stylesheets; about=${about.bytes} bytes/${about.hrefs.length} stylesheets`);
});


const clsRoutes = ['/', '/about', '/our-work', '/impact', '/stories', '/donate', '/request-assistance'];

for (const path of clsRoutes) {
  test(`${path} keeps cumulative layout shift within the launch budget`, async ({ page }) => {
    await page.addInitScript(() => {
      window.__amaanaCLS = 0;
      window.__amaanaLayoutShifts = [];
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.hadRecentInput) continue;
          window.__amaanaCLS += entry.value;
          window.__amaanaLayoutShifts.push({
            value: entry.value,
            sources: (entry.sources ?? []).map(source => ({
              node: source.node instanceof Element
                ? `${source.node.tagName.toLowerCase()}${source.node.id ? `#${source.node.id}` : ''}${typeof source.node.className === 'string' && source.node.className ? `.${source.node.className.trim().replace(/\s+/g, '.')}` : ''}`
                : null,
              previousRect: source.previousRect,
              currentRect: source.currentRect,
            })),
          });
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });

    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
    const response = await page.goto(path, { waitUntil: 'load' });
    expect(response?.ok(), `Expected ${path} to render successfully`).toBeTruthy();
    await page.waitForTimeout(750);

    const metrics = await page.evaluate(() => ({
      cls: window.__amaanaCLS ?? 0,
      shifts: window.__amaanaLayoutShifts ?? [],
    }));
    console.log(`CLS ${path}: ${metrics.cls.toFixed(4)}`);
    if (metrics.cls > 0.1) console.log(`CLS sources ${path}: ${JSON.stringify(metrics.shifts)}`);
    expect(metrics.cls, `${path} exceeded the CLS launch budget`).toBeLessThanOrEqual(0.1);
  });
}


const criticalPublicRoutes = ['/', '/about', '/our-work', '/appeals', '/donate', '/request-assistance'];

for (const path of criticalPublicRoutes) {
  test(`${path} avoids failed first-party resources and duplicate stylesheet delivery`, async ({ page }) => {
    const failed = [];
    page.on('requestfailed', request => {
      const url = new URL(request.url());
      if (url.origin !== 'http://127.0.0.1:3000') return;

      const failure = request.failure()?.errorText ?? 'unknown';
      const headers = request.headers();
      const isCancelledNextPrefetch = failure === 'net::ERR_ABORTED'
        && request.resourceType() === 'fetch'
        && (
          headers['next-router-prefetch'] === '1'
          || headers.rsc === '1'
          || headers.purpose === 'prefetch'
          || headers['sec-purpose'] === 'prefetch'
        );

      if (!isCancelledNextPrefetch) {
        failed.push({ url: url.pathname, failure, resourceType: request.resourceType() });
      }
    });

    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
    const response = await page.goto(path, { waitUntil: 'load' });
    expect(response?.ok(), `Expected ${path} to render successfully`).toBeTruthy();
    await page.waitForTimeout(250);

    const localResources = await page.evaluate(() => {
      const currentOrigin = window.location.origin;
      return performance.getEntriesByType('resource')
        .map(entry => new URL(entry.name, window.location.href))
        .filter(url => url.origin === currentOrigin)
        .map(url => url.pathname);
    });
    const stylesheets = localResources.filter(value => value.endsWith('.css'));

    expect(failed, `${path} had failed first-party requests`).toEqual([]);
    expect(new Set(stylesheets).size, `${path} loaded duplicate first-party stylesheets`).toBe(stylesheets.length);
  });
}

test('critical public routes do not load Razorpay before a donation journey needs checkout', async ({ page }) => {
  for (const path of ['/', '/about', '/our-work', '/appeals', '/request-assistance']) {
    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
    const response = await page.goto(path, { waitUntil: 'load' });
    expect(response?.ok(), `Expected ${path} to render successfully`).toBeTruthy();

    const razorpayResources = await page.evaluate(() =>
      performance.getEntriesByType('resource')
        .map(entry => entry.name)
        .filter(name => /razorpay/i.test(name)),
    );
    expect(razorpayResources, `${path} eagerly loaded payment-provider resources`).toEqual([]);
  }
});


test('homepage does not high-priority fetch inactive carousel photography', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const response = await page.goto('/', { waitUntil: 'load' });
  expect(response?.ok(), 'Expected homepage to render successfully').toBeTruthy();

  const inactivePriorityImages = page.locator('.v3-home-banner-slide[aria-hidden="true"] img[fetchpriority="high"]');
  await expect(inactivePriorityImages).toHaveCount(0);
});

test('Islamic companion detail panel remains interaction-gated and functional', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
  const response = await page.goto('/about', { waitUntil: 'load' });
  expect(response?.ok(), 'Expected About page to render successfully').toBeTruthy();

  await expect(page.locator('.amaana-companion-panel')).toHaveCount(0);

  const readingsButton = page.getByRole('button', { name: 'Ayah & Hadith' });
  await readingsButton.click();

  const panel = page.locator('#amaana-reading-panel');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading', { name: 'Today’s ayah & hadith' })).toBeVisible();

  await panel.getByRole('button', { name: 'Close companion' }).click();
  await expect(page.locator('.amaana-companion-panel')).toHaveCount(0);
  await expect(readingsButton).toBeFocused();
});
