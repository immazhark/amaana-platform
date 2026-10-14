import { expect, test } from "@playwright/test";

// Synthetic only: never fetch actual donors or contact a payment gateway.
const reference = "AFD-SYNTHETIC-20261015";
const token = "synthetic-private-receipt-token-20261015";
const path = `/donations/${reference}/acknowledgement`;
const receipt = {
  found: true,
  presentation: { tone: "captured", heading: "Payment verified", summary: "Verified private donation acknowledgement.", statusLabel: "Verified" },
  donation: {
    referenceNumber: reference, receiptNumber: "ACK-SYNTHETIC-20261015",
    donorName: "Synthetic donor only", givingIntent: "GENERAL", designationKind: "APPEAL",
    amount: 100.30, refundedAmount: 0.10, recordDate: "2026-10-15T00:00:00.000Z",
    providerPaymentId: "pay_synthetic_only",
    appeal: { title: "Synthetic public assistance appeal", slug: "synthetic-public-assistance" },
  },
};

for (const width of [390, 1440]) {
  test(`private receipt recovery and print at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204 }));
    const checkedTokens = [];
    await page.route("**/api/donations/acknowledgement", async route => {
      const body = route.request().postDataJSON();
      checkedTokens.push(body.token);
      expect(body.reference).toBe(reference);
      await route.fulfill({
        status: 200, contentType: "application/json",
        headers: { "Cache-Control": "no-store, private", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow, noarchive" },
        body: JSON.stringify(receipt),
      });
    });

    const response = await page.goto(path);
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: "Private acknowledgement unavailable." })).toBeVisible();
    await expect(page.getByText("Synthetic donor only")).toHaveCount(0);

    // Masked credentials are submitted via POST, never placed in a query string.
    await page.getByLabel("Have your private record token?").fill(token);
    await page.getByRole("button", { name: "Open private record" }).click();
    await expect(page.getByRole("heading", { name: "Payment verified" })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/donations/${reference}/acknowledgement$`));
    expect(checkedTokens).toEqual([token]);

    const sheet = page.locator(".v2-receipt-sheet");
    await expect(sheet).toContainText("Synthetic donor only");
    await expect(sheet).toContainText("₹100.30");
    await expect(sheet).toContainText("₹0.10");
    await expect(sheet).toContainText("not certify Section 80G deduction eligibility");

    await page.emulateMedia({ media: "print" });
    await expect(sheet).toBeVisible();
    for (const selector of [".v2-receipt-next", ".v2-receipt-hero", ".site-header", ".site-footer", ".print-button"]) {
      await expect(page.locator(selector)).toBeHidden();
    }
    await expect(sheet).toContainText("₹0.10");
    const style = await sheet.evaluate(node => ({
      background: getComputedStyle(node).backgroundColor,
      border: getComputedStyle(node).borderTopWidth,
    }));
    expect(style.background).toBe("rgb(255, 255, 255)");
    expect(style.border).toBe("0px");
  });
}

test("fragment token is erased from the address after successful private read", async ({ page }) => {
  await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204 }));
  await page.route("**/api/donations/acknowledgement", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(receipt) }));
  await page.goto(`${path}#token=${token}`);
  await expect(page.getByRole("heading", { name: "Payment verified" })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/donations/${reference}/acknowledgement$`));
});
