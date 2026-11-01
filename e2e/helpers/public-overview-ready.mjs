import { expect } from '@playwright/test';

/**
 * Public App Router overview pages can first return an accessible streamed
 * fallback. Wait for the actual page content before measuring typography,
 * geometry, visual tokens or completed outcomes.
 *
 * This is not a network-idle shortcut and cannot mask a stalled server page:
 * the unique page-hero element must become visible within the test timeout.
 * Detail pages, redirects and 404 checks retain their existing HTTP contracts.
 */
export const overviewPaths = new Set([
  '/stories',
  '/our-work',
  '/impact',
  '/appeals',
  '/faith-and-reflections',
]);

export async function waitForPublicOverview(page, pathname) {
  const path = new URL(pathname, 'https://amaanafoundation.org').pathname;
  if (!overviewPaths.has(path)) return;
  await expect(page.locator('main .page-hero__title')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('main #public-route-loading-title')).toHaveCount(0);
}
