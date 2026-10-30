import { expect, test } from "@playwright/test";

function rgba(value) {
  const match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)$/.exec(value);
  if (!match) throw new Error(`Unexpected browser color: ${value}`);
  return { rgb: match.slice(1, 4).map(Number), alpha: match[4] === undefined ? 1 : Number(match[4]) };
}

function composite(foreground, backdrop) {
  const parsed = rgba(foreground);
  if (parsed.alpha === 1) return parsed.rgb;
  return parsed.rgb.map((channel, index) => channel * parsed.alpha + backdrop[index] * (1 - parsed.alpha));
}

function contrast(first, second) {
  const luminance = (rgb) => rgb.reduce((total, channel, index) => {
    const value = channel / 255;
    const linear = value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    return total + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

test("Media source labels retain contrast on paper and dark editorial cards", async ({ page }) => {
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.ok()).toBe(true);

  // Test-only source cards avoid loading unpublished or private media records.
  await page.evaluate(() => {
    for (const [id, editorial] of [["paper", false], ["editorial", true]]) {
      const grid = document.createElement("div");
      grid.className = editorial ? "v2-media-grid v2-media-grid-editorial" : "v2-media-grid";
      grid.id = `synthetic-media-${id}`;
      if (editorial) grid.style.backgroundColor = "#1d3150";
      const card = document.createElement("article");
      card.className = "v2-media-link";
      const label = document.createElement("small");
      label.textContent = "Synthetic document label";
      card.append(label);
      grid.append(card);
      document.body.append(grid);
    }
  });

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const id of ["paper", "editorial"]) {
      const colors = await page.locator(`#synthetic-media-${id}`).evaluate((grid) => {
        const card = grid.querySelector(".v2-media-link");
        const label = card.querySelector("small");
        return { ink: getComputedStyle(label).color, card: getComputedStyle(card).backgroundColor };
      });
      const backdrop = id === "editorial" ? [29, 49, 80] : [255, 253, 248];
      const surface = composite(colors.card, backdrop);
      expect(contrast(rgba(colors.ink).rgb, surface), `${id} media label at ${width}px`)
        .toBeGreaterThanOrEqual(4.5);
    }
  }
});
