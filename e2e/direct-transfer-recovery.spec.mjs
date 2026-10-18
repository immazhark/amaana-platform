import { expect, test } from "@playwright/test";


async function openWithSyntheticClipboard(page, rejectsWrites = false) {
  await page.addInitScript(({ reject }) => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async value => {
          window.__amaanaCopiedValue = value;
          if (reject) throw new Error("Synthetic clipboard permission denied");
        },
      },
    });
  }, { reject: rejectsWrites });
  await page.goto("/browser-acceptance/direct-donation");
}

test("direct UPI copy confirms the exact payment destination through an accessible status", async ({ page }) => {
  await openWithSyntheticClipboard(page);
  await page.getByRole("button", { name: "Direct UPI / QR" }).click();
  const details = page.getByRole("region", { name: "Verified UPI details" });
  const destination = await details.locator("code").innerText();
  await details.getByRole("button", { name: "Copy UPI ID" }).click();
  await expect(page.locator("#direct-copy-status-DIRECT_UPI")).toHaveText("UPI ID copied.");
  expect(await page.evaluate(() => window.__amaanaCopiedValue)).toBe(destination);
});

test("bank details provide distinct accessible copy actions and success feedback", async ({ page }) => {
  await openWithSyntheticClipboard(page);
  await page.getByRole("button", { name: "Bank transfer" }).click();
  const details = page.getByRole("region", { name: "Verified bank transfer details" });
  await details.getByRole("button", { name: "Copy account number" }).click();
  await expect(page.locator("#direct-copy-status-BANK_TRANSFER")).toHaveText("Account number copied.");
  expect(await page.evaluate(() => window.__amaanaCopiedValue)).toMatch(/^[0-9]+$/);
  await details.getByRole("button", { name: "Copy IFSC" }).click();
  await expect(page.locator("#direct-copy-status-BANK_TRANSFER")).toHaveText("IFSC copied.");
  expect(await page.evaluate(() => window.__amaanaCopiedValue)).toMatch(/^[A-Z]{4}0[A-Z0-9]{6}$/);
});

test("denied clipboard access gives manual-copy guidance without an unhandled error", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await openWithSyntheticClipboard(page, true);
  await page.getByRole("button", { name: "Direct UPI / QR" }).click();
  await page.getByRole("button", { name: "Copy UPI ID" }).click();
  await expect(page.locator("#direct-copy-status-DIRECT_UPI")).toContainText(
    "Could not copy UPI ID. Select the value above and copy it manually.",
  );
  expect(pageErrors).toEqual([]);
});

async function prepareDirectTransfer(page) {
  await page.goto("/browser-acceptance/direct-donation");
  await page.getByRole("button", { name: "Direct UPI / QR" }).click();
  await page.getByLabel("Full name").fill("Synthetic Direct Donor");
  await page.getByLabel("Email").fill("synthetic@example.test");
  await page.getByLabel("Amount (INR)").fill("250");
  await page.getByLabel("UTR / transaction reference").fill("UTRTEST9000123");
  await page.getByLabel("Transfer date and time").fill("2026-09-30T10:30");
  await page.locator('input[name="domesticConfirmed"]').check();
}

for (const outcome of [
  { name: "unknown database write", status: 503, body: { error: "Transfer reporting status is uncertain. Do not submit the same UTR again." } },
  { name: "server error after possible write", status: 500, body: { error: "Try again" } },
  { name: "already recorded UTR", status: 409, body: { error: "This transfer reference has already been submitted." } },
  { name: "malformed accepted receipt", status: 202, body: { referenceNumber: {}, receiptToken: [], status: "PENDING_VERIFICATION" } },
]) {
  test(`direct transfer ${outcome.name} locks repeat reporting and retains UTR`, async ({ page }) => {
    let calls = 0;
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.route("**/api/donations/direct-transfer", route => {
      calls++;
      return route.fulfill({ status: outcome.status, contentType: "application/json", body: JSON.stringify(outcome.body) });
    });
    await prepareDirectTransfer(page);
    await page.getByRole("button", { name: "Submit transfer for verification" }).click();
    const alert = page.locator(".v2-donation-form .form-error[role='alert']");
    await expect(alert).toContainText(/do not submit the same UTR again|do not submit this transfer again/i);
    await expect(page.getByRole("button", { name: "Verification follow-up required" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Secure online payment" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Bank transfer" })).toBeDisabled();
    await expect(page.getByLabel("UTR / transaction reference")).toHaveValue("UTRTEST9000123");
    await expect(page.getByLabel("Email")).toHaveValue("synthetic@example.test");
    await page.locator(".v2-donation-form form").evaluate(form => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(calls).toBe(1);
    expect(errors).toEqual([]);
  });
}

test("two same-tick native direct-transfer submissions create one claim request", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/donations/direct-transfer", route => {
    calls++;
    return route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"uncertain"}' });
  });
  await prepareDirectTransfer(page);
  await page.locator(".v2-donation-form form").evaluate(form => {
    form.requestSubmit();
    form.requestSubmit();
  });
  await expect(page.getByRole("button", { name: "Verification follow-up required" })).toBeDisabled();
  expect(calls).toBe(1);
});

