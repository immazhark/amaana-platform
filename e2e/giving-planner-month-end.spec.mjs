import { expect, test } from "@playwright/test";

test("a visitor can download a private month-end giving reminder without payment", async ({ page }) => {
  const response = await page.goto("/get-involved/monthly-giving");
  expect(response?.ok()).toBe(true);
  const form = page.locator('form[action="/api/giving-reminder"]').filter({
    has: page.locator('select[name="day"]'),
  });
  await expect(form.getByRole("option", { name: "Last day of the month" })).toHaveCount(1);
  await form.locator('select[name="day"]').selectOption("last");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    form.getByRole("button", { name: "Download monthly reminder" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("amaana-manual-giving-reminder.ics");

  const calendarResponse = await page.request.get("/api/giving-reminder?frequency=monthly&day=last");
  expect(calendarResponse.status()).toBe(200);
  expect(calendarResponse.headers()["cache-control"]).toContain("no-store");
  const calendar = (await calendarResponse.text()).replace(/\r\n /g, "");
  const date = calendar.match(/DTSTART;VALUE=DATE:(\d{4})(\d{2})(\d{2})/);
  expect(date).not.toBeNull();
  const [, year, month, day] = date;
  expect(Number(day)).toBe(new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate());
  expect(calendar).toContain("RRULE:FREQ=MONTHLY;BYMONTHDAY=-1");
  expect(calendar).toContain("no automatic debit or subscription");
  expect(calendar).not.toContain("ATTENDEE:");
});
