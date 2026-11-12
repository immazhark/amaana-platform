import { expect, test } from "@playwright/test";

// AF-R025: validate real mobile heading wraps and accessible computed leading.
for (const width of [320, 390]) {
  test(`Team hero remains readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204, body: "" }));
    const response = await page.goto("/team", { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBe(true);
    const heading = page.getByRole("heading", { level: 1, name: "The people behind Amaana" });
    await expect(heading).toBeVisible();
    const metric = await heading.evaluate(node => {
      const style = getComputedStyle(node);
      const height = parseFloat(style.lineHeight);
      const rect = node.getBoundingClientRect();
      return {
        ratio: height / parseFloat(style.fontSize),
        lines: rect.height / height,
        left: rect.left,
        right: rect.right,
      };
    });
    expect(metric.ratio).toBeGreaterThanOrEqual(1.12);
    expect(metric.ratio).toBeLessThanOrEqual(1.24);
    expect(metric.lines).toBeGreaterThanOrEqual(1.45);
    expect(metric.left).toBeGreaterThanOrEqual(-1);
    expect(metric.right).toBeLessThanOrEqual(width + 1);
  });
}
