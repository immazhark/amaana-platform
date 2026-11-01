import { expect, test } from "@playwright/test";

test("malformed private acknowledgement remains retryable without a new payment", async ({ page }) => {
  const reference = "AFD-2026-READ-VALIDATION";
  const token = "synthetic-private-acknowledgement-token-123456";
  const requests = [];
  let malformed = true;
  await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204, body: "" }));
  await page.route("**/api/donations/acknowledgement", async route => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(malformed ? { found: true, presentation: { tone: "captured", heading: "Donation received" }, donation: { referenceNumber: reference, amount: "500" } } : {
        found: true,
        presentation: { tone: "captured", heading: "Donation received", summary: "Your donation was recorded.", statusLabel: "Payment verified" },
        donation: {
          referenceNumber: reference, receiptNumber: "ACK-AFD-2026-READ",
          donorName: "Synthetic Donor", givingIntent: "GENERAL",
          amount: 500, refundedAmount: 0, recordDate: "2026-09-22T10:00:00.000Z",
          providerPaymentId: "pay_synthetic", appeal: { title: "Verified need", slug: "verified-need" },
        },
      }),
    });
  });

  await page.goto(`/donations/${reference}/acknowledgement#token=${token}`);
  await expect(page.getByRole("heading", { name: "Unable to open your acknowledgement." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  expect(new URL(page.url()).hash).toBe("");

  malformed = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Donation received" })).toBeVisible();
  await expect(page.locator(".v2-receipt-status > span")).toHaveText("Payment verified");
  expect(requests).toEqual([{ reference, token }, { reference, token }]);
  expect(page.url()).not.toContain(token);
});

test.describe("private acknowledgement record date on a UTC device", () => {
  test.use({ timezoneId: "UTC" });

  test("shows the India calendar day and scrubs the private URL token", async ({ page }) => {
    const reference = "AFD-SYNTHETIC-IST";
    const token = "synthetic-acknowledgement-token-utc";
    await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204, body: "" }));
    await page.route("**/api/donations/acknowledgement", route => route.fulfill({
      status: 200,
      json: {
        found: true,
        presentation: {
          tone: "captured", heading: "Donation received",
          summary: "Synthetic private record", statusLabel: "Payment verified",
        },
        donation: {
          referenceNumber: reference, receiptNumber: "ACK-SYNTHETIC-IST",
          donorName: "Synthetic Donor", givingIntent: "GENERAL",
          amount: 500, refundedAmount: 0,
          recordDate: "2026-10-26T19:00:00.000Z",
          providerPaymentId: "pay_synthetic",
          appeal: { title: "Synthetic appeal", slug: "synthetic-appeal" },
        },
      },
    }));

    await page.goto(`/donations/${reference}/acknowledgement#token=${token}`);
    await expect(page.getByRole("heading", { name: "Donation received" })).toBeVisible();
    await expect(page.locator("dt").filter({ hasText: "Record date" }).locator("xpath=following-sibling::dd")).toHaveText("27 October 2026");
    expect(new URL(page.url()).hash).toBe("");
  });
});
