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
