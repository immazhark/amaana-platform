import { expect, test } from "@playwright/test";

// Synthetic fixture only (/browser-acceptance/donation). Razorpay and every API are stubbed; no payment or donation exists.
// These cover the moments after the donor has paid, where a wrong move could ask them to pay twice.
const order = {
  donationId: "donation-acceptance-001", orderId: "order_acceptance_001", amount: 25000, currency: "INR",
  keyId: "rzp_test_browser_acceptance", donor: { name: "Synthetic Donor", email: "synthetic@example.test" }, receiptToken: "a".repeat(32),
};
const payment = { razorpay_payment_id: "pay_acceptance_001", razorpay_order_id: "order_acceptance_001", razorpay_signature: "sig_acceptance_001" };
const json = (status, body) => ({ status, contentType: "application/json", body: JSON.stringify(body) });

// A Razorpay stand-in whose checkout "completes" at once, then runs the given script inside open().
const razorpay = afterPayment => `window.__checkoutOpens=0; window.Razorpay=class { constructor(options){this.options=options} open(){ window.__checkoutOpens++; const payment=${JSON.stringify(payment)}; ${afterPayment} } }`;

async function openCheckout(page, checkoutScript) {
  await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204, body: "" }));
  await page.route("https://checkout.razorpay.com/v1/checkout.js", route => route.fulfill({ status: 200, contentType: "application/javascript", body: checkoutScript }));
  await page.goto("/browser-acceptance/donation");
  await expect(page.getByRole("button", { name: "Continue securely →" })).toBeEnabled();
  await page.getByLabel(/Donation amount/).fill("250");
  await page.getByLabel("Full name").fill("Synthetic Donor");
  await page.getByLabel("Email").fill("synthetic@example.test");
  await page.locator('input[name="domesticConfirmed"]').check();
}

const forceSecondSubmit = page => page.locator("form.v2-donation-form").evaluate(form => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));

test("a lost payment confirmation after the donor has paid never invites a second payment", async ({ page }) => {
  const calls = { order: 0, confirm: 0 };
  await page.route("**/api/donations/order", route => { calls.order++; return route.fulfill(json(201, order)); });
  await page.route("**/api/donations/confirm", route => { calls.confirm++; return route.abort("failed"); });
  await openCheckout(page, razorpay("this.options.handler(payment);"));
  await page.getByRole("button", { name: "Continue securely →" }).click();
  const alert = page.locator('.form-error[role="alert"]');
  await expect(alert).toContainText("do not submit another payment");
  await expect(alert).toContainText(/retain your Razorpay payment confirmation/i);
  await expect(page.getByRole("button", { name: "Verification follow-up required" })).toBeDisabled();
  await forceSecondSubmit(page);
  expect(calls).toEqual({ order: 1, confirm: 1 });
  expect(await page.evaluate(() => window.__checkoutOpens)).toBe(1);
});

test("closing checkout after a payment was reported cannot unlock the form for a second order", async ({ page }) => {
  const calls = { order: 0, confirm: 0 };
  let releaseConfirm;
  const gate = new Promise(resolve => { releaseConfirm = resolve; });
  await page.route("**/api/donations/order", route => { calls.order++; return route.fulfill(json(201, order)); });
  await page.route("**/api/donations/confirm", async route => { calls.confirm++; await gate; return route.fulfill(json(200, { status: "PENDING" })); });
  // The handler reports the payment, then the modal dismiss callback fires, as it can when checkout closes right after paying.
  await openCheckout(page, razorpay("this.options.handler(payment); this.options.modal.ondismiss();"));
  await page.getByRole("button", { name: "Continue securely →" }).click();
  await expect(page.getByText("Payment received. Verifying your donation with Amaana.")).toBeVisible();
  await expect(page.locator('form.v2-donation-form button[type="submit"]')).toBeDisabled();
  await forceSecondSubmit(page);
  expect(calls.order).toBe(1);
  // An undecided verification ends in follow-up, not in a fresh order.
  releaseConfirm();
  await expect(page.getByRole("button", { name: "Verification follow-up required" })).toBeDisabled();
  await expect(page.locator('.form-error[role="alert"]')).toContainText("do not submit another payment");
  await forceSecondSubmit(page);
  expect(calls).toEqual({ order: 1, confirm: 1 });
});

test("an order the server quotes at a different amount never opens checkout", async ({ page }) => {
  let calls = 0;
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  // Every credential is valid; only the quoted amount (Rs 999) differs from what the donor asked for (Rs 250).
  await page.route("**/api/donations/order", route => { calls++; return route.fulfill(json(201, { ...order, amount: 99900 })); });
  await openCheckout(page, razorpay(""));
  await page.getByRole("button", { name: "Continue securely →" }).click();
  await expect(page.locator('.form-error[role="alert"]')).toContainText("order may have been created");
  await expect(page.getByRole("button", { name: "Verification follow-up required" })).toBeDisabled();
  await forceSecondSubmit(page);
  expect(calls).toBe(1);
  expect(await page.evaluate(() => window.__checkoutOpens)).toBe(0);
  expect(pageErrors).toEqual([]);
});
