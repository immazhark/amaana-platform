import { expect, test } from "@playwright/test";

async function openCheckout(page) {
  await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204, body: "" }));
  await page.route("https://checkout.razorpay.com/v1/checkout.js", route => route.fulfill({
    status: 200, contentType: "application/javascript",
    body: "window.__checkoutOpens=0; window.Razorpay=class { constructor(options) {this.options=options} open(){ window.__checkoutOpens++ } }",
  }));
  await page.goto("/browser-acceptance/donation");
  await expect(page.getByRole("button", { name: "Continue securely →" })).toBeEnabled();
  await page.getByLabel(/Donation amount/).fill("250");
  await page.getByLabel("Full name").fill("Synthetic Donor");
  await page.getByLabel("Email").fill("synthetic@example.test");
  await page.locator('input[name="domesticConfirmed"]').check();
}

for (const outcome of [
  { name: "server failure after possible order creation", status: 500, body: { error: "Retry" } },
  { name: "gateway timeout", status: 504, body: { error: "Retry" } },
  { name: "malformed success credentials", status: 201, body: { orderId: {}, amount: 25000, currency: "INR", keyId: {}, donor: {}, receiptToken: {} } },
  { name: "lost acknowledgement", abort: true },
]) {
  test(`uncertain donation ${outcome.name} keeps donor details and blocks another order`, async ({ page }) => {
    let calls = 0;
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    await page.route("**/api/donations/order", route => {
      calls++;
      return outcome.abort ? route.abort("failed") : route.fulfill({
        status: outcome.status, contentType: "application/json", body: JSON.stringify(outcome.body),
      });
    });
    await openCheckout(page);
    await page.getByRole("button", { name: "Continue securely →" }).click();
    const error = page.locator('.form-error[role="alert"]');
    await expect(error).toContainText("order may have been created");
    await expect(page.getByRole("button", { name: "Verification follow-up required" })).toBeDisabled();
    await expect(page.getByLabel("Full name")).toHaveValue("Synthetic Donor");
    await expect(page.getByLabel("Email")).toHaveValue("synthetic@example.test");
    await expect(page.locator('input[name="domesticConfirmed"]')).toBeChecked();
    await page.locator("form.v2-donation-form").evaluate(form => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(calls).toBe(1);
    expect(await page.evaluate(() => window.__checkoutOpens)).toBe(0);
    expect(pageErrors).toEqual([]);
  });
}

test("two immediate native donation submissions create only one attempted order", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/donations/order", route => {
    calls++;
    return route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"Synthetic server failure"}' });
  });
  await openCheckout(page);
  await page.locator("form.v2-donation-form").evaluate(form => {
    form.requestSubmit();
    form.requestSubmit();
  });
  await expect(page.getByRole("button", { name: "Verification follow-up required" })).toBeDisabled();
  expect(calls).toBe(1);
});

test("known pre-write validation response remains editable and filters unsafe errors", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/donations/order", route => {
    calls++;
    return route.fulfill({
      status: 400, contentType: "application/json",
      body: JSON.stringify({ error: "Correct the donor email", fields: {
        donorEmail: [{ internal: "PRIVATE_DIAGNOSTIC" }, "Enter a valid email"],
        donorName: { diagnostic: "PRIVATE_DIAGNOSTIC" },
        receiptToken: ["PRIVATE_DIAGNOSTIC"],
      } }),
    });
  });
  await openCheckout(page);
  await page.getByRole("button", { name: "Continue securely →" }).click();
  await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#donor-email-error")).toHaveText("Enter a valid email");
  await expect(page.locator(".form-error")).not.toContainText("PRIVATE_DIAGNOSTIC");
  await expect(page.getByRole("button", { name: "Continue securely →" })).toBeEnabled();
  await page.getByLabel("Email").fill("corrected@example.test");
  await page.getByRole("button", { name: "Continue securely →" }).click();
  await expect.poll(() => calls).toBe(2);
});


test("late successful donation order response cannot open checkout after the form unmounts", async ({ page }) => {
  let releaseOrder;
  const gate = new Promise(resolve => { releaseOrder = resolve; });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/api/donations/order", async route => {
    await gate;
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({
      donationId: "donation-acceptance-001",
      orderId: "order_acceptance_001",
      amount: 25000,
      currency: "INR",
      keyId: "rzp_test_browser_acceptance",
      donor: { name: "Synthetic Donor", email: "synthetic@example.test" },
      receiptToken: "a".repeat(32),
    }) });
  });
  await openCheckout(page);
  await page.getByRole("button", { name: "Continue securely →" }).click();
  await expect(page.getByText("Opening Razorpay secure checkout.")).toBeVisible();
  await page.getByRole("button", { name: "Unmount donation form" }).click();
  await expect(page.getByText("Donation form unmounted for remount acceptance.")).toBeVisible();
  const response = page.waitForResponse(result => result.url().includes("/api/donations/order"));
  releaseOrder();
  await response;
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await page.evaluate(() => window.__checkoutOpens)).toBe(0);
  expect(errors).toEqual([]);
});
