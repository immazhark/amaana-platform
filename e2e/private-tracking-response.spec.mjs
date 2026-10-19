import { expect, test } from "@playwright/test";

test("malformed successful private-tracking data remains retryable without showing false status", async ({ page }) => {
  const reference = "AFR-READ-SAFETY-001";
  const token = "private-read-validation-token-1234567890";
  const requests = [];
  let invalid = true;

  await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204, body: "" }));
  await page.route("**/api/assistance/status", async route => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(invalid
        ? { found: true, status: "APPROVED", createdAt: "not-a-date", updatedAt: "not-a-date" }
        : { found: true, status: "UNDER_VERIFICATION", createdAt: "2026-09-16T00:00:00.000Z", updatedAt: "2026-09-17T12:30:00.000Z" }),
    });
  });

  await page.goto(`/request-assistance/status#reference=${reference}&token=${token}`);
  await expect(page.getByRole("heading", { name: "Unable to check your request" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try tracking again" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a new request" })).toHaveCount(0);
  expect(new URL(page.url()).hash).toBe("");

  invalid = false;
  await page.getByRole("button", { name: "Try tracking again" }).click();
  await expect(page.getByRole("heading", { name: "Under verification" })).toBeVisible();
  expect(requests).toEqual([{ reference, token }, { reference, token }]);
  expect(page.url()).not.toContain(token);
});
