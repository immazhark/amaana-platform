import { expect, test } from "@playwright/test";

test("Impact metrics retain readable leading when text wraps", async ({ page }) => {
  const response = await page.goto("/impact", { waitUntil: "domcontentloaded" });
  expect(response?.ok()).toBe(true);

  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: width < 400 ? 800 : 1000 });
    const metric = await page.evaluate(() => {
      // CSS-only test content. No live impact number or recipient is used.
      const copy = document.createElement("div");
      copy.className = "v2-impact-tile-copy";
      copy.style.width = "8rem";
      copy.style.position = "absolute";
      copy.style.left = "-10000px";
      const strong = document.createElement("strong");
      strong.textContent = "Synthetic metric for wrapping review";
      copy.append(strong);
      document.querySelector("main").append(copy);
      try {
        const style = getComputedStyle(strong);
        const range = document.createRange();
        range.selectNodeContents(strong);
        return {
          fontSize: Number.parseFloat(style.fontSize),
          lineHeight: Number.parseFloat(style.lineHeight),
          lineFragments: range.getClientRects().length,
        };
      } finally {
        copy.remove();
      }
    });

    expect(metric.lineFragments, `${width}px synthetic metric must wrap`).toBeGreaterThan(1);
    expect(metric.lineHeight / metric.fontSize, `${width}px multiline leading`).toBeGreaterThanOrEqual(1.05);
  }
});
