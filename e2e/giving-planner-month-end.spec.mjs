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

test("Get Involved offers a private giving reminder without promising automatic debits", async ({ page }) => {
  await page.goto("/get-involved");
  const link = page.getByRole("link", { name: /Prepare a giving reminder/i });
  await expect(link).toHaveAttribute("href", "/get-involved/monthly-giving");
  await link.click();
  await expect(page.getByRole("heading", { name: "Make room for giving. Keep full control." })).toBeVisible();
  await expect(page.getByText("No automatic debits", { exact: false })).toBeVisible();
});


for (const width of [320, 720, 1440]) {
  test(`calendar controls remain contained at ${width}px with enlarged text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/get-involved/monthly-giving");
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    const planner = page.locator("#giving-reminder");
    await planner.locator("summary").click();
    for (const control of await planner.locator("select, input[type=date], button, summary").all()) {
      const box = await control.boundingBox();
      expect(box).not.toBeNull();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    const month = planner.getByRole("combobox", { name: "Day of each month" });
    await month.focus();
    await expect(month).toBeFocused();
  });
}
