import { expect, test } from "@playwright/test";

for (const width of [390, 1280]) {
  test(`global Donate CTA reaches the reviewed giving route at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204 }));
    expect((await page.goto("/about", { waitUntil: "load" }))?.ok()).toBe(true);
    const mobile = width <= 1020;
    if (mobile) {
      await page.getByRole("button", { name: "Open navigation menu" }).click();
    }
    const nav = page.getByRole("navigation", { name: mobile ? "Mobile navigation" : "Primary navigation" });
    const donate = nav.getByRole("link", { name: "Donate", exact: true });
    await expect(donate).toBeVisible();
    await expect(donate).toHaveAttribute("href", "/donate");
    await donate.click();
    await expect(page).toHaveURL(url => url.pathname === "/donate");
    await expect(page.getByRole("heading", { name: "Domestic donations only" })).toBeVisible();
    if (mobile) {
      await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeHidden();
      await expect(page.locator("body")).not.toHaveClass(/af-menu-lock/);
    } else {
      await expect(nav.getByRole("link", { name: "Donate", exact: true })).toHaveAttribute("aria-current", "page");
    }
  });
}

for (const width of [320, 390, 768, 1020]) {
  test(`Donate stays reachable without opening the mobile menu at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect((await page.goto("/about", { waitUntil: "load" }))?.ok()).toBe(true);
    const header = page.getByRole("navigation", { name: "Primary navigation" });
    const donate = header.getByRole("link", { name: "Donate", exact: true });
    const menu = page.getByRole("navigation", { name: "Mobile navigation" });
    await expect(menu).toBeHidden();
    await expect(donate).toBeVisible();
    await expect(donate).toHaveAttribute("href", "/donate");
    const box = await donate.boundingBox();
    expect(box).not.toBeNull();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await donate.click();
    await expect(page).toHaveURL(url => url.pathname === "/donate");
    await expect(page.getByRole("heading", { name: "Domestic donations only" })).toBeVisible();
  });
}
