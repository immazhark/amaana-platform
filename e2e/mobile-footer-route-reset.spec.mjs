import { expect, test } from "@playwright/test";

test("mobile footer accordion resets after client navigation without hiding its links permanently", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204, body: "" }));
  const initial = await page.goto("/about", { waitUntil: "domcontentloaded" });
  expect(initial?.ok()).toBe(true);

  const footer = page.locator(".site-footer");
  const group = footer.locator(".footer-nav-group").nth(1);
  const toggle = group.locator(".footer-nav-toggle");
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");

  await toggle.click();
  await expect(group).toHaveAttribute("data-open", "true");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await group.getByRole("link", { name: "Get Involved", exact: true }).click();
  await expect(page).toHaveURL(/\/get-involved$/);
  await expect(page.locator("main")).toBeVisible();

  // Shared layout persists across App Router navigations; old accordion state
  // must not be carried into a new public page.
  await expect(group).toHaveAttribute("data-open", "false");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(group.getByRole("link", { name: "Get Involved", exact: true })).toBeVisible();
});
