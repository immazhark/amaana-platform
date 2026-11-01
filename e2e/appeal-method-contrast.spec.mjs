import { expect, test } from "@playwright/test";

function rgba(value) {
  const match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)$/.exec(value);
  if (!match) throw new Error(`Unexpected computed CSS color: ${value}`);
  return { rgb: match.slice(1, 4).map(Number), alpha: match[4] === undefined ? 1 : Number(match[4]) };
}

const overlay = (foreground, background, alpha) =>
  foreground.map((channel, index) => channel * alpha + background[index] * (1 - alpha));

function contrast(ink, surface) {
  const luminance = rgb => rgb.reduce((sum, channel, index) => {
    const normalized = channel / 255;
    const linear = normalized <= .04045 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
    return sum + linear * [.2126, .7152, .0722][index];
  }, 0);
  const [light, dark] = [luminance(ink), luminance(surface)].sort((a, b) => b - a);
  return (light + .05) / (dark + .05);
}

test("all three real Appeals review cards meet AA contrast on mobile and desktop", async ({ page }) => {
  await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204, body: "" }));
  const response = await page.goto("/appeals", { waitUntil: "domcontentloaded" });
  expect(response?.ok()).toBe(true);

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const section = page.locator("section.v2-appeal-method");
    const paragraphs = section.locator(".v2-appeal-method-grid article p");
    await expect(paragraphs).toHaveCount(3);
    const computed = await section.evaluate(element => ({
      gradient: getComputedStyle(element).backgroundImage,
      blend: getComputedStyle(element).backgroundBlendMode,
    }));
    expect(computed.gradient, `${width}px lattice image`).toContain("amaana-lattice-tile.svg");
    expect(computed.gradient, `${width}px gradient`).toContain("linear-gradient(140deg");
    for (const stop of [/rgb\(13,\s*27,\s*46\)/, /rgb\(29,\s*49,\s*80\)/, /rgb\(47,\s*76,\s*122\)/]) {
      expect(computed.gradient).toMatch(stop);
    }
    expect(computed.blend).toMatch(/^normal(?:, normal)?$/);

    for (let index = 0; index < 3; index++) {
      const paragraph = paragraphs.nth(index);
      await expect(paragraph).toBeVisible();
      const veil = await section.locator(".v2-appeal-method-grid article").nth(index)
        .evaluate(element => getComputedStyle(element, "::after").content);
      expect(veil, `${width}px card ${index + 1} must not paint a white veil across text`).toBe("none");
      const ink = rgba(await paragraph.evaluate(element => getComputedStyle(element).color));
      // Guard the brightest real section gradient stop, both uncovered and
      // behind the approved 10% gold lattice, including a 3% white card hover.
      for (const base of [[13, 27, 46], [29, 49, 80], [47, 76, 122]]) {
        for (const patternOpacity of [0, .1]) {
          for (const hoverOpacity of [0, .03]) {
            const surface = overlay([255, 255, 255], overlay([185, 155, 101], base, patternOpacity), hoverOpacity);
            const effectiveInk = overlay(ink.rgb, surface, ink.alpha);
            expect(contrast(effectiveInk, surface), `${width}px card ${index + 1}, ${base}, lattice ${patternOpacity}, hover ${hoverOpacity}`)
              .toBeGreaterThanOrEqual(4.5);
          }
        }
      }
    }
  }
});
