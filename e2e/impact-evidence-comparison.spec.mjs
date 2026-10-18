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

for (const width of [320, 720, 1440]) {
  test(`comparison controls remain readable and contained at ${width}px with enlarged text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/impact/compare");
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    const form = page.getByRole("form", { name: "Compare two published initiatives" });
    for (const name of ["First initiative", "Second initiative"]) {
      const control = form.getByRole("combobox", { name });
      const bounds = await control.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      const fontSize = await control.evaluate(node => parseFloat(getComputedStyle(node).fontSize));
      expect(fontSize).toBeGreaterThanOrEqual(32);
    }
    await expect(form.getByRole("button", { name: "Compare published outcomes" })).toBeVisible();
    await page.getByRole("combobox", { name: "First initiative" }).focus();
    await expect(page.getByRole("combobox", { name: "First initiative" })).toBeFocused();
  });
}
