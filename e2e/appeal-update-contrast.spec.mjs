import { expect, test } from "@playwright/test";

function rgba(value) {
  const match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)$/.exec(value);
  if (!match) throw new Error(`Unexpected browser color: ${value}`);
  return { rgb: match.slice(1, 4).map(Number), alpha: match[4] === undefined ? 1 : Number(match[4]) };
}

function contrastOver(color, background) {
  const { rgb, alpha } = rgba(color);
  const foreground = rgb.map((channel, index) => channel * alpha + background[index] * (1 - alpha));
  const luminance = (value) => value.reduce((sum, channel, index) => {
    const normalized = channel / 255;
    const linear = normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

test("published Appeals update typography retains AA contrast on its dark gradient", async ({ page }) => {
  const response = await page.goto("/appeals", { waitUntil: "domcontentloaded" });
  expect(response?.ok()).toBe(true);

  // CSS-only fixture: no live aid case, person, donor, or unpublished update is read.
  await page.evaluate(() => {
    const section = document.createElement("section");
    section.className = "v2-section dark v2-appeal-updates";
    section.id = "synthetic-appeal-update-contrast";
    const line = document.createElement("div");
    line.className = "v2-appeal-update-line";
    const article = document.createElement("article");
    const date = document.createElement("small");
    date.textContent = "Synthetic publication date";
    const body = document.createElement("p");
    body.textContent = "Synthetic verified update for CSS audit only.";
    article.append(date, body);
    line.append(article);
    section.append(line);
    // Mount outside React-managed <main> so late hydration cannot remove the synthetic fixture.
    document.body.append(section);
  });

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const surface = page.locator("#synthetic-appeal-update-contrast");
    const computed = await surface.evaluate((section) => ({
      backgroundImage: getComputedStyle(section).backgroundImage,
      backgroundColor: getComputedStyle(section).backgroundColor,
      date: getComputedStyle(section.querySelector("small")).color,
      body: getComputedStyle(section.querySelector("article > p")).color,
    }));
    expect(computed.backgroundImage, `${width}px approved dark gradient`).toContain("linear-gradient");
    const fallback = rgba(computed.backgroundColor);
    expect(fallback.rgb, "approved dark fallback").toEqual([29, 49, 80]);
    expect(fallback.alpha).toBe(1);
    for (const [label, ink] of [["date", computed.date], ["body", computed.body]]) {
      // Overlay the translucent gradient on both the declared navy fallback
      // and a worst-case white underlay. No visual pixel samples are claimed.
      for (const { rgb, alpha } of [
        { rgb: [10, 26, 46], alpha: 0.94 },
        { rgb: [29, 49, 80], alpha: 0.92 },
        { rgb: [47, 76, 122], alpha: 0.90 },
      ]) {
        for (const underlay of [fallback.rgb, [255, 255, 255]]) {
          const background = rgb.map((channel, index) => channel * alpha + underlay[index] * (1 - alpha));
          expect(contrastOver(ink, background), `${label} ${width}px over ${rgb.join(",")} and ${underlay.join(",")}`)
            .toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  }
});
