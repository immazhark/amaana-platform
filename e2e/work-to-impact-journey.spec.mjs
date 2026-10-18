import { test, expect } from "@playwright/test";

test("Our Work programme evidence links open the matching published Impact results", async ({ page }) => {
  await page.goto("/our-work");
  const programmes = page.locator("[data-work-category]");
  await expect(programmes.first()).toBeVisible();
  const count = await programmes.count();
  expect(count).toBeGreaterThan(0);

  for (let index = 0; index < count; index++) {
    const programme = programmes.nth(index);
    const slug = await programme.getAttribute("data-work-category");
    expect(slug).toMatch(/^[a-z0-9-]+$/);
    await programme.locator("summary").click();
    const evidenceLink = programme.getByRole("link", { name: /^View documented impact for / });
    await expect(evidenceLink).toHaveCount(1);
    await expect(evidenceLink).toHaveAttribute("href", `/impact?programme=${slug}#evidence`);
    await programme.locator("summary").click();
  }

  const selected = programmes.first();
  const slug = await selected.getAttribute("data-work-category");
  await selected.locator("summary").click();
  await selected.getByRole("link", { name: /^View documented impact for / }).click();
  await expect(page).toHaveURL(new RegExp(`/impact\\?programme=${slug}`));
  const filter = page.getByRole("form", { name: "Filter documented impact by programme" });
  await expect(filter.getByRole("combobox", { name: "Programme" })).toHaveValue(slug);
  await expect(page.locator("#evidence")).toContainText(/published (initiative|initiatives)/);
});

test("Our Work to Impact navigation uses approved slugs, not visitor-entered query data", async ({ page }) => {
  await page.goto("/our-work?programme=ramadan-eid&year=2026&private=PRIVATE_CONTACT");
  const links = page.locator("[data-work-category] a[href^='/impact?programme=']");
  await expect(links).toHaveCount(0);
  await expect(page.locator("#work-results")).not.toContainText("PRIVATE_CONTACT");
});
