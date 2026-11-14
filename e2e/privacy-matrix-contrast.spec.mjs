import { expect, test } from "@playwright/test";

// AF-R019: small policy category labels need WCAG AA contrast against the
// actual translucent card on Amaana's cream canvas, not against plain white.
for (const width of [390, 1440]) {
  test(`privacy category labels meet 4.5:1 contrast at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto("/privacy");
    expect(response?.ok()).toBe(true);

    const label = page.locator('section[aria-labelledby="privacy-data-classes"] article span').first();
    await expect(label).toBeVisible();
    const measurement = await label.evaluate(node => {
      const rgb = (value) => {
        const values = value.match(/[\\d.]+/g)?.map(Number);
        if (!values || values.length < 3) throw new Error("Invalid computed CSS color");
        return [values[0], values[1], values[2], values[3] ?? 1];
      };
      const ink = rgb(getComputedStyle(node).color);
      const card = rgb(getComputedStyle(node.closest("article")).backgroundColor);
      const canvas = rgb(getComputedStyle(document.body).backgroundColor);
      const background = card.slice(0, 3).map((channel, index) =>
        channel * card[3] + canvas[index] * (1 - card[3]));
      const luminance = channels => {
        const linear = channels.map(value => {
          const channel = value / 255;
          return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
        });
        return linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
      };
      const a = luminance(ink.slice(0, 3));
      const b = luminance(background);
      return {
        contrast: (Math.max(a, b) + .05) / (Math.min(a, b) + .05),
        fontSize: Number.parseFloat(getComputedStyle(node).fontSize),
      };
    });

    expect(measurement.fontSize).toBeLessThan(18.67);
    expect(measurement.contrast).toBeGreaterThanOrEqual(4.5);
  });
}
