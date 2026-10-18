import { test, expect } from "@playwright/test";

test("impact visitors can narrow public evidence by published programme and clear their selection", async ({ page }) => {
  await page.goto("/impact#evidence");
  const filter = page.getByRole("form", { name: "Filter documented impact by programme" });
  const category = filter.getByRole("combobox", { name: "Programme" });
  await expect(category).toBeVisible();
  await expect(category.locator("option").first()).toHaveText("All programmes");
  const options = category.locator('option[value]:not([value=""])');
  if (await options.count()) {
    const first = await options.first().getAttribute("value");
    await category.selectOption(first);
    await filter.getByRole("button", { name: "Explore impact" }).click();
    await expect(page).toHaveURL(new RegExp("programme="));
    await expect(page.locator("#evidence")).toContainText(/published (initiative|initiatives)/);
    await page.getByRole("link", { name: "Clear impact filter" }).click();
    await expect(page).not.toHaveURL(/programme=/);
  } else {
    await expect(page.locator("#evidence")).toContainText("No initiative outcomes are published here yet.");
  }
});

test("unknown or repeated impact programme parameters fail closed without reflected private content", async ({ page }) => {
  await page.goto("/impact?programme=ramadan-eid&programme=amaana-taleem&private=PERSONAL_IDENTIFIER#evidence");
  await expect(page.locator("#evidence")).toContainText("These filters could not be read");
  await expect(page.locator("#evidence")).not.toContainText("PERSONAL_IDENTIFIER");
  await expect(page.locator(".v2-impact-tile")).toHaveCount(0);
});
