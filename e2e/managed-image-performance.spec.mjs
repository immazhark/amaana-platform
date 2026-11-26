import { expect, test } from '@playwright/test';
import sharp from 'sharp';

const path = i => `/media/2099/00000000-0000-4000-8000-00000000000${i}.jpg`;

for (const profile of [
  { name: 'mobile', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 },
  { name: 'desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
]) {
  test(`managed gallery measures actual cold browser transfer on ${profile.name}`, async ({ browser }) => {
    test.setTimeout(60_000);
    const results = {};
    for (const mode of ['original', 'responsive']) {
      const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000', viewport: profile.viewport, deviceScaleFactor: profile.deviceScaleFactor, reducedMotion: 'reduce' });
      try {
        const page = await context.newPage();
        const responses = [];
        page.on('response', response => {
          if (new URL(response.url()).pathname.startsWith('/media/2099/')) responses.push(response);
        });
        const document = await page.goto('/browser-acceptance/managed-image-gallery?mode=' + mode);
        expect(document?.ok()).toBeTruthy();
        const images = page.getByRole('group', { name: 'Programme photographs' }).getByRole('img');
        await expect(images).toHaveCount(4);
        // Exercise lazy loading, without counting full-resolution lightbox requests.
        for (const image of await images.all()) {
          await image.scrollIntoViewIfNeeded();
          await image.evaluate(element => element.decode());
        }
        const snapshot = await page.evaluate(() => {
          const selected = Array.from(document.querySelectorAll('img[alt^="Synthetic texture"]'), image => new URL(image.currentSrc).pathname + new URL(image.currentSrc).search);
          const entries = performance.getEntriesByType('resource').filter(entry => new URL(entry.name).pathname.startsWith('/media/2099/'));
          return {
            selected,
            entries: entries.map(entry => ({ url: new URL(entry.name).pathname + new URL(entry.name).search, body: entry.encodedBodySize, transfer: entry.transferSize })),
          };
        });
        expect(snapshot.selected).toHaveLength(4);
        expect(new Set(snapshot.selected).size).toBe(4);
        expect(snapshot.entries).toHaveLength(4);
        expect(responses).toHaveLength(4);
        for (const response of responses) {
          expect(response.status()).toBe(200);
          expect(response.headers()['cache-control']).toContain('no-store');
          expect(response.headers()['content-type']).toBe(mode === 'responsive' ? 'image/webp' : 'image/jpeg');
        }
        for (const selected of snapshot.selected) {
          expect(selected).toMatch(mode === 'responsive' ? /\.jpg\?w=(384|640|960|1280)$/ : /\.jpg$/);
          const entry = snapshot.entries.find(entry => entry.url === selected);
          expect(entry?.body).toBeGreaterThan(0);
          expect(entry?.transfer).toBeGreaterThanOrEqual(entry?.body);
          if (mode === 'responsive') expect(entry.body).toBeLessThanOrEqual(1024 * 1024);
        }
        results[mode] = {
          body: snapshot.entries.reduce((sum, entry) => sum + entry.body, 0),
          transfer: snapshot.entries.reduce((sum, entry) => sum + entry.transfer, 0),
          widths: snapshot.selected.map(url => new URL(url, 'http://localhost').searchParams.get('w')),
        };
      } finally { await context.close(); }
    }
    console.log('Synthetic managed gallery ' + profile.name + ': ' + JSON.stringify(results));
    expect(results.responsive.body).toBeLessThan(results.original.body * 0.5);
    expect(results.responsive.transfer).toBeLessThan(results.original.transfer * 0.5);
  });
}

test('four simultaneous native renditions succeed and invalid variants are denied', async ({ request }) => {
  const widths = [384, 640, 960, 1280];
  const responses = await Promise.all(widths.map((width, index) => request.get(path(index + 1) + '?w=' + width)));
  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toContain('no-store');
    const bytes = await response.body();
    expect(bytes.length).toBeGreaterThan(0);
    expect(bytes.length).toBeLessThanOrEqual(1024 * 1024);
    expect((await sharp(bytes).metadata()).width).toBe(widths[i]);
  }
  for (const query of ['?w=641', '?w=640&w=384', '?quality=100']) {
    const response = await request.get(path(1) + query);
    expect(response.status()).toBe(404);
    expect(response.headers()['cache-control']).toContain('no-store');
  }
  const denied = await request.get('/_next/image?' + new URLSearchParams({ url: path(1) + '?w=640', w: '384', q: '75' }));
  expect(denied.status()).toBe(400);
});
