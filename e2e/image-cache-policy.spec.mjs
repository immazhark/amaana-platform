import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import sharp from 'sharp';

function maxAge(response) {
  const value = response.headers()['cache-control'] ?? '';
  const match = /(?:^|,)\s*max-age=(\d+)(?:,|$)/i.exec(value);
  expect(match, `Cache-Control must declare a numeric max-age: ${value}`).toBeTruthy();
  return Number(match[1]);
}

function optimized(source, width = 32) {
  const params = new URLSearchParams({ url: source, w: String(width), q: '75' });
  return `/_next/image?${params}`;
}

test('optimizer respects short managed-source freshness instead of a one-year floor', async ({ request }) => {
  const source = '/browser-acceptance/image-cache-source?policy=bounded';
  const upstream = await request.get(source);
  expect(upstream.status()).toBe(200);
  expect(upstream.headers()['cache-control']).toContain('s-maxage=300');
  const response = await request.get(optimized(source), { headers: { accept: 'image/webp' } });
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/^image\//);
  expect(maxAge(response)).toBeGreaterThanOrEqual(60);
  expect(maxAge(response)).toBeLessThanOrEqual(300);
});

test('optimizer preserves explicitly long-lived static-source freshness', async ({ request }) => {
  const response = await request.get(optimized('/browser-acceptance/image-cache-source?policy=immutable'), {
    headers: { accept: 'image/webp' },
  });
  expect(response.status()).toBe(200);
  expect(maxAge(response)).toBe(31536000);
});

test('brand and artwork source headers preserve the existing static cache lifetime', async ({ request }) => {
  for (const source of ['/brand/amaana-mark.svg', '/hero/origin.webp', '/programme-artwork/taleem-diagonal-v3.webp']) {
    const response = await request.get(source);
    expect(response.status(), source).toBe(200);
    expect(response.headers()['cache-control'], source).toContain('immutable');
    expect(maxAge(response), source).toBe(31536000);
  }
});

test('optimizer negotiates AVIF and WebP at the requested responsive dimensions', async ({ request }) => {
  const source = '/hero/origin.webp';
  const upstream = await request.get(source);
  expect(upstream.status()).toBe(200);
  const original = await sharp(await upstream.body()).metadata();
  expect(original.width).toBeGreaterThanOrEqual(1280);
  expect(original.height).toBeGreaterThan(0);

  // Repeat WebP after AVIF at the same URL to detect format-cache collisions.
  for (const [width, accept, type] of [
    [412, 'image/webp', 'image/webp'],
    [412, 'image/avif,image/webp', 'image/avif'],
    [412, 'image/webp', 'image/webp'],
    [1280, 'image/webp', 'image/webp'],
  ]) {
    const label = `${width}px ${type}`;
    const response = await request.get(optimized(source, width), { headers: { accept } });
    expect(response.status(), label).toBe(200);
    expect(response.headers()['content-type'], label).toBe(type);
    const vary = (response.headers().vary ?? '').split(',').map(value => value.trim().toLowerCase());
    expect(vary, label).toContain('accept');
    const body = await response.body();
    if (type === 'image/avif') {
      expect(body.subarray(4, 12).toString('ascii'), label).toBe('ftypavif');
    } else {
      expect(body.subarray(0, 4).toString('ascii'), label).toBe('RIFF');
      expect(body.subarray(8, 12).toString('ascii'), label).toBe('WEBP');
    }
    const metadata = await sharp(body).metadata();
    expect(metadata.width, label).toBe(width);
    expect(metadata.height, label).toBe(Math.round(width * original.height / original.width));
  }
});

// Diagnostic, not a revocation acceptance gate: a successful diagnostic can
// still prove that optimized bytes remain exposed after origin withdrawal.
test('AF-N22 measures warmed optimizer exposure after same-URL synthetic withdrawal', async ({ request }, testInfo) => {
  const id = randomUUID().replaceAll('-', '');
  const source = '/browser-acceptance/image-cache-source?policy=revocable&id=' + id;
  const target = optimized(source, 32);
  const options = { headers: { accept: 'image/webp' } };
  const before = await request.get(source);
  expect(before.status()).toBe(200);
  expect(before.headers()['content-type']).toBe('image/png');
  const warmed = await request.get(target, options);
  expect(warmed.status()).toBe(200);
  expect(warmed.headers()['content-type']).toMatch(/^image\//);
  const bytes = await warmed.body();
  expect(bytes.byteLength).toBeGreaterThan(0);
  const withdrawal = await request.post(source);
  expect(withdrawal.status()).toBe(204);
  const originAfter = await request.get(source);
  expect(originAfter.status()).toBe(404);
  expect(originAfter.headers()['cache-control']).toBe('no-store');
  expect((await originAfter.body()).byteLength).toBe(0);
  const after = await request.get(target, options);
  const evidence = {
    originStatus: originAfter.status(),
    optimizerStatus: after.status(),
    optimizerCacheStatus: after.headers()['x-nextjs-cache'] ?? null,
    optimizerCacheControl: after.headers()['cache-control'] ?? null,
    cachedBytesStillServed: after.status() === 200,
    sameBytes: after.status() === 200 ? (await after.body()).equals(bytes) : null,
    revocationAccepted: false,
    scope: 'isolated synthetic Next optimizer; not a CDN/browser-cache or production withdrawal acceptance',
  };
  await testInfo.attach('media-withdrawal-cache-diagnostic', { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' });
  console.log('AF-N22 synthetic same-key withdrawal diagnostic: ' + JSON.stringify(evidence));
  expect([200, 400, 404]).toContain(after.status());
  if (after.status() === 200) {
    expect(evidence.sameBytes).toBe(true);
    expect(maxAge(after)).toBeLessThanOrEqual(300);
  }
});
