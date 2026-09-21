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


const clsRoutes = ['/', '/about', '/our-work', '/donate', '/request-assistance'];

for (const path of clsRoutes) {
  test(`${path} keeps cumulative layout shift within the launch budget`, async ({ page }) => {
    await page.addInitScript(() => {
      window.__amaanaCLS = 0;
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__amaanaCLS += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });

    await page.route('**/api/analytics/page-view', route => route.fulfill({ status: 204, body: '' }));
    const response = await page.goto(path, { waitUntil: 'load' });
    expect(response?.ok(), `Expected ${path} to render successfully`).toBeTruthy();
    await page.waitForTimeout(750);

    const cls = await page.evaluate(() => window.__amaanaCLS ?? 0);
    console.log(`CLS ${path}: ${cls.toFixed(4)}`);
    expect(cls, `${path} exceeded the CLS launch budget`).toBeLessThanOrEqual(0.1);
  });
}
