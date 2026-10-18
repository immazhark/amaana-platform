import { expect, test } from "@playwright/test";

test("Contact offers a private and optional feedback route", async ({ page }) => {
  await page.goto("/contact");
  const link = page.getByRole("link", { name: /Share private feedback/i });
  await expect(link).toHaveAttribute("href", "/contact/feedback");
  await link.click();
  await expect(page.getByRole("heading", { name: "Your concerns deserve a respectful hearing." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose your conversation" })).toBeVisible();
  await expect(page.getByText(/Assistance is never conditional on positive feedback/)).toBeVisible();
  expect(await page.locator('form[action^="/api/"], textarea, input[type="email"]').count()).toBe(0);
});

test("the visitor chooses a complaint topic and reviews a private email without submitting on-site", async ({ page }) => {
  await page.goto("/contact/feedback");
  await expect(page.getByRole("radio")).toHaveCount(3);
  await page.getByRole("radio", { name: /Concern or complaint/ }).check();
  await page.getByLabel("Feedback topic").selectOption("privacy");
  await page.getByRole("button", { name: "Review feedback" }).click();
  const href = await page.getByRole("link", { name: "Open prepared feedback email" }).getAttribute("href");
  expect(href?.startsWith("mailto:amaanafoundation24@gmail.com?")).toBe(true);
  const email = new URL(href);
  expect(email.searchParams.get("subject")).toContain("Concern or complaint");
  expect(email.searchParams.get("body")).toContain("Privacy or public content");
  expect(email.searchParams.get("body")).toContain("not consent to publish");
  expect(email.searchParams.get("body")).toContain("does not create a tracked complaint ticket");
  await expect(page.getByRole("link", { name: "Request assistance privately" })).toHaveAttribute("href", "/request-assistance");
});

test("unrecognized complaint query strings cannot prepare or echo private information", async ({ page }) => {
  await page.goto("/contact/feedback?intent=review&kind=concern&kind=appreciation&topic=privacy&email=PRIVATE_CONTACT");
  await expect(page.locator('main p[role="alert"]')).toContainText("could not be read");
  await expect(page.getByRole("link", { name: "Open prepared feedback email" })).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText("PRIVATE_CONTACT");
});

test("feedback contact links fit 320px and have native keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/contact/feedback");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const first = page.getByRole("radio", { name: /Concern or complaint/ });
  await first.focus();
  await expect(first).toBeFocused();
});
