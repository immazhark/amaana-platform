import { expect, test } from "@playwright/test";

const url = "https://amaanafoundation.org/appeals/verified-education";
const fixture = "/browser-acceptance/appeal-share";

test("native share rejection copies the canonical appeal link", async ({ page }) => {
  await page.addInitScript(() => {
    window.__copiedAppeal = "";
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async () => { throw new Error("Share not available"); },
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async value => { window.__copiedAppeal = value; } },
    });
  });
  await page.goto(fixture);
  await page.getByRole("button", { name: "Share appeal" }).click();
  await expect(page.getByRole("status")).toHaveText("Appeal link copied.");
  expect(await page.evaluate(() => window.__copiedAppeal)).toBe(url);
});

test("clipboard refusal exposes an accessible selectable manual URL", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => { throw new Error("Denied"); } },
    });
  });
  await page.goto(fixture);
  await page.getByRole("button", { name: "Copy link" }).click();
  await expect(page.getByRole("status")).toContainText("Select and copy the appeal URL");
  const manual = page.getByRole("textbox", { name: "Appeal URL to copy manually" });
  await expect(manual).toHaveValue(url);
  await manual.focus();
  expect(await manual.evaluate(element => element.selectionStart === 0 && element.selectionEnd === element.value.length)).toBe(true);
});

test("a late failed copy cannot replace newer successful feedback", async ({ page }) => {
  await page.addInitScript(() => {
    window.__appealCopies = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () => new Promise((resolve, reject) => {
          window.__appealCopies.push({ resolve, reject });
        }),
      },
    });
  });
  await page.goto(fixture);
  const copy = page.getByRole("button", { name: "Copy link" });
  await copy.click();
  await expect.poll(() => page.evaluate(() => window.__appealCopies.length)).toBe(1);
  await copy.click();
  await expect.poll(() => page.evaluate(() => window.__appealCopies.length)).toBe(2);
  await page.evaluate(() => window.__appealCopies[1].resolve());
  await expect(page.getByRole("status")).toHaveText("Appeal link copied.");
  await page.evaluate(() => window.__appealCopies[0].reject(new Error("Late denial")));
  await expect(page.getByRole("status")).toHaveText("Appeal link copied.");
  await expect(page.getByRole("textbox", { name: "Appeal URL to copy manually" })).toHaveCount(0);
});

test("user cancellation is silent and does not fall back to clipboard", async ({ page }) => {
  await page.addInitScript(() => {
    window.__clipboardCalls = 0;
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async () => { throw new DOMException("Cancelled", "AbortError"); },
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => { window.__clipboardCalls += 1; } },
    });
  });
  await page.goto(fixture);
  await page.getByRole("button", { name: "Share appeal" }).click();
  await expect(page.getByRole("status")).toBeEmpty();
  expect(await page.evaluate(() => window.__clipboardCalls)).toBe(0);
});

test("WhatsApp is a secure canonical link and not an unverified popup success", async ({ page }) => {
  await page.goto(fixture);
  const whatsapp = page.getByRole("link", { name: "WhatsApp" });
  await expect(whatsapp).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=/);
  await expect(whatsapp).toHaveAttribute("target", "_blank");
  await expect(whatsapp).toHaveAttribute("rel", /noopener noreferrer/);
  const href = await whatsapp.getAttribute("href");
  const message = new URL(href).searchParams.get("text");
  expect(message).toContain(url);
  expect(message).toContain("Help provide essential learning materials.");
  await expect(page.getByRole("status")).toBeEmpty();
});
