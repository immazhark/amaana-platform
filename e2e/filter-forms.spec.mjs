import { expect, test } from "@playwright/test";
import { waitForPublicOverview } from "./helpers/public-overview-ready.mjs";

// The GET filter forms on three overview pages share one layout (src/components/filter-form.module.css).
// Before it, the submit button was as wide as a field on /stories and /faith-and-reflections (about
// 584px) and sat offset from the control on /impact.
const forms = [
  { path: "/stories", label: "Filter published stories" },
  { path: "/faith-and-reflections", label: "Filter reviewed reflections" },
  { path: "/impact", label: "Filter documented impact by programme" },
];

async function geometry(page, label) {
  return page.locator(`form[aria-label="${label}"]`).evaluate(form => {
    const rect = element => element.getBoundingClientRect();
    const button = form.querySelector("button[type=submit]");
    const control = form.querySelector("input:not([type=hidden]), select");
    return {
      form: { width: rect(form).width },
      button: { width: rect(button).width, height: rect(button).height, bottom: rect(button).bottom },
      control: { bottom: rect(control).bottom },
      overflow: document.documentElement.scrollWidth - innerWidth,
    };
  });
}

for (const { path, label } of forms) {
  test(`${path} filter button is sized and aligned like a button on a desktop`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect((await page.goto(path, { waitUntil: "domcontentloaded" }))?.ok()).toBe(true);
    await waitForPublicOverview(page, path);
    const g = await geometry(page, label);
    expect(g.button.height).toBeLessThanOrEqual(64);
    expect(g.button.width).toBeLessThanOrEqual(260);
    // Bottom-aligned with the first control, not floating against the label block.
    expect(Math.abs(g.button.bottom - g.control.bottom)).toBeLessThanOrEqual(4);
    expect(g.overflow).toBeLessThanOrEqual(1);
  });

  test(`${path} filter button spans the form on a phone without overflow`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect((await page.goto(path, { waitUntil: "domcontentloaded" }))?.ok()).toBe(true);
    await waitForPublicOverview(page, path);
    const g = await geometry(page, label);
    expect(g.button.height).toBeLessThanOrEqual(64);
    expect(Math.abs(g.button.width - g.form.width)).toBeLessThanOrEqual(4);
    expect(g.overflow).toBeLessThanOrEqual(1);
  });
}
