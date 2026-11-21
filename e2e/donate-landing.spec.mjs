import { expect, test } from "@playwright/test";

// The donation page's first action must lead towards giving, and the checkout
// must stay roomy and consistent on a phone. Synthetic data only: the route is
// the isolated browser-acceptance fixture, never a production page.

async function open(page, appeals) {
  await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204 }));
  await page.route("https://checkout.razorpay.com/v1/checkout.js", route => route.fulfill({
    status: 200, contentType: "application/javascript", body: "window.Razorpay=class { open(){} };",
  }));
  const response = await page.goto(`/browser-acceptance/donate-landing?appeals=${appeals}`, { waitUntil: "load" });
  expect(response?.ok()).toBe(true);
}

const heroActions = page => page.locator(".page-hero__actions");

test("hero leads to giving when an appeal is open", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, 1);
  const primary = heroActions(page).getByRole("link", { name: "Give to a verified appeal" });
  await expect(primary).toHaveAttribute("href", "#choose-appeal-checkout");
  await expect(heroActions(page).getByRole("link", { name: "Explore Our Work" })).toHaveCount(0);
  await expect(heroActions(page).getByRole("link", { name: "Contact Amaana" })).toHaveCount(0);
  await primary.click();
  await expect(page.getByRole("heading", { name: "Give to this verified appeal." })).toBeInViewport();
});

test("hero panel states what is open instead of repeating the headline", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, 2);
  const panel = page.locator(".page-hero__visual, .page-hero__panel, [class*='page-hero__visual']").first();
  await expect(panel).toContainText("Open for support today");
  await expect(panel).toContainText("2 reviewed appeals are accepting gifts");
  await expect(panel).not.toContainText("Choose a verified public appeal, explore Taleem sponsorship");
});

test("no open appeal: hero sends visitors to the public appeals, not to a dead checkout", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, 0);
  await expect(heroActions(page).getByRole("link", { name: "View verified appeals" })).toHaveAttribute("href", "/appeals");
  await expect(page.locator("#choose-appeal-checkout")).toHaveCount(0);
});

test("a single appeal is shown as a destination, not as a choice to make", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, 1);
  const checkout = page.locator("#choose-appeal-checkout");
  await expect(checkout.locator("button[aria-pressed]")).toHaveCount(0);
  await expect(checkout).not.toContainText("You can change your selection");
  await expect(checkout).toContainText("₹4,99,500 remaining");
  await open(page, 2);
  await expect(page.locator("#choose-appeal-checkout button[aria-pressed]")).toHaveCount(2);
});

for (const width of [320, 390]) {
  test(`checkout keeps usable field width and no overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, 1);
    await page.getByRole("button", { name: "Continue to payment methods" }).click();

    const name = page.getByLabel("Full name");
    await name.scrollIntoViewIfNeeded();
    // The bordered control (not the bare input) is what the donor sees. Nested
    // cards used to leave it ~280px wide on a 390px phone; keep at most 48px
    // of combined gutter on each side.
    const control = await name.locator("xpath=..").boundingBox();
    expect(control?.width ?? 0).toBeGreaterThanOrEqual(width - 96);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

    // The collapsed call to action is demoted so it no longer competes with the form.
    const done = page.getByRole("button", { name: "Payment methods ready below" });
    await expect(done).toHaveClass(/v2-button--paper-secondary/);
    const doneBox = await done.boundingBox();
    const tabBox = await page.getByRole("button", { name: "Secure online payment" }).boundingBox();
    expect((tabBox?.y ?? 0) - ((doneBox?.y ?? 0) + (doneBox?.height ?? 0))).toBeGreaterThanOrEqual(12);
  });

  test(`direct UPI details read cleanly at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, 1);
    await page.getByRole("button", { name: "Continue to payment methods" }).click();
    await page.getByRole("button", { name: "Direct UPI / QR" }).click();

    // A missing QR is an ordinary state, not an error alert.
    const qrNote = page.getByText("A verified QR code is not published yet.");
    await expect(qrNote).toBeVisible();
    await expect(qrNote).not.toHaveClass(/form-error/);
    // (Scoped: Next's route announcer is a role=alert outside the checkout.)
    await expect(page.locator('#choose-appeal-checkout [role="alert"]')).toHaveCount(0);

    // The UPI ID stays on one line on any ordinary phone. Below 360px a
    // 28-character monospace ID cannot fit across fonts, so only wrapping
    // without overflow is required there.
    if (width >= 360) {
      const upi = await page.locator("code", { hasText: "mab.037347029220157@axisbank" }).evaluate(el => {
        const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight) || el.getBoundingClientRect().height;
        return { height: el.getBoundingClientRect().height, lineHeight };
      });
      expect(upi.height).toBeLessThanOrEqual(upi.lineHeight * 1.6);
    }

    // Each consent checkbox sits beside its own text, inside one card.
    for (const field of ["isAnonymous", "domesticConfirmed"]) {
      const layout = await page.locator(`input[name="${field}"]`).evaluate(input => {
        const label = input.closest("label");
        const text = label.querySelector("span");
        const inputBox = input.getBoundingClientRect();
        const textBox = text.getBoundingClientRect();
        return { sameRow: Math.abs((inputBox.top + inputBox.height / 2) - textBox.top) < textBox.height, textAfterInput: textBox.left >= inputBox.right };
      });
      expect(layout.textAfterInput).toBe(true);
      expect(layout.sameRow).toBe(true);
    }
    const domestic = page.locator('input[name="domesticConfirmed"]').locator("xpath=ancestor::label[1]");
    const title = domestic.locator("strong");
    const hint = domestic.locator("small");
    const titleBox = await title.boundingBox();
    const hintBox = await hint.boundingBox();
    expect((hintBox?.y ?? 0)).toBeGreaterThanOrEqual((titleBox?.y ?? 0) + (titleBox?.height ?? 0) - 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}
