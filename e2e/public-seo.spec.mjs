import { expect, test } from '@playwright/test';

const productionOrigin = 'https://amaanafoundation.org';
const representativeRoutes = [
  '/',
  '/our-work',
  '/impact',
  '/stories',
  '/faith-and-reflections',
  '/about',
  '/appeals',
  '/donate',
  '/get-involved/sponsor-education',
  '/how-we-verify',
  '/transparency',
  '/governance',
  '/recognition',
  '/partner',
  '/privacy',
  '/request-assistance',
  '/contact',
];

function canonicalFor(path) {
  return path === '/' ? productionOrigin : `${productionOrigin}${path}`;
}

for (const path of representativeRoutes) {
  test(`SEO metadata is complete for ${path}`, async ({ page }) => {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.ok(), `${path} should render successfully`).toBeTruthy();

    await expect(page).toHaveTitle(/Amaana Foundation/i);
    const documentTitle = await page.title();
    expect(
      (documentTitle.match(/Amaana Foundation/gi) ?? []).length,
      `${path} should not repeat the Amaana Foundation brand in the document title`,
    ).toBeLessThanOrEqual(1);

    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveCount(1);
    await expect(description).toHaveAttribute('content', /\S.{20,}/);

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
    await expect(canonical).toHaveAttribute('href', canonicalFor(path));

    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveCount(1);
    await expect(robots).toHaveAttribute('content', /noindex/i);

    const ogTitle = page.locator('meta[property="og:title"]');
    const ogDescription = page.locator('meta[property="og:description"]');
    const ogUrl = page.locator('meta[property="og:url"]');
    await expect(ogTitle).toHaveCount(1);
    await expect(ogTitle).toHaveAttribute('content', /Amaana Foundation/i);
    await expect(ogDescription).toHaveCount(1);
    await expect(ogDescription).toHaveAttribute('content', /\S.{20,}/);
    await expect(ogUrl).toHaveCount(1);
    await expect(ogUrl).toHaveAttribute('content', canonicalFor(path));

    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveCount(1);
    await expect(ogImage).toHaveAttribute('content', /\/opengraph-image(?:\?|$)/);

    const twitterCard = page.locator('meta[name="twitter:card"]');
    const twitterImage = page.locator('meta[name="twitter:image"]');
    await expect(twitterCard).toHaveCount(1);
    await expect(twitterCard).toHaveAttribute('content', 'summary_large_image');
    await expect(twitterImage).toHaveCount(1);
    await expect(twitterImage).toHaveAttribute('content', /\/twitter-image(?:\?|$)/);
  });
}

test('default social share images are privacy-safe generated PNG assets', async ({ request }) => {
  for (const path of ['/opengraph-image', '/twitter-image']) {
    const response = await request.get(path);
    expect(response.ok(), `${path} should render successfully`).toBeTruthy();
    expect(response.headers()['content-type']).toMatch(/^image\/png/i);
    const bytes = await response.body();
    expect(bytes.byteLength, `${path} should contain a rendered social image`).toBeGreaterThan(5_000);
  }
});


test('admin sign-in remains explicitly private even when public SEO metadata exists', async ({ page }) => {
  const response = await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();

  const robots = page.locator('meta[name="robots"]');
  await expect(robots).toHaveCount(1);
  await expect(robots).toHaveAttribute('content', /noindex/i);
  await expect(robots).toHaveAttribute('content', /nofollow/i);

  const referrer = page.locator('meta[name="referrer"]');
  await expect(referrer).toHaveCount(1);
  await expect(referrer).toHaveAttribute('content', 'no-referrer');
});


test('published programme detail exposes canonical WebPage structured data linked to Amaana', async ({ page }) => {
  const response = await page.goto('/our-work/eid-gift-kits', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();

  const schema = page.locator('script[data-public-content-schema="WebPage"]');
  await expect(schema).toHaveCount(1);

  const data = JSON.parse(await schema.textContent());
  expect(data['@context']).toBe('https://schema.org');
  expect(data['@type']).toBe('WebPage');
  expect(data.url).toBe('https://amaanafoundation.org/our-work/eid-gift-kits');
  expect(data.publisher).toEqual({ '@id': 'https://amaanafoundation.org/#organization' });
  expect(data.isPartOf).toEqual({ '@id': 'https://amaanafoundation.org/#website' });
  expect(data.name).toMatch(/Eid Gift Kits/i);
  expect(data.description).toMatch(/\S.{20,}/);
});


test('published programme category exposes canonical WebPage structured data', async ({ page }) => {
  const response = await page.goto('/programmes/ramadan-eid', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();

  const schema = page.locator('script[data-public-content-schema="WebPage"]');
  await expect(schema).toHaveCount(1);

  const data = JSON.parse(await schema.textContent());
  expect(data['@context']).toBe('https://schema.org');
  expect(data['@type']).toBe('WebPage');
  expect(data.url).toBe('https://amaanafoundation.org/programmes/ramadan-eid');
  expect(data.publisher).toEqual({ '@id': 'https://amaanafoundation.org/#organization' });
  expect(data.isPartOf).toEqual({ '@id': 'https://amaanafoundation.org/#website' });
  expect(data.name).toMatch(/Ramadan & Eid/i);
  expect(data.description).toMatch(/\S.{20,}/);
});

test('legacy Our Work aliases resolve to their canonical public destinations', async ({ page }) => {
  const cases = [
    ['/our-work/medical-financial-assistance', '/programmes/medical-financial-relief'],
    ['/our-work/winter-drive-2025-26', '/our-work/winter-relief'],
    ['/our-work/meat-distribution-2026', '/our-work/qurbani-meat-distribution-2026'],
    ['/our-work/medical-aid-eight-day-old-baby', '/our-work/emergency-neonatal-medical-aid'],
  ];

  for (const [legacy, canonical] of cases) {
    const response = await page.goto(legacy, { waitUntil: 'domcontentloaded' });
    expect(response?.ok(), `${legacy} should resolve successfully`).toBeTruthy();
    expect(new URL(page.url()).pathname).toBe(canonical);

    const canonicalLink = page.locator('link[rel="canonical"]');
    await expect(canonicalLink).toHaveCount(1);
    await expect(canonicalLink).toHaveAttribute('href', canonicalFor(canonical));
  }
});
