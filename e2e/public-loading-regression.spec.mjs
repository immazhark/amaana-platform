import { expect, test } from "@playwright/test";

/**
 * Route-level fallbacks must not survive hydration or obscure the real page.
 * This complements unit checks on announcement semantics and avoids relying
 * on fragile artificial delays in the production data access layer.
 */
for (const path of ["/our-work", "/impact", "/stories", "/appeals", "/faith-and-reflections"]) {
  test(`public route fallback resolves to one real heading: ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204, body: "" }));

    const response = await page.goto(path, { waitUntil: "load" });
    expect(response?.ok(), `Navigation to ${path} should succeed`).toBe(true);
    await expect(page.locator("main h1")).toHaveCount(1);
    await expect(page.locator("[data-public-route-loading]")).toHaveCount(0);
    const geometry = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    }));
    expect(geometry.width, `${path} must not overflow on mobile`).toBeLessThanOrEqual(geometry.viewport + 1);
  });
}
