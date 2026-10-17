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

    const heading = card.getByRole("heading", { name: "Synthetic home appeal" });
    const lineHeightRatio = await heading.evaluate(el => {
      const style = getComputedStyle(el);
      return Number.parseFloat(style.lineHeight) / Number.parseFloat(style.fontSize);
    });
    expect(lineHeightRatio).toBeGreaterThanOrEqual(1.1);

    // Use the dimmest approved ivory card stop as a conservative AA baseline.
    const mutedContrast = await card.locator(
      ".v2-appeal-card-head small, .v2-appeal-progress-meta span, .v2-appeal-progress-foot",
    ).evaluateAll(elements => {
      const luminance = channels => {
        const [r, g, b] = channels.map(value => {
          const unit = value / 255;
          return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const background = luminance([243, 237, 221]);
      return elements.map(element => {
        const channels = getComputedStyle(element).color.match(/[0-9.]+/g)?.slice(0, 3).map(Number);
        if (!channels || channels.length !== 3) return 0;
        const foreground = luminance(channels);
        return (Math.max(background, foreground) + 0.05) / (Math.min(background, foreground) + 0.05);
      });
    });
    expect(mutedContrast).toHaveLength(3);
    for (const ratio of mutedContrast) expect(ratio).toBeGreaterThanOrEqual(4.5);

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
