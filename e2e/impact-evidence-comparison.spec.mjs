import { test, expect } from "@playwright/test";

test("visitor compares two distinct published outcomes without making an aggregated-impact claim", async ({ page }) => {
  await page.goto("/impact");
  await page.getByRole("link", { name: "Compare two initiatives" }).click();
  await expect(page).toHaveURL(/\/impact\/compare/);
  const form = page.getByRole("form", { name: "Compare two published initiatives" });
  const first = form.getByRole("combobox", { name: "First initiative" });
  const second = form.getByRole("combobox", { name: "Second initiative" });
  const options = await first.locator("option[value]:not([value=''])").evaluateAll(nodes => nodes.map(n => n.value));
  if (options.length < 2) {
    await expect(page.getByText("Select two published initiatives")).toBeVisible();
    return;
  }
  await first.selectOption(options[0]);
  await second.selectOption(options[1]);
  await form.getByRole("button", { name: "Compare published outcomes" }).click();
  const comparison = page.getByRole("region", { name: "Side-by-side published outcomes" });
  await expect(comparison.locator("article")).toHaveCount(2);
  await expect(comparison.getByRole("link", { name: "Read the full initiative" })).toHaveCount(2);
  await expect(comparison).toContainText("not a ranking or a combined total");
  await page.getByRole("link", { name: "Clear comparison" }).click();
  await expect(page).not.toHaveURL(/[?&](left|right)=/);
});

test("unknown or repeated compare inputs are rejected without leaking personal query strings", async ({ page }) => {
  await page.goto("/impact/compare?left=eid-gift-kits&left=eid-gift-kits&right=amaana-taleem&private=PRIVATE_PERSON");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("could not be read");
  await expect(page.getByRole("region", { name: "Side-by-side published outcomes" })).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText("PRIVATE_PERSON");
});
