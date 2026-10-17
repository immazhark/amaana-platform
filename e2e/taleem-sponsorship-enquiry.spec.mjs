import { expect, test } from "@playwright/test";

test("Taleem sponsor can select a reviewed path and prepare, but not send, an email", async ({ page }) => {
  await page.goto("/get-involved/sponsor-education");
  await page.getByRole("link", { name: /Ask about this sponsorship/i }).first().click();
  await expect(page).toHaveURL(/path=hifdh&support=discuss/);
  await expect(page.getByRole("heading", { name: "Review before opening your email" })).toBeVisible();
  const link = page.getByRole("link", { name: "Open email with these preferences" });
  const url = new URL(await link.getAttribute("href"));
  expect(url.protocol).toBe("mailto:");
  expect(url.pathname).toBe("amaanafoundation24@gmail.com");
  expect(url.searchParams.get("body")).toContain("Hifdh education");
  expect(url.searchParams.get("body")).toContain("does not reserve a student placement");
  expect(await page.locator('input[type="email"],input[type="file"]').count()).toBe(0);
});

test("bounded education preferences do not reflect private or duplicate query fields", async ({ page }) => {
  await page.goto("/get-involved/sponsor-education?path=school&path=hifdh&support=once&student=PRIVATE_STUDENT");
  await expect(page.locator('main p[role="alert"]')).toHaveText(/These preferences could not be read/);
  await expect(page.getByRole("link", { name: "Open email with these preferences" })).toHaveCount(0);
  await expect(page.getByText("PRIVATE_STUDENT")).toHaveCount(0);
});

test("visitor can request anonymity without authorizing a charge or identification", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/get-involved/sponsor-education");
  await page.getByLabel("Education pathway").selectOption("school");
  await page.getByLabel("Support preference").selectOption("ongoing");
  await page.getByRole("checkbox", { name: /Ask to keep my name out of public recognition/i }).check();
  await page.getByRole("button", { name: "Review enquiry" }).click();
  const href = await page.getByRole("link", { name: "Open email with these preferences" }).getAttribute("href");
  const body = new URL(href).searchParams.get("body") ?? "";
  expect(body).toContain("School education (developing pathway)");
  expect(body).toContain("each contribution decided separately");
  expect(body).toContain("Please keep my name out of public recognition");
  expect(body).toContain("does not reserve a student placement or authorize a payment");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
