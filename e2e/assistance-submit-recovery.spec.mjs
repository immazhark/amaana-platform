import { expect, test } from "@playwright/test";

async function prepare(page) {
  await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204, body: "" }));
  await page.goto("/request-assistance");
  await expect(page.locator("#assistance-form-heading")).toHaveText("Tell us about the request.");
  await expect(page.locator("#description-help")).toHaveCount(1);
  await expect(page.locator("#documents-help")).toHaveCount(1);
  await expect(page.locator("#assistance-consent-help")).toHaveCount(1);
  await page.getByLabel("Applicant name").fill("Synthetic Recovery Applicant");
  await page.getByLabel("Phone number").fill("9000000000");
  await page.getByLabel("City").fill("Hyderabad");
  await page.getByRole("button", { name: "Continue to need →" }).click();
  await page.getByLabel("Type of assistance").selectOption("MEDICAL");
  await page.getByLabel("Describe the need").fill("Synthetic browser acceptance only: verify uncertain submission recovery without creating any real assistance request.");
  await page.getByRole("button", { name: "Continue to evidence →" }).click();
  await page.getByRole("button", { name: "Continue to confirm →" }).click();
  await page.locator('input[name="consent"]').check();
}

for (const scenario of [
  { name: "server failure", status: 503, body: { error: "Try again" } },
  { name: "malformed success", status: 201, body: { referenceNumber: {}, trackingToken: {} } },
  { name: "malformed error", status: 400, body: { error: { internal: "PRIVATE_DIAGNOSTIC" } } },
  { name: "lost acknowledgement", abort: true },
]) {
  test(`uncertain assistance ${scenario.name} preserves data and blocks duplicate submission`, async ({ page }) => {
    let calls = 0;
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/api/assistance", route => {
      calls++;
      return scenario.abort ? route.abort("failed") : route.fulfill({
        status: scenario.status, contentType: "application/json", body: JSON.stringify(scenario.body),
      });
    });
    await prepare(page);
    await page.getByRole("button", { name: "Submit private request →" }).click();
    const alert = page.locator('.form-error[role="alert"]');
    await expect(alert).toContainText("Your request may already be recorded");
    await expect(alert).not.toContainText("PRIVATE_DIAGNOSTIC");
    await expect(alert).toBeFocused();
    await expect(page.getByRole("button", { name: "Follow-up required", exact: true })).toBeDisabled();
    await expect(page.locator('input[name="applicantName"]')).toHaveValue("Synthetic Recovery Applicant");
    await expect(page.locator('input[name="consent"]')).toBeChecked();
    await expect(page.getByRole("link", { name: "Contact Amaana about this request" })).toHaveAttribute("target", "_blank");
    await page.locator("form.v2-assistance-form").evaluate(form => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(calls).toBe(1);
    expect(errors).toEqual([]);
    await expect(page).toHaveURL(/\/request-assistance$/);
  });
}

test("explicit assistance validation stays correctable and ignores malformed field messages", async ({ page }) => {
  let calls = 0;
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/api/assistance", route => {
    calls++;
    return route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({
      error: "Review your phone number", fields: { phone: [{ internal: "PRIVATE_DIAGNOSTIC" }, "Enter a valid phone"], city: { internal: "PRIVATE_DIAGNOSTIC" } },
    }) });
  });
  await prepare(page);
  await page.getByRole("button", { name: "Submit private request →" }).click();
  const phone = page.getByLabel("Phone number");
  await expect(phone).toBeFocused();
  await expect(phone).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#phone-error")).toHaveText("Enter a valid phone");
  await expect(page.locator("form.v2-assistance-form")).not.toContainText("PRIVATE_DIAGNOSTIC");
  await phone.fill("9000000001");
  await page.getByRole("button", { name: /Confirm/ }).click();
  await expect(page.getByRole("button", { name: "Submit private request →" })).toBeEnabled();
  await page.getByRole("button", { name: "Submit private request →" }).click();
  await expect.poll(() => calls).toBe(2);
  expect(errors).toEqual([]);
});

test("rapid assistance submit events issue only one request", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/assistance", route => {
    calls++;
    return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Synthetic uncertain outcome" }) });
  });
  await prepare(page);
  await page.locator("form.v2-assistance-form").evaluate(form => {
    form.requestSubmit();
    form.requestSubmit();
  });
  await expect(page.getByRole("button", { name: "Follow-up required", exact: true })).toBeDisabled();
  expect(calls).toBe(1);
});
