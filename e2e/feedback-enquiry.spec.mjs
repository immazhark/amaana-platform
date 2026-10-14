import { expect, test } from "@playwright/test";

test("voluntary feedback is separate from assistance and prepares rather than sends a complaint", async ({ page }) => {
  await page.goto("/contact/feedback", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Your concerns deserve a respectful hearing." })).toBeVisible();
  await expect(page.getByText("Assistance is never conditional on positive feedback.")).toBeVisible();

  const concern = page.getByRole("radio", { name: /Concern or complaint/ });
  await expect(concern).toBeChecked();
  const topic = page.getByLabel("Area of concern or feedback");
  await topic.selectOption("website");
  const note = page.getByRole("textbox", { name: /Optional message/ });
  await note.fill("The mobile navigation is difficult to use with a keyboard.");
  const action = page.getByRole("link", { name: /Compose concern email/ });
  const href = await action.getAttribute("href");
  expect(href).toMatch(/^mailto:amaanafoundation24@gmail\.com\?/);
  const email = new URL(href);
  expect(email.searchParams.get("subject")).toContain("Concern or complaint");
  expect(email.searchParams.get("body")).toContain("Website or accessibility");
  expect(email.searchParams.get("body")).toContain("difficult to use with a keyboard");
  expect(email.searchParams.get("body")).toContain("not consent to publish");
  expect(email.searchParams.get("body")).toContain("does not create a tracked complaint ticket");

  await page.getByRole("radio", { name: /Private appreciation/ }).check();
  await expect(page.getByRole("link", { name: /Compose feedback email/ })).toHaveAttribute("href", /Private%20appreciation/);
  await expect(page.getByText(/Nothing is sent or stored by this page/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Request assistance privately" })).toHaveAttribute("href", "/request-assistance");
});

test("contact page makes complaints findable without requiring a donation or review", async ({ page }) => {
  await page.goto("/contact", { waitUntil: "domcontentloaded" });
  const path = page.getByRole("link", { name: /Share private feedback: Feedback and concerns/ });
  await expect(path).toHaveAttribute("href", "/contact/feedback");
  await path.click();
  await expect(page).toHaveURL(/\/contact\/feedback$/);
  await expect(page.getByRole("radio", { name: /Concern or complaint/ })).toBeChecked();
});
