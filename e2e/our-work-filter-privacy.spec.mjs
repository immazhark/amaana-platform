import { expect, test } from "@playwright/test";

test("unknown Our Work URL values are rejected without echoing private input", async ({ page }) => {
  await page.goto("/our-work?programme=PRIVATE_PHONE&year=2026&email=PRIVATE_PERSON#work-results");
  const section = page.locator("#work-results");
  await expect(section.getByRole("status")).toContainText("These filters could not be read");
  await expect(section.getByRole("link", { name: "Clear filters" })).toBeVisible();
  await expect(section.locator("select[name=programme]")).toHaveValue("");
  await expect(section.locator("select[name=year]")).toHaveValue("");
  await expect(section).not.toContainText("PRIVATE_PHONE");
  await expect(section).not.toContainText("PRIVATE_PERSON");
  const html = await section.innerHTML();
  expect(html).not.toContain("PRIVATE_PHONE");
  expect(html).not.toContain("PRIVATE_PERSON");
});

test("valid Our Work selections remain bookmarkable and resettable", async ({ page }) => {
  await page.goto("/our-work?programme=ramadan-eid&year=2026#work-results");
  const section = page.locator("#work-results");
  await expect(section.locator("select[name=programme]")).toHaveValue("ramadan-eid");
  await expect(section.locator("select[name=year]")).toHaveValue("2026");
  await expect(section.getByRole("status")).not.toContainText("These filters could not be read");
  await section.getByRole("link", { name: "Clear filters" }).click();
  await expect(page).not.toHaveURL(/programme=|year=/);
  await expect(section.locator("select[name=programme]")).toHaveValue("");
});
