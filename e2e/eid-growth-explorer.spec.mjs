import { expect, test } from "@playwright/test";

test("visitors can inspect locked Eid distribution growth without charts requiring hydration", async ({ page }) => {
  await page.goto("/");
  const explorer = page.getByRole("group", { name: "Eid Gift Kit distributions from 2020 through 2026" });
  const years = explorer.locator("details");
  await expect(years).toHaveCount(7);
  const first = years.first();
  await expect(first.locator("summary")).toContainText("2020");
  await expect(first.locator("summary")).toContainText("85");
  await first.locator("summary").click();
  await expect(first).toHaveAttribute("open", "");
  await expect(first).toContainText("The first documented year in this series.");

  const latest = years.last();
  await latest.locator("summary").click();
  await expect(latest).toHaveAttribute("open", "");
  await expect(latest).toContainText("+60 compared with 2025.");
  await expect(latest).toContainText("2,830");
  await expect(page.getByText(/not a count of distinct families across different years/i)).toBeVisible();
});

test("the Eid impact explorer stays accessible and within narrow mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  const explorer = page.getByRole("group", { name: "Eid Gift Kit distributions from 2020 through 2026" });
  await explorer.locator("summary").first().focus();
  await expect(explorer.locator("summary").first()).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(explorer.locator("details").first()).toHaveAttribute("open", "");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
});
