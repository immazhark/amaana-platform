import { expect, test } from "@playwright/test";

for (const width of [320, 390, 1440]) {
  test(`homepage live appeal card retains component styles at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204, body: "" }));

    const response = await page.goto("/browser-acceptance/home-appeals");
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: "Homepage appeal stylesheet acceptance" })).toBeVisible();

    const card = page.locator(".v3-appeals .v2-appeal-card");
    await expect(card).toHaveCount(1);
    await expect(card).toHaveCSS("display", "flex");
    await expect(card).toHaveCSS("flex-direction", "column");
    await expect(card).toHaveCSS("overflow", "hidden");
    await expect(card.locator(".v2-appeal-card-body")).toHaveCSS("display", "flex");

    const bar = card.getByRole("progressbar");
    await expect(bar).toHaveAttribute("aria-valuenow", "20");
    const dimensions = await bar.evaluate(el => ({
      total: el.getBoundingClientRect().width,
      fill: el.firstElementChild.getBoundingClientRect().width,
      height: el.getBoundingClientRect().height,
    }));
    expect(dimensions.total).toBeGreaterThan(0);
    expect(dimensions.height).toBeGreaterThan(0);
    expect(dimensions.fill / dimensions.total).toBeCloseTo(0.2, 2);

    const link = card.getByRole("link", { name: "Understand this need: Synthetic home appeal" });
    await link.focus();
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS("outline-style", "solid");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
