import { expect, test } from "@playwright/test";

test("Contact offers a private and optional feedback route", async ({ page }) => {
  await page.goto("/contact");
  const link = page.getByRole("link", { name: /Share private feedback/i });
  await expect(link).toHaveAttribute("href", "/contact/feedback");
  await link.click();
  await expect(page.getByRole("heading", { name: "Your concerns deserve a respectful hearing." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose your conversation" })).toBeVisible();
  await expect(page.getByText(/Assistance is never conditional on positive feedback/)).toBeVisible();
  expect(await page.locator("form,textarea,input").count()).toBe(0);
});

test("the visitor can prepare private complaint, suggestion or appreciation without a website submission", async ({ page }) => {
  await page.goto("/contact/feedback");
  for (const label of ["Concern or complaint", "Suggestion or improvement", "Private appreciation"]) {
    const link = page.getByRole("link", { name: label });
    const href = await link.getAttribute("href");
    expect(href?.startsWith("mailto:amaanafoundation24@gmail.com?")).toBe(true);
    const email = new URL(href);
    expect(email.searchParams.get("subject")).toContain(label);
    expect(email.searchParams.get("body")).toContain("not consent to publish");
    expect(email.searchParams.get("body")).toContain("does not create a tracked complaint ticket");
  }
  await expect(page.getByRole("link", { name: "Request assistance privately" })).toHaveAttribute("href", "/request-assistance");
});

test("feedback contact links fit 320px and have native keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/contact/feedback");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const first = page.getByRole("link", { name: "Concern or complaint" });
  await first.focus();
  await expect(first).toBeFocused();
});
