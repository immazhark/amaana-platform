import { expect, test } from "@playwright/test";

test("Our Work disclosure headings keep readable boundaries between their labels", async ({ page }) => {
  const response = await page.goto("/our-work");
  expect(response?.ok()).toBe(true);

  const headings = page.locator(".v2-cause-summary-heading");
  const count = await headings.count();
  expect(count).toBeGreaterThan(0);

  for (const heading of await headings.all()) {
    const parts = await heading.evaluate(node => {
      const text = (selector) => node.querySelector(selector)?.textContent?.trim() ?? "";
      return {
        label: text(".v2-section-label"),
        title: text(".v2-cause-summary-title"),
        count: text(".v2-cause-summary-count"),
        combined: node.textContent ?? "",
      };
    });
    expect(parts.label).toBe("Umbrella programme");
    expect(parts.title.length).toBeGreaterThan(0);
    expect(parts.count).toMatch(/^\\d+ initiatives?$/);
    expect(parts.combined).toContain(`${parts.label} ${parts.title} ${parts.count}`);
  }
});
