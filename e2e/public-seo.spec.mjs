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
  '/governance',
  '/privacy',
  '/request-assistance',
  '/contact',
];

function canonicalFor(path) {
  return path === '/' ? `${productionOrigin}/` : `${productionOrigin}${path}`;
}

for (const path of representativeRoutes) {
  test(`SEO metadata is complete for ${path}`, async ({ page }) => {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.ok(), `${path} should render successfully`).toBeTruthy();

    await expect(page).toHaveTitle(/Amaana Foundation/i);

    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveCount(1);
    await expect(description).toHaveAttribute('content', /\S.{20,}/);

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
    await expect(canonical).toHaveAttribute('href', canonicalFor(path));

    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveCount(1);
    await expect(robots).toHaveAttribute('content', /noindex/i);

    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveCount(1);
    await expect(ogImage).toHaveAttribute('content', /^https:\/\/amaanafoundation\.org\/.+/);

    const twitterCard = page.locator('meta[name="twitter:card"]');
    await expect(twitterCard).toHaveCount(1);
    await expect(twitterCard).toHaveAttribute('content', 'summary_large_image');
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
