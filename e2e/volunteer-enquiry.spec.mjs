import { expect, test } from "@playwright/test";

test("Get Involved opens the private volunteer enquiry without collecting applicant data", async ({ page }) => {
  await page.goto("/get-involved");
  const start = page.getByRole("link", { name: /Explore volunteering/i });
  await expect(start).toHaveAttribute("href", "/get-involved/volunteer");
  await start.click();
  await expect(page.getByRole("heading", { name: "Your time and skills can matter." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Prepare a volunteer enquiry" })).toBeVisible();
  await expect(page.getByText(/Nothing is sent to Amaana until you review and send the email/)).toBeVisible();
  expect(await page.locator('form[action^="/api/"]').count()).toBe(0);
  await expect(page.locator('a[href^="mailto:amaanafoundation24@gmail.com?"]')).toHaveCount(1);
});

test("skill and availability choices only modify the visitor-owned email draft", async ({ page }) => {
  await page.goto("/get-involved/volunteer");
  await page.getByRole("checkbox", { name: "Technology and website support" }).check();
  await page.getByRole("checkbox", { name: "Distribution and packing" }).check();
  await page.getByLabel(/General availability/).selectOption("Weekends");

  const action = page.getByRole("link", { name: /Prepare email to Amaana/ });
  const href = await action.getAttribute("href");
  expect(href).toMatch(/^mailto:amaanafoundation24@gmail\.com\?/);
  const url = new URL(href);
  const message = url.searchParams.get("body") || "";
  expect(message).toContain("Technology and website support");
  expect(message).toContain("Distribution and packing");
  expect(message).toContain("Weekends");
  expect(message).toContain("not a confirmed placement");
  await expect(page.getByText(/Please do not include ID documents/)).toBeVisible();

  await page.getByRole("checkbox", { name: "Technology and website support" }).uncheck();
  const updated = new URL(await action.getAttribute("href"));
  expect(updated.searchParams.get("body")).not.toContain("Technology and website support");
});

test("volunteer enquiry has mobile-safe layout and keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/get-involved/volunteer");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const first = page.getByRole("checkbox", { name: "Distribution and packing" });
  await first.focus();
  await expect(first).toBeFocused();
});
