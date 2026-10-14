import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`real transaction error boundaries retain their layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204, body: "" }));

    const response = await page.goto("/browser-acceptance/transaction-errors");
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: "Transaction error boundary stylesheet acceptance" })).toBeVisible();

    for (const type of ["donate", "assistance"]) {
      const boundary = page.locator(`[data-error-boundary="${type}"] .v2-error-page`);
      await expect(boundary).toBeVisible();
      await expect(boundary).toHaveCSS("display", "flex");

      const layout = await boundary.evaluate(el => {
        const style = getComputedStyle(el);
        return {
          minHeight: Number.parseFloat(style.minHeight),
          contentPaddingTop: Number.parseFloat(getComputedStyle(el.querySelector(".v2-error-content")).paddingTop),
        };
      });
      expect(layout.minHeight).toBeGreaterThanOrEqual(500);
      expect(layout.contentPaddingTop).toBeGreaterThan(0);
      const lineHeightRatio = await boundary.getByRole("heading", { level: 1 }).evaluate(el => {
        const style = getComputedStyle(el);
        return Number.parseFloat(style.lineHeight) / Number.parseFloat(style.fontSize);
      });
      expect(lineHeightRatio).toBeGreaterThanOrEqual(1.1);
      await expect(boundary.getByRole("button", { name: "Try again" })).toBeEnabled();
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
