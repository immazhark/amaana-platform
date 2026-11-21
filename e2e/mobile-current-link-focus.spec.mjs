import { expect, test } from "@playwright/test";

for (const [path, label] of [["/about", "About"], ["/contact", "Contact"]]) {
  test(`current mobile ${label} link restores keyboard focus after closing the menu`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204, body: "" }));
    expect((await page.goto(path, { waitUntil: "domcontentloaded" }))?.ok()).toBe(true);
    const toggle = page.locator('button[aria-controls="mobile-navigation"]');
    const menu = page.getByRole("navigation", { name: "Mobile navigation", exact: true });
    await toggle.click();
    const current = menu.getByRole("link", { name: label, exact: true });
    await expect(current).toHaveAttribute("aria-current", "page");
    await current.focus();
    await page.keyboard.press("Enter");
    await expect(menu).toBeHidden();
    await expect(toggle).toBeFocused();
    await expect(page.locator("body")).not.toHaveClass(/af-menu-lock/);
  });
}
