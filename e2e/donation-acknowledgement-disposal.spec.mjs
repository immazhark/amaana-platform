import { expect, test } from "@playwright/test";

test("AF-N24 aborts a pending private acknowledgement lookup when the route unmounts", async ({ page }) => {
  const reference = "AFD-SYNTHETIC-DISPOSAL";
  const token = "synthetic-disposal-token-1234567890";
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/api/analytics/page-view", route =>
    route.fulfill({ status: 204, body: "" }));

  let acceptRequest;
  const requested = new Promise(resolve => { acceptRequest = resolve; });
  let releaseResponse;
  const delayedResponse = new Promise(resolve => { releaseResponse = resolve; });
  const requests = [];
  await page.route("**/api/donations/acknowledgement", async route => {
    requests.push(route.request().postDataJSON());
    acceptRequest();
    await delayedResponse;
    // The client aborts this request on unmount. Playwright may reject
    // fulfillment of an aborted network route; no response is required.
    try {
      await route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
          found: true,
          presentation: {
            tone: "captured", heading: "Synthetic private record",
            summary: "For disposal testing only", statusLabel: "Payment verified",
          },
          donation: {
            referenceNumber: reference, receiptNumber: "ACK-SYNTHETIC-DISPOSAL",
            donorName: "Synthetic Donor", givingIntent: "GENERAL",
            amount: 500, refundedAmount: 0, recordDate: "2026-11-15T00:00:00.000Z",
            providerPaymentId: "pay_synthetic",
            appeal: { title: "Synthetic appeal", slug: "synthetic-appeal" },
          },
        }),
      });
    } catch {
      // A cancelled request cannot receive the delayed synthetic response.
    }
  });

  await page.goto(`/donations/${reference}/acknowledgement#token=${token}`);
  try {
    await requested;
    await expect(page.getByRole("heading", { name: "Opening your private transaction record…" })).toBeVisible();
    expect(new URL(page.url()).hash).toBe("");
    await page.getByRole("navigation", { name: "Primary navigation" })
      .getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about\/?$/);
  } finally {
    releaseResponse();
  }
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(requests).toEqual([{ reference, token }]);
  await expect(page.getByText("Synthetic Donor")).toHaveCount(0);
  expect(errors).toEqual([]);
});
