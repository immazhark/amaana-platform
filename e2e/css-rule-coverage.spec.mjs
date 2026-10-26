import { expect, test } from "@playwright/test";
import { summarizeCssRuleUsage } from "./css-rule-coverage-core.mjs";

const publicRoutes = ["/", "/our-work", "/impact", "/donate", "/request-assistance"];
const viewports = [{ name: "mobile", width: 390, height: 844 }, { name: "desktop", width: 1440, height: 900 }];

test("capture sampled Chromium CSS rule usage across five public routes and two viewports", async ({ page }) => {
  test.setTimeout(120_000);
  const samples = [];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const route of publicRoutes) {
      await page.coverage.startCSSCoverage({ resetOnNavigation: false });
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.ok(), route).toBeTruthy();
      await expect(page.locator("main#main")).toBeVisible();
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const entries = await page.coverage.stopCSSCoverage();
      const summary = summarizeCssRuleUsage(entries, new URL(page.url()).origin);
      expect(summary.stylesheets.length, `${route} ${viewport.name} build CSS measurement`).toBeGreaterThan(0);
      expect(summary.measuredTotalDecodedBytes, `${route} ${viewport.name} decoded CSS must be measurable`).toBeGreaterThan(0);
      samples.push({ route, viewport: viewport.name, width: viewport.width, ...summary });
    }
  }

  await test.info().attach("sampled-route-css-rule-usage.json", {
    body: Buffer.from(JSON.stringify({
      source: "isolated-browser-build",
      measurement: "sampled Chromium used CSS byte ranges, not full CSS waste or field CWV",
      samples,
    }, null, 2)),
    contentType: "application/json",
  });
  expect(samples).toHaveLength(publicRoutes.length * viewports.length);
});
