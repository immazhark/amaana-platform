import { expect, test } from '@playwright/test';

function maxAge(response) {
  const value = response.headers()['cache-control'] ?? '';
  const match = /(?:^|,)\s*max-age=(\d+)(?:,|$)/i.exec(value);
  expect(match, `Cache-Control must declare a numeric max-age: ${value}`).toBeTruthy();
  return Number(match[1]);
}

function optimized(source) {
  const params = new URLSearchParams({ url: source, w: '32', q: '75' });
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