test("known prewrite invalid direct-transfer data permits correction without losing donor details", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/donations/direct-transfer", route => {
    calls++;
    return route.fulfill({ status: 400, contentType: "application/json", body: '{"error":"Please check the transfer information and reference."}' });
  });
  await prepareDirectTransfer(page);
  await page.getByRole("button", { name: "Submit transfer for verification" }).click();
  await expect(page.getByRole("button", { name: "Submit transfer for verification" })).toBeEnabled();
  await expect(page.getByLabel("UTR / transaction reference")).toHaveValue("UTRTEST9000123");
  await page.getByLabel("UTR / transaction reference").fill("UTRCORRECTED456");
  await page.getByRole("button", { name: "Submit transfer for verification" }).click();
  await expect.poll(() => calls).toBe(2);
});

test("lost response after direct transfer keeps identity and prevents automatic replay", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/donations/direct-transfer", route => {
    calls++;
    return route.abort("failed");
  });
  await prepareDirectTransfer(page);
  await page.getByRole("button", { name: "Submit transfer for verification" }).click();
  await expect(page.getByRole("button", { name: "Verification follow-up required" })).toBeDisabled();
  await expect(page.getByLabel("UTR / transaction reference")).toHaveValue("UTRTEST9000123");
  expect(calls).toBe(1);
});


test("direct transfer prevents method switching while an acknowledgement is pending, then unlocks after prewrite validation", async ({ page }) => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let calls = 0;
  await page.route("**/api/donations/direct-transfer", async route => {
    calls++;
    await gate;
    await route.fulfill({ status: 400, contentType: "application/json", body: '{"error":"Check the transfer reference."}' });
  });
  await prepareDirectTransfer(page);
  await page.getByRole("button", { name: "Submit transfer for verification" }).click();
  await expect(page.getByRole("button", { name: "Secure online payment" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Bank transfer" })).toBeDisabled();
  release();
  await expect(page.getByRole("button", { name: "Submit transfer for verification" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Bank transfer" })).toBeEnabled();
  expect(calls).toBe(1);
});


test("direct transfer guidance remains present across UPI and bank methods after static copy extraction", async ({ page }) => {
  await prepareDirectTransfer(page);
  await expect(page.getByText("Complete the transfer using the verified details below, then submit the UTR/reference so Amaana can reconcile it. Your appeal total changes only after verification.")).toBeVisible();
  await expect(page.getByText("Record this contribution as Sadaqah for this verified appeal.")).toBeVisible();
  await expect(page.getByText("I confirm this contribution is from an Indian source using a domestic account/payment method.")).toBeVisible();
  await page.getByRole("button", { name: "Bank transfer" }).click();
  await expect(page.getByRole("heading", { name: "Transfer directly to Amaana Foundation." })).toBeVisible();
});


test("online checkout cannot be replaced by a direct transfer during an unresolved order", async ({ page }) => {
  await page.route("https://checkout.razorpay.com/v1/checkout.js", route => route.fulfill({
    status: 200, contentType: "application/javascript",
    body: "window.Razorpay=class { constructor(options) {this.options=options} open(){} }",
  }));
  let releaseOrder;
  const wait = new Promise(resolve => { releaseOrder = resolve; });
  let calls = 0;
  await page.route("**/api/donations/order", async route => {
    calls++;
    await wait;
    await route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"synthetic uncertain provider outcome"}' });
  });
  await page.goto("/browser-acceptance/direct-donation");
  await expect(page.getByRole("button", { name: "Continue securely →" })).toBeEnabled();
  await page.getByLabel("Donation amount").fill("250");
  await page.getByLabel("Full name").fill("Synthetic Online Donor");
  await page.getByLabel("Email").fill("synthetic@example.test");
  await page.locator('input[name="domesticConfirmed"]').check();
  await page.getByRole("button", { name: "Continue securely →" }).click();
  await expect(page.getByRole("button", { name: "Direct UPI / QR" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Bank transfer" })).toBeDisabled();
  releaseOrder();
  await expect(page.getByRole("button", { name: "Verification follow-up required" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Direct UPI / QR" })).toBeDisabled();
  expect(calls).toBe(1);
});

test("online pre-write validation permits donor to switch to direct UPI without creating another order", async ({ page }) => {
  await page.route("https://checkout.razorpay.com/v1/checkout.js", route => route.fulfill({
    status: 200, contentType: "application/javascript",
    body: "window.Razorpay=class { constructor(options) {this.options=options} open(){} }",
  }));
  let releaseOrder;
  const wait = new Promise(resolve => { releaseOrder = resolve; });
  let calls = 0;
  await page.route("**/api/donations/order", async route => {
    calls++;
    await wait;
    await route.fulfill({ status: 400, contentType: "application/json", body: '{"error":"Check donor information."}' });
  });
  await page.goto("/browser-acceptance/direct-donation");
  await expect(page.getByRole("button", { name: "Continue securely →" })).toBeEnabled();
  await page.getByLabel("Donation amount").fill("250");
  await page.getByLabel("Full name").fill("Synthetic Online Donor");
  await page.getByLabel("Email").fill("synthetic@example.test");
  await page.locator('input[name="domesticConfirmed"]').check();
  await page.getByRole("button", { name: "Continue securely →" }).click();
  await expect(page.getByRole("button", { name: "Direct UPI / QR" })).toBeDisabled();
  releaseOrder();
  await expect(page.getByRole("button", { name: "Direct UPI / QR" })).toBeEnabled();
  await page.getByRole("button", { name: "Direct UPI / QR" }).click();
  await expect(page.getByRole("heading", { name: "Pay Amaana directly by UPI." })).toBeVisible();
  expect(calls).toBe(1);
});
