import { expect, test } from "@playwright/test";

function rgba(color) {
  const match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)$/.exec(color);
  if (!match) throw new Error(`Unexpected computed color: ${color}`);
  return { rgb: match.slice(1, 4).map(Number), alpha: match[4] === undefined ? 1 : Number(match[4]) };
}

function composite(foreground, background) {
  const { rgb, alpha } = rgba(foreground);
  return rgb.map((channel, index) => channel * alpha + background[index] * (1 - alpha));
}

function contrast(foreground, background) {
  const luminance = rgb => rgb.reduce((sum, channel, index) => {
    const value = channel / 255;
    const linear = value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

test("real Compliance hold paragraph maintains readable ink at mobile and desktop widths", async ({ page }) => {
  const response = await page.goto("/compliance", { waitUntil: "domcontentloaded" });
  expect(response?.ok()).toBe(true);

  // Evaluate actual public markup and CSS only. Tax-status copy is not revised or approved here.
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const panel = page.locator(".v2-compliance-hold");
    const paragraph = panel.locator("p");
    await expect(paragraph).toBeVisible();
    const colors = await paragraph.evaluate((element) => ({
      ink: getComputedStyle(element).color,
      panel: getComputedStyle(element.parentElement).backgroundColor,
      sectionImage: getComputedStyle(element.closest(".v2-compliance-pending")).backgroundImage,
    }));
    expect(colors.sectionImage, `${width}px approved lattice`).toContain("amaana-lattice-tile.svg");
    expect(colors.sectionImage, `${width}px opaque dark evidence gradient`).toContain("linear-gradient(132deg");
    for (const stop of [/rgb\(18,\s*34,\s*57\)/, /rgb\(29,\s*49,\s*80\)/, /rgb\(47,\s*76,\s*122\)/]) {
      expect(colors.sectionImage, `${width}px approved gradient stop`).toMatch(stop);
    }
    for (const base of [[18, 34, 57], [29, 49, 80], [47, 76, 122]]) {
      for (const underlay of [base, base.map((channel, index) =>
        channel * .9 + [185, 155, 101][index] * .1)]) {
        const surface = composite(colors.panel, underlay);
        const ink = composite(colors.ink, surface);
        expect(contrast(ink, surface), `${width}px Compliance hold on ${base.join(",")} and lattice`)
          .toBeGreaterThanOrEqual(4.5);
      }
    }
  }
});
