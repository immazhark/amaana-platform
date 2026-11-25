import { expect, test } from "@playwright/test";

// The approved form-first contact policy leaves five route cards: three on the first row,
// two balanced cards on the second row, and a single column on phones.
const cards = page => page.locator("[data-contact-kind]");

async function widths(page) {
  return cards(page).evaluateAll(nodes => nodes.map(node => {
    const rect = node.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  }));
}

test("five contact cards form a balanced three-plus-two desktop grid", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect((await page.goto("/contact", { waitUntil: "load" }))?.ok()).toBe(true);
  await expect(cards(page)).toHaveCount(5);
  const boxes = await widths(page);
  const grid = await page.locator(".v2-intent-grid").first().boundingBox();
  expect(grid).not.toBeNull();
  for (const box of boxes.slice(0, 3)) {
    expect(box.width).toBeGreaterThan(grid.width * 0.30);
    expect(box.width).toBeLessThan(grid.width * 0.36);
    expect(Math.abs(box.y - boxes[0].y)).toBeLessThanOrEqual(1);
  }
  for (const box of boxes.slice(3)) {
    expect(box.width).toBeGreaterThan(grid.width * 0.45);
    expect(box.width).toBeLessThanOrEqual(grid.width * 0.5);
    expect(Math.abs(box.y - boxes[3].y)).toBeLessThanOrEqual(1);
  }
  expect(boxes[3].y).toBeGreaterThanOrEqual(Math.max(...boxes.slice(0, 3).map(box => box.y + box.height)));
  for (const row of [boxes.slice(0, 3), boxes.slice(3)]) {
    expect(Math.abs(row[0].x - grid.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(row.at(-1).x + row.at(-1).width - grid.x - grid.width)).toBeLessThanOrEqual(1);
    for (let i = 1; i < row.length; i++) {
      expect(row[i].x).toBeGreaterThanOrEqual(row[i - 1].x + row[i - 1].width);
    }
  }
  await expect(page.getByRole("link", { name: "Request assistance: Request assistance", exact: true })).toHaveAttribute("href", "/request-assistance");
  await expect(page.locator('main a[href^="tel:"], main a[href*="wa.me/"], main a[href*="api.whatsapp.com/"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("five contact cards stack cleanly on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  expect((await page.goto("/contact", { waitUntil: "load" }))?.ok()).toBe(true);
  await expect(cards(page)).toHaveCount(5);
  const boxes = await widths(page);
  const grid = await page.locator(".v2-intent-grid").first().boundingBox();
  expect(grid).not.toBeNull();
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    expect(Math.abs(box.x - grid.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.width - grid.width)).toBeLessThanOrEqual(1);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    if (i > 0) expect(box.y).toBeGreaterThanOrEqual(boxes[i - 1].y + boxes[i - 1].height);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
