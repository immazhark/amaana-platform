import { expect, test } from "@playwright/test";

// Up to 900px the level-1 hero had padding-top:0, so its eyebrow started at the hero's top edge, directly
// under the reminder strip (8px of air on a phone; about 47px on a desktop). Checked on pages that need no
// database so the spec is stable.
for (const path of ["/contact", "/about", "/transparency"]) {
  for (const width of [360, 390, 768, 1440]) {
    test(`${path} hero eyebrow clears the strip above it at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      expect((await page.goto(path, { waitUntil: "load" }))?.ok()).toBe(true);
      const gap = await page.evaluate(() => {
        const hero = document.querySelector(".page-hero");
        const eyebrow = document.querySelector(".page-hero__eyebrow");
        return eyebrow.getBoundingClientRect().top - hero.getBoundingClientRect().top;
      });
      expect(gap).toBeGreaterThanOrEqual(16);
    });
  }
}
