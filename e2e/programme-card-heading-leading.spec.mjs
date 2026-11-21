import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

// AF-R025: fixed CSS plus deterministic long label; no real programme/public media records.
const css = readFileSync(
  process.env.AMAANA_APP_WORKSPACE
    ? join(process.env.AMAANA_APP_WORKSPACE, "src/app/experience-finish.css")
    : new URL("../src/app/experience-finish.css", import.meta.url),
  "utf8",
);
for (const width of [320, 390]) {
  test(`programme-card heading wraps with readable leading at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.setContent(
      '<article class="v3-work-card" style="display:block;width:240px;padding:12px">' +
        '<h3 style="margin:0;font-size:32px">Reviewed educational support and community assistance programmes</h3>' +
      '</article>',
    );
    await page.addStyleTag({ content: css });
    const metric = await page.locator(".v3-work-card h3").evaluate(node => {
      const computed = getComputedStyle(node);
      const lineHeight = parseFloat(computed.lineHeight);
      const bounds = node.getBoundingClientRect();
      return {
        leading: lineHeight / parseFloat(computed.fontSize),
        lines: bounds.height / lineHeight,
        left: bounds.left,
        right: bounds.right,
      };
    });
    expect(metric.leading).toBeGreaterThanOrEqual(1.12);
    expect(metric.leading).toBeLessThanOrEqual(1.24);
    expect(metric.lines).toBeGreaterThanOrEqual(1.45);
    expect(metric.left).toBeGreaterThanOrEqual(-1);
    expect(metric.right).toBeLessThanOrEqual(width + 1);
  });
}
