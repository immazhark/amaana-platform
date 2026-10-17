import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

test("calendar reminder download is controlled by the donor and never charges", async ({ page }) => {
  await page.goto("/get-involved/monthly-giving", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Make room for giving. Keep full control." })).toBeVisible();
  await expect(page.getByText(/This is not a subscription, standing instruction or automatic payment/)).toBeVisible();
  await page.getByLabel("Day of each month").selectOption("25");

  const downloadPending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download calendar reminder" }).click();
  const download = await downloadPending;
  expect(download.suggestedFilename()).toBe("amaana-manual-giving-reminder.ics");
  const file = await download.path();
  expect(file).toBeTruthy();
  const ics = readFileSync(file, "utf8").replace(/\r\n /g, "");
  expect(ics).toContain("BEGIN:VCALENDAR");
  expect(ics).toContain("RRULE:FREQ=MONTHLY;BYMONTHDAY=25");
  expect(ics).toContain("URL:https://amaanafoundation.org/donate");
  expect(ics).toContain("no automatic debit or subscription");
  expect(ics).toContain("END:VCALENDAR");

  await expect(page.getByRole("link", { name: "Review approved donation options" }))
    .toHaveAttribute("href", "/donate");
});

test("monthly reminder can be discovered without entering or submitting payment data", async ({ page }) => {
  await page.goto("/get-involved", { waitUntil: "domcontentloaded" });
  const link = page.getByRole("link", { name: /Create a manual reminder: Review giving each month/ });
  await expect(link).toHaveAttribute("href", "/get-involved/monthly-giving");
  await link.click();
  await expect(page).toHaveURL(/\/get-involved\/monthly-giving$/);
  await expect(page.getByRole("button", { name: "Download calendar reminder" })).toBeVisible();
  await expect(page.locator('input[type="password"],input[name*="card"],input[name*="upi"]')).toHaveCount(0);
});
