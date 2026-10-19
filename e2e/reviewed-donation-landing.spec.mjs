import { expect, test } from "@playwright/test";

test("changing reviewed appeal resets payment fields, amount limits and intent", async ({ page }) => {
  await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204 }));
  await page.route("https://checkout.razorpay.com/v1/checkout.js", route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: "window.Razorpay=class { constructor(options){this.options=options} open(){} };",
  }));
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  expect((await page.goto("/browser-acceptance/reviewed-donation", { waitUntil: "load" })).ok()).toBe(true);

  const first = page.getByRole("button", { name: /Select Synthetic first appeal/ });
  const second = page.getByRole("button", { name: /Select Synthetic second appeal/ });
  const continueButton = page.getByRole("button", { name: "Continue to payment methods" });

  await expect(first).toHaveAttribute("aria-pressed", "true");
  await expect(second).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("form.v2-donation-form")).toHaveCount(0);
  await continueButton.click();

  const amount = page.getByLabel("Donation amount");
  await expect(amount).toBeVisible();
  await amount.fill("750");
  await expect(page.getByRole("button", { name: "Use ₹900 for this donation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Use ₹1,000 for this donation" })).toHaveCount(0);

  await second.click();
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await expect(first).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("form.v2-donation-form")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Continue to payment methods" })).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Continue to payment methods" }).click();

  await expect(page.getByLabel("Donation amount")).toHaveValue("");
  await expect(page.getByRole("button", { name: "Use ₹2,500 for this donation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Use ₹1,000 for this donation" })).toBeVisible();
  await expect(page.getByText("Maximum available for this transaction: ₹2,500.")).toBeVisible();
  expect(errors).toEqual([]);
});
