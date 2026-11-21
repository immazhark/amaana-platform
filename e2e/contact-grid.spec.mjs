import { expect, test } from "@playwright/test";

// The contact page has seven route cards. In the three-column grid the seventh sat alone in the last row;
// it now spans the row on desktop. Counts that already balanced (4 and 5) are untouched.
const cards = page => page.locator("[data-contact-kind]");

async function widths(page) {
  return cards(page).evaluateAll(nodes => nodes.map(node => {
    const rect = node.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  }));
}

test("the seventh contact card spans the last row on a desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect((await page.goto("/contact", { waitUntil: "load" }))?.ok()).toBe(true);
  const boxes = await widths(page);
  expect(boxes).toHaveLength(7);
  const grid = await page.locator(".v2-intent-grid").first().boundingBox();
  // First six keep three columns.
  for (const box of boxes.slice(0, 6)) expect(box.width).toBeLessThan((grid?.width ?? 0) * 0.4);
  const last = boxes[6];
  expect(last.width).toBeGreaterThanOrEqual((grid?.width ?? 0) * 0.95);
  // A strip, not a tall card: it must be shorter than the cards above it.
  expect(last.height).toBeLessThan(boxes[0].height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("the contact cards stack cleanly on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  expect((await page.goto("/contact", { waitUntil: "load" }))?.ok()).toBe(true);
  const boxes = await widths(page);
  expect(boxes).toHaveLength(7);
  for (const box of boxes) expect(box.x + box.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
