import { expect, test } from "@playwright/test";

test("six evidence files are rejected in the browser before assistance submission", async ({ page }) => {
  let submissions = 0;
  await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204, body: "" }));
  await page.route("**/api/assistance", route => {
    submissions++;
    return route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
  });
  await page.goto("/request-assistance");
  await page.getByLabel("Applicant name").fill("Synthetic evidence applicant");
  await page.getByLabel("Phone number").fill("9000000000");
  await page.getByLabel("City").fill("Hyderabad");
  await page.getByRole("button", { name: "Continue to need →" }).click();
  await page.getByLabel("Type of assistance").selectOption("MEDICAL");
  await page.getByLabel("Describe the need").fill("Synthetic private intake evidence preflight: no request data or documents are sent during this test.");
  await page.getByRole("button", { name: "Continue to evidence →" }).click();

  const documents = page.locator("#documents");
  const files = Array.from({ length: 6 }, (_, index) => ({
    name: `document-${index}.pdf`,
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.7\nSynthetic private document"),
  }));
  await documents.setInputFiles(files);
  await expect(page.locator("#documents-error")).toContainText("no more than five");
  await page.getByRole("button", { name: "Continue to confirm →" }).click();
  await expect(page.locator('[data-assistance-step="3"]')).toBeVisible();
  await expect(documents).toBeFocused();
  expect(submissions).toBe(0);

  await documents.setInputFiles(files.slice(0, 1));
  await expect(page.locator("#documents-error")).toHaveCount(0);
  await page.getByRole("button", { name: "Continue to confirm →" }).click();
  await expect(page.locator('[data-assistance-step="4"]')).toBeVisible();
  expect(submissions).toBe(0);
});

test("oversized private evidence cannot advance to confirmation", async ({ page }) => {
  await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204, body: "" }));
  await page.goto("/request-assistance");
  await page.getByLabel("Applicant name").fill("Synthetic evidence applicant");
  await page.getByLabel("Phone number").fill("9000000000");
  await page.getByLabel("City").fill("Hyderabad");
  await page.getByRole("button", { name: "Continue to need →" }).click();
  await page.getByLabel("Type of assistance").selectOption("MEDICAL");
  await page.getByLabel("Describe the need").fill("Synthetic evidence preflight size check without creating any private assistance request.");
  await page.getByRole("button", { name: "Continue to evidence →" }).click();
  await page.locator("#documents").setInputFiles({
    name: "oversized.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  });
  await expect(page.locator("#documents-error")).toContainText("5 MB or smaller");
  await page.getByRole("button", { name: "Continue to confirm →" }).click();
  await expect(page.locator('[data-assistance-step="3"]')).toBeVisible();
});
