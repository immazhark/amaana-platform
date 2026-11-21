import { expect, test } from "@playwright/test";

// Synthetic reference and token only. The acknowledgement API is stubbed; no donation exists.
const reference = "AFD-2026-GUIDANCE-TEST";
const token = "synthetic-private-acknowledgement-token-123456";
const found = {
  found: true,
  presentation: { tone: "captured", heading: "Donation received", summary: "Your donation was recorded.", statusLabel: "Payment verified" },
  donation: {
    referenceNumber: reference, receiptNumber: `ACK-${reference}`, donorName: "Synthetic Donor", givingIntent: "GENERAL",
    amount: 500, refundedAmount: 0, recordDate: "2026-09-22T10:00:00.000Z", providerPaymentId: "pay_synthetic",
    appeal: { title: "Verified need", slug: "verified-need" },
  },
};
const json = (status, body) => ({ status, contentType: "application/json", body: JSON.stringify(body) });

async function stub(page, respond) {
  const requests = [];
  await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204, body: "" }));
  await page.route("**/api/donations/acknowledgement", route => {
    requests.push(route.request().postDataJSON());
    return route.fulfill(respond(requests.length));
  });
  return requests;
}

test("a rate-limited receipt says to wait, never to pay again, and retries cleanly", async ({ page }) => {
  const requests = await stub(page, count => (count === 1 ? json(429, { found: false }) : json(200, found)));
  await page.goto(`/donations/${reference}/acknowledgement#token=${token}`);
  await expect(page.getByRole("heading", { name: "Too many attempts." })).toBeVisible();
  await expect(page.getByText(/wait a few minutes/i)).toBeVisible();
  await expect(page.getByText(/do not need to pay again/i)).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Donation received" })).toBeVisible();
  expect(requests).toEqual([{ reference, token }, { reference, token }]);
});

test("an unavailable link explains how to recover and never prints a token", async ({ page }) => {
  await stub(page, () => json(404, { found: false }));
  await page.goto(`/donations/${reference}/acknowledgement#token=${token}`);
  await expect(page.getByRole("heading", { name: "Private acknowledgement unavailable." })).toBeVisible();
  const body = page.locator("main, body").first();
  await expect(body).toContainText(reference);
  await expect(body).toContainText(/lost your private link/i);
  await expect(page.getByRole("link", { name: /Contact Amaana/ })).toHaveAttribute("href", "/contact");
  expect(await page.evaluate(() => document.body.innerText)).not.toContain(token);
  expect(page.url()).not.toContain(token);
});

test("Copy private link puts the full link on the clipboard while the address bar stays token-free", async ({ page, context, baseURL }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(baseURL).origin });
  await stub(page, () => json(200, found));
  await page.goto(`/donations/${reference}/acknowledgement#token=${token}`);
  await expect(page.getByRole("heading", { name: "Donation received" })).toBeVisible();
  expect(page.url()).not.toContain(token);
  await page.getByRole("button", { name: "Copy private link" }).click();
  await expect(page.getByRole("status").filter({ hasText: /Private link copied/ })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(`${new URL(baseURL).origin}/donations/${reference}/acknowledgement#token=${token}`);
  expect(page.url()).not.toContain(token);
  // The warning that the link is a key travels with the button.
  await expect(page.getByText(/anyone with this link can open/i)).toBeVisible();
});

test("Print or save as PDF names the document after the reference, then restores the page title", async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => { window.__titleAtPrint = document.title; window.dispatchEvent(new Event("afterprint")); };
  });
  await stub(page, () => json(200, found));
  await page.goto(`/donations/${reference}/acknowledgement#token=${token}`);
  await expect(page.getByRole("heading", { name: "Donation received" })).toBeVisible();
  const before = await page.title();
  await page.getByRole("button", { name: "Print or save as PDF" }).click();
  const atPrint = await page.evaluate(() => window.__titleAtPrint);
  expect(atPrint).toContain(reference);
  expect(atPrint).toMatch(/Amaana Foundation/);
  expect(await page.title()).toBe(before);
});
