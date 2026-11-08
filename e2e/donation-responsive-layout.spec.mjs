import { expect, test } from "@playwright/test";

for (const width of [390, 1280]) {
  test(`giving controls align and copy actions stay reachable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204 }));
    await page.route("https://checkout.razorpay.com/v1/checkout.js", route => route.fulfill({
      status: 200, contentType: "application/javascript", body: "window.Razorpay=class {open(){}};",
    }));
    expect((await page.goto("/browser-acceptance/reviewed-donation", { waitUntil: "load" }))?.ok()).toBe(true);
    await page.getByRole("button", { name: /Select Synthetic second appeal/ }).click();
    await page.getByRole("button", { name: "Continue to payment methods" }).click();

    async function checkIntentCards() {
      const radios = page.locator('input[name="givingIntent"]');
      await expect(radios).toHaveCount(3);
      for (const radio of await radios.all()) {
        const position = await radio.evaluate(el => {
          const input = el.getBoundingClientRect();
          const label = el.closest("label")?.getBoundingClientRect();
          const text = el.closest("label")?.querySelector("span")?.getBoundingClientRect();
          return { inputWidth: input.width, inputRight: input.right, labelRight: label?.right, textLeft: text?.left,
            noHorizontalScroll: document.documentElement.scrollWidth <= innerWidth + 2 };
        });
        expect(position.inputWidth).toBeLessThanOrEqual(26);
        expect(position.textLeft).toBeGreaterThanOrEqual(position.inputRight + 4);
        expect(position.labelRight).toBeLessThanOrEqual(width + 2);
        expect(position.noHorizontalScroll).toBe(true);
      }
    }
    await checkIntentCards();
    const amount = page.getByLabel(/Donation amount/);
    await amount.focus();
    const focus = await amount.evaluate(el => ({
      innerOutline: getComputedStyle(el).outlineStyle,
      outerFocus: getComputedStyle(el.parentElement).boxShadow,
    }));
    expect(focus.innerOutline).toBe("none");
    expect(focus.outerFocus).not.toBe("none");

    await page.getByRole("button", { name: "Bank transfer" }).click();
    await checkIntentCards();
    for (const name of ["Copy account number", "Copy IFSC"]) {
      const control = page.getByRole("button", { name, exact: true });
      await expect(control.locator("svg[aria-hidden='true']")).toHaveCount(1);
      const bounds = await control.boundingBox();
      expect(bounds?.width).toBeGreaterThanOrEqual(40);
      expect(bounds?.height).toBeGreaterThanOrEqual(40);
    }
    const nameInput = page.getByLabel("Full name");
    const inputBox = await nameInput.boundingBox();
    expect(inputBox?.width).toBeGreaterThan(150);
    expect(inputBox?.x).toBeGreaterThanOrEqual(0);

    await page.getByRole("button", { name: "Direct UPI / QR" }).click();
    await checkIntentCards();
    await expect(page.getByRole("button", { name: "Copy UPI ID", exact: true }).locator("svg[aria-hidden='true']")).toHaveCount(1);
  });
}

for (const width of [375, 1280]) {
  test(`appeal sharing buttons use legible icon and text at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/browser-acceptance/appeal-share");
    const area = page.getByRole("group", { name: "Share this appeal" });
    for (const label of ["Share appeal", "WhatsApp", "Copy link"]) {
      const control = area.getByRole(label === "WhatsApp" ? "link" : "button", { name: label });
      await expect(control).toBeVisible();
      await expect(control.locator("svg[aria-hidden='true']")).toHaveCount(1);
      const box = await control.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(40);
      expect(box?.x).toBeGreaterThanOrEqual(0);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width + 2);
    }
  });
}
