import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

// AF-R025: exercise the actual module rules with existing labels in a narrow
// synthetic text column, independent of live fund balances or payment actions.
const read = path => readFileSync(
  process.env.AMAANA_APP_WORKSPACE
    ? join(process.env.AMAANA_APP_WORKSPACE, "src/components", path)
    : new URL("../src/components/" + path, import.meta.url),
  "utf8",
);
const cases = [
  { path: "fund-ledger/public-fund-ledger.module.css", rule: /\.top h2\s*\{[^}]*\}/,
    markup: '<div class="top"><h2>Financial year 2026–27</h2></div>', selector: "h2" },
  { path: "fund-giving/fund-giving.module.css", rule: /\.heading\s*\{[^}]*\}/,
    markup: '<span class="heading">Choose where your gift goes</span>', selector: ".heading" },
  { path: "fund-giving/fund-giving.module.css", rule: /\.heading\s*\{[^}]*\}/,
    markup: '<span class="heading">Sponsor a Taleem programme.</span>', selector: ".heading" },
];
for (const [index, fixture] of cases.entries()) {
  test(`fund heading ${index + 1} has readable wrapped leading in a narrow column`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 850 });
    const rule = read(fixture.path).match(fixture.rule);
    expect(rule, "Expected actual CSS rule").not.toBeNull();
    await page.setContent('<main style="width:180px;font-family:Arial,sans-serif">' + fixture.markup + '</main>');
    await page.addStyleTag({ content: ".heading{display:block}" + rule[0] });
    const metric = await page.locator(fixture.selector).evaluate(node => {
      const style = getComputedStyle(node);
      const height = parseFloat(style.lineHeight);
      const rect = node.getBoundingClientRect();
      return { ratio: height / parseFloat(style.fontSize), lines: rect.height / height,
        width: rect.width, overflow: node.scrollWidth - node.clientWidth };
    });
    expect(metric.ratio).toBeGreaterThanOrEqual(1.14);
    expect(metric.ratio).toBeLessThanOrEqual(1.24);
    expect(metric.lines).toBeGreaterThanOrEqual(1.45);
    expect(metric.width).toBeLessThanOrEqual(181);
    expect(metric.overflow).toBeLessThanOrEqual(1);
  });
}
