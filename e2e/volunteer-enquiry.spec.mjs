test("Contact routes volunteer enquiries directly to the private interest page", async ({ page }) => {
  await page.goto("/contact");
  const link = page.getByRole("link", { name: "Explore volunteering" });
  await expect(link).toHaveAttribute("href", "/get-involved/volunteer");
  await link.click();
  await expect(page.getByRole("heading", { name: "Choose an area of volunteering" })).toBeVisible();
});

import { expect, test } from "@playwright/test";

test("Get Involved opens an enquiry-only volunteer route with no client-side application form", async ({ page }) => {
  await page.goto("/get-involved");
  const start = page.getByRole("link", { name: /Explore volunteering/i });
  await expect(start).toHaveAttribute("href", "/get-involved/volunteer");
  await start.click();
  await expect(page.getByRole("heading", { name: "Your time and skills can matter." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose an area of volunteering" })).toBeVisible();
  await expect(page.getByText(/Nothing is sent to Amaana until you review and send the email/)).toBeVisible();
  expect(await page.locator('form[action^="/api/"]').count()).toBe(0);
  expect(await page.locator('input,select,textarea').count()).toBe(0);
});

test("visitors can prepare an editable, topic-specific email without uploading or storing anything", async ({ page }) => {
  await page.goto("/get-involved/volunteer");
  const action = page.getByRole("link", { name: "Technology and website support" });
  const href = await action.getAttribute("href");
  expect(href?.startsWith("mailto:amaanafoundation24@gmail.com?")).toBe(true);
  const url = new URL(href);
  const message = url.searchParams.get("body") || "";
  expect(message).toContain("Technology and website support");
  expect(message).toContain("Availability:");
  expect(message).toContain("not a confirmed placement");
  await expect(page.getByRole("link", { name: /general volunteer enquiry/i })).toHaveAttribute("href", /^mailto:/);
  await expect(page.getByText(/Please do not include ID documents/)).toBeVisible();
});

test("native volunteer enquiry links remain within mobile viewport and keyboard accessible", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/get-involved/volunteer");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const first = page.getByRole("link", { name: "Distribution and packing" });
  await first.focus();
  await expect(first).toBeFocused();
});
