import { expect, test } from "@playwright/test";

// First-look defects found by reading the live home page and /appeals at 1440px and 390px.
// Synthetic fixture only: /browser-acceptance/first-look renders the real components with fake data.

async function open(page, appeals, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/analytics/page-view", route => route.fulfill({ status: 204 }));
  const response = await page.goto(`/browser-acceptance/first-look?appeals=${appeals}`, { waitUntil: "load" });
  expect(response?.ok()).toBe(true);
}

const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
const box = async locator => (await locator.first().boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };

test("the cumulative Eid total reads as a figure above its caption, not '2,830documented'", async ({ page }) => {
  await open(page, 1, 1280);
  const figure = page.locator(".v3-eid-total strong");
  const caption = page.locator(".v3-eid-total strong + span");
  await expect(caption).toContainText("documented family distributions across seven Eid drives");
  const f = await box(figure);
  const c = await box(caption);
  // Stacked, left-aligned: the caption starts below the figure instead of continuing its line.
  expect(c.y).toBeGreaterThanOrEqual(f.y + f.height - 1);
  expect(Math.abs(c.x - f.x)).toBeLessThanOrEqual(1);
});

for (const [grid, label] of [["home-grid", "home"], ["appeals-grid", "/appeals"]]) {
  test(`one open appeal is a feature across the row on ${label}, not a lone card in a wide row`, async ({ page }) => {
    await open(page, 1, 1280);
    const container = page.locator(`[data-fixture="${grid}"]`);
    const card = container.locator(".v2-appeal-card");
    const g = await box(container);
    const c = await box(card);
    expect(c.width).toBeGreaterThanOrEqual(g.width * 0.95);
    // Visual on the left, copy on the right.
    const visual = await box(card.locator(".v2-appeal-card-visual"));
    const body = await box(card.locator(".v2-appeal-card-body"));
    expect(visual.x + visual.width).toBeLessThanOrEqual(body.x + 1);
    expect(visual.height).toBeGreaterThanOrEqual(c.height - 2);
    expect(await noOverflow(page)).toBe(true);
  });

  test(`two or three open appeals keep the card grid on ${label}`, async ({ page }) => {
    await open(page, 3, 1280);
    const container = page.locator(`[data-fixture="${grid}"]`);
    const g = await box(container);
    const widths = await container.locator(".v2-appeal-card").evaluateAll(cards => cards.map(card => card.getBoundingClientRect().width));
    expect(widths).toHaveLength(3);
    for (const width of widths) expect(width).toBeLessThan(g.width * 0.7);
  });

  test(`a single appeal stacks cleanly on a phone on ${label}`, async ({ page }) => {
    await open(page, 1, 390);
    const card = page.locator(`[data-fixture="${grid}"] .v2-appeal-card`);
    const c = await box(card);
    const visual = await box(card.locator(".v2-appeal-card-visual"));
    const body = await box(card.locator(".v2-appeal-card-body"));
    expect(body.y).toBeGreaterThanOrEqual(visual.y + visual.height - 1);
    expect(c.width).toBeLessThanOrEqual(390);
    expect(await noOverflow(page)).toBe(true);
  });
}

test("the appeal search button is sized like a button, not stretched to the block height", async ({ page }) => {
  await open(page, 1, 1280);
  const button = page.getByRole("button", { name: "Find appeals" });
  const input = page.getByRole("searchbox", { name: /Search active appeals/ });
  const b = await box(button);
  const i = await box(input);
  expect(b.height).toBeLessThanOrEqual(72);
  expect(b.width).toBeLessThanOrEqual(240);
  // Aligned with the field, not floating at the top of the label block.
  expect(Math.abs((b.y + b.height) - (i.y + i.height))).toBeLessThanOrEqual(4);
});

test("the appeal search stacks into a full-width button on a phone without overflow", async ({ page }) => {
  await open(page, 1, 390);
  const button = page.getByRole("button", { name: "Find appeals" });
  const input = page.getByRole("searchbox", { name: /Search active appeals/ });
  const b = await box(button);
  const i = await box(input);
  expect(b.height).toBeLessThanOrEqual(72);
  expect(b.y).toBeGreaterThanOrEqual(i.y + i.height - 1);
  expect(Math.abs(b.width - i.width)).toBeLessThanOrEqual(4);
  expect(await noOverflow(page)).toBe(true);
});

test("the Taleem enquiry form is laid out as a form: display heading, aligned consent, spaced button", async ({ page }) => {
  await open(page, 1, 1280);
  const form = page.locator('[data-fixture="taleem-enquiry"] form');
  // No inline style attributes carrying layout.
  await expect(form.locator("[style]")).toHaveCount(0);

  const heading = form.getByRole("heading", { name: "Prepare your sponsorship enquiry" });
  const typography = await heading.evaluate(el => {
    const style = getComputedStyle(el);
    return { size: Number.parseFloat(style.fontSize), weight: Number(style.fontWeight), family: style.fontFamily, body: getComputedStyle(document.body).fontFamily };
  });
  expect(typography.size).toBeGreaterThanOrEqual(26);
  expect(typography.weight).toBeLessThanOrEqual(600);
  expect(typography.family).not.toBe(typography.body);

  // The consent checkbox sits beside its own text inside one card.
  const layout = await form.locator('input[name="privateName"]').evaluate(input => {
    const label = input.closest("label");
    const text = label.querySelector("span").getBoundingClientRect();
    const box = input.getBoundingClientRect();
    return { textAfterInput: text.left >= box.right, sameRow: Math.abs(box.top - text.top) <= 12, labelHeight: label.getBoundingClientRect().height };
  });
  expect(layout.textAfterInput).toBe(true);
  expect(layout.sameRow).toBe(true);

  // The button is separated from the consent card, and fields are not flush against each other.
  const choice = await box(form.locator(".taleem-choice"));
  const button = await box(form.getByRole("button", { name: "Review enquiry" }));
  expect(button.y - (choice.y + choice.height)).toBeGreaterThanOrEqual(16);
  const first = await box(form.getByLabel("Education pathway"));
  const second = await box(form.getByLabel("Support preference"));
  expect(second.y - (first.y + first.height)).toBeGreaterThanOrEqual(16);
});

test("the Taleem enquiry form fits a phone without overflow", async ({ page }) => {
  await open(page, 1, 390);
  const form = page.locator('[data-fixture="taleem-enquiry"] form');
  expect(await noOverflow(page)).toBe(true);
  const choice = await box(form.locator(".taleem-choice"));
  expect(choice.x + choice.width).toBeLessThanOrEqual(390);
});
