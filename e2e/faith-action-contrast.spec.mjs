import { expect, test } from "@playwright/test";

function rgba(value) {
  const match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)$/.exec(value);
  if (!match) throw new Error(`Unexpected computed CSS color: ${value}`);
  return { rgb: match.slice(1, 4).map(Number), alpha: match[4] === undefined ? 1 : Number(match[4]) };
}

function contrast(ink, surface) {
  const luminance = rgb => rgb.reduce((sum, channel, index) => {
    const value = channel / 255;
    const linear = value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
    return sum + linear * [.2126, .7152, .0722][index];
  }, 0);
  const a = luminance(ink);
  const b = luminance(surface);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}

const overlay = (foreground, background, alpha) =>
  foreground.map((channel, index) => channel * alpha + background[index] * (1 - alpha));

test("real Faith closing CTA paragraph keeps readable ink at mobile and desktop widths", async ({ page }) => {
  await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204, body: "" }));
  const response = await page.goto("/faith-and-reflections", { waitUntil: "domcontentloaded" });
  expect(response?.ok()).toBe(true);

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const section = page.locator("section.v2-faith-action");
    const paragraph = section.locator(".v2-faith-action-grid > div:last-child > p");
    await expect(paragraph).toBeVisible();

    const computed = await paragraph.evaluate(element => ({
      ink: getComputedStyle(element).color,
      image: getComputedStyle(element.closest("section")).backgroundImage,
      blend: getComputedStyle(element.closest("section")).backgroundBlendMode,
    }));
    expect(computed.image, `${width}px approved lattice`).toContain("amaana-lattice-tile.svg");
    expect(computed.image, `${width}px opaque navy gradient`).toContain("linear-gradient(132deg");
    for (const stop of [/rgb\(18,\s*34,\s*57\)/, /rgb\(29,\s*49,\s*80\)/, /rgb\(47,\s*76,\s*122\)/]) {
      expect(computed.image).toMatch(stop);
    }
    expect(computed.blend).toBe("normal, soft-light");

    const text = rgba(computed.ink);
    for (const background of [[18, 34, 57], [29, 49, 80], [47, 76, 122]]) {
      for (const latticeOpacity of [0, .1]) {
        const surface = overlay([185, 155, 101], background, latticeOpacity);
        const ink = overlay(text.rgb, surface, text.alpha);
        expect(contrast(ink, surface), `${width}px Faith closing CTA on ${background.join(",")} with lattice ${latticeOpacity}`)
          .toBeGreaterThanOrEqual(4.5);
      }
    }
  }
});
