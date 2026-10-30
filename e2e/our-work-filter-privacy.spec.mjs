import { expect, test } from "@playwright/test";

function focusContrast(color, background) {
  const components = color.match(/^rgba?\(([^)]+)\)$/)?.[1].split(/[\s,/]+/).map(Number);
  if (!components || components.length < 3 || components.some(value => !Number.isFinite(value))) {
    throw new Error(`Unsupported computed focus color: ${color}`);
  }
  const alpha = components[3] ?? 1;
  if (alpha < 0 || alpha > 1) throw new Error(`Invalid focus opacity: ${color}`);
  const rgb = components.slice(0, 3).map((channel, i) => channel * alpha + background[i] * (1 - alpha));
  const luminance = values => values.reduce((total, channel, i) => {
    const srgb = channel / 255;
    const linear = srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
    return total + linear * [0.2126, 0.7152, 0.0722][i];
  }, 0);
  const [light, dark] = [luminance(rgb), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

test("Our Work search and selectors expose a contrast-safe keyboard focus ring", async ({ page }) => {
  await page.goto("/our-work", { waitUntil: "domcontentloaded" });
  const search = page.locator("#work-search");
  await search.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  for (const id of ["work-search", "work-programme", "work-year"]) {
    const control = page.locator(`#${id}`);
    await expect(control).toBeFocused();
    const outline = await control.evaluate(node => {
      const style = getComputedStyle(node);
      return { color: style.outlineColor, width: parseFloat(style.outlineWidth), style: style.outlineStyle };
    });
    expect(outline.style, `${id} focus outline`).toBe("solid");
    expect(outline.width, `${id} focus outline width`).toBeGreaterThanOrEqual(3);
    for (const background of [[255, 255, 255], [255, 253, 248]]) {
      expect(focusContrast(outline.color, background), `${id} focus contrast`).toBeGreaterThanOrEqual(3);
    }
    await page.keyboard.press("Tab");
  }
});

test("unknown Our Work URL values are rejected without echoing private input", async ({ page }) => {
  await page.goto("/our-work?programme=PRIVATE_PHONE&year=2026&email=PRIVATE_PERSON#work-results");
  const section = page.locator("#work-results");
  await expect(section.getByRole("status")).toContainText("These filters could not be read");
  await expect(section.getByRole("link", { name: "Clear filters" })).toBeVisible();
  await expect(section.locator("select[name=programme]")).toHaveValue("");
  await expect(section.locator("select[name=year]")).toHaveValue("");
  await expect(section).not.toContainText("PRIVATE_PHONE");
  await expect(section).not.toContainText("PRIVATE_PERSON");
  const html = await section.innerHTML();
  expect(html).not.toContain("PRIVATE_PHONE");
  expect(html).not.toContain("PRIVATE_PERSON");
});

test("valid Our Work selections remain bookmarkable and resettable", async ({ page }) => {
  await page.goto("/our-work?programme=ramadan-eid&year=2026#work-results");
  const section = page.locator("#work-results");
  await expect(section.locator("select[name=programme]")).toHaveValue("ramadan-eid");
  await expect(section.locator("select[name=year]")).toHaveValue("2026");
  await expect(section.getByRole("status")).toHaveCount(0);
  await expect(section.locator(".work-results-count")).toContainText("matching these filters");
  await section.getByRole("link", { name: "Clear filters" }).click();
  await expect(page).not.toHaveURL(/programme=|year=/);
  await expect(section.locator("select[name=programme]")).toHaveValue("");
  await expect(section.locator("select[name=year]")).toHaveValue("");
  await page.goBack();
  await expect(section.locator("select[name=programme]")).toHaveValue("ramadan-eid");
  await expect(section.locator("select[name=year]")).toHaveValue("2026");
  await page.goForward();
  await expect(section.locator("select[name=programme]")).toHaveValue("");
  await expect(section.locator("select[name=year]")).toHaveValue("");
});
