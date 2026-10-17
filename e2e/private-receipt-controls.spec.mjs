import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`private controls recover with status reads at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.clock.install();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/api/public/live-rail", route => route.fulfill({ json: { items: [] } }));
    await page.route("**/api/analytics/**", route => route.fulfill({ status: 204 }));
    const reads = { rights: 0, recognition: 0 };
    const writes = [];
    for (const [kind, endpoint] of [["rights", "data-rights"], ["recognition", "recognition"]]) {
      await page.route(`**/api/donations/${endpoint}`, route => {
        const body = route.request().postDataJSON();
        expect(body.token).toBe("synthetic-private-receipt-token");
        expect(route.request().url()).not.toContain(body.token);
        if (body.action !== "status") { writes.push(body.action); return; }
        reads[kind]++;
        if (reads[kind] === 1 || body.reference === "AFD-SYNTHETIC-TWO") return;
        return route.fulfill({ json: kind === "rights" ? { requests: [] } : { state: "published", name: "Synthetic donor", revocable: true } });
      });
    }
    const response = await page.goto("/browser-acceptance/private-receipt-controls");
    expect(response?.ok()).toBeTruthy();
    await expect.poll(() => reads.rights + reads.recognition).toBe(2);
    await page.clock.runFor(8_000);
    const rights = page.getByRole("region", { name: "Private donor information requests" });
    const recognition = page.getByRole("region", { name: "Optional donor Shukr recognition" });
    for (const panel of [rights, recognition]) {
      await expect(panel.getByRole("alert")).toBeVisible();
      await panel.getByRole("button", { name: "Check status", exact: true }).click();
    }
    await expect(recognition).toContainText("Synthetic donor");
    await rights.getByRole("button", { name: "Submit private review request" }).click();
    await recognition.getByRole("button", { name: "Withdraw recognition request/name" }).click();
    await expect.poll(() => writes.length).toBe(2);
    await page.clock.runFor(15_000);
    for (const panel of [rights, recognition]) {
      await expect(panel.getByRole("alert")).toContainText("could not confirm");
      await panel.getByRole("button", { name: "Check status", exact: true }).click();
    }
    expect(writes).toEqual(["request", "withdraw"]);
    await expect(recognition).toContainText("Synthetic donor");
    let pdfReads = 0;
    await page.route("**/api/donations/receipt-download/authorize", () => { pdfReads++; });
    await page.getByRole("button", { name: "Download acknowledgement (PDF)", exact: true }).click();
    await expect.poll(() => pdfReads).toBe(1);
    await page.clock.runFor(25_000);
    await expect(page.getByText("PDF unavailable.", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "Download acknowledgement (PDF)", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Switch synthetic receipt" }).click();
    await expect(recognition).not.toContainText("Synthetic donor");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
    expect(errors).toEqual([]);
  });
}
