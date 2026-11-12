import { expect, test } from "@playwright/test";

// Real public content and CSS: no fabricated beneficiary or fundraising records.
for (const width of [320, 390, 1440]) {
  test(`transparency evidence heading keeps readable multiline leading at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204, body: "" }));
    const response = await page.goto("/transparency", { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBe(true);
    const heading = page.locator(".canonical-body > [data-trust-evidence-boundary] .v2-section-title");
    await expect(heading).toHaveCount(1);
    await expect(heading).toBeVisible();
    const result = await heading.evaluate(node => {
      const style = getComputedStyle(node);
      const lineHeight = parseFloat(style.lineHeight);
      const fontSize = parseFloat(style.fontSize);
      const rect = node.getBoundingClientRect();
      return {
        leading: lineHeight / fontSize,
        lines: rect.height / lineHeight,
        left: rect.left,
        right: rect.right,
      };
    });
    expect(result.leading).toBeGreaterThanOrEqual(1.12);
    expect(result.leading).toBeLessThanOrEqual(1.24);
    expect(result.left).toBeGreaterThanOrEqual(-1);
    expect(result.right).toBeLessThanOrEqual(width + 1);
    if (width === 320) expect(result.lines).toBeGreaterThan(1.4);
  });
}
