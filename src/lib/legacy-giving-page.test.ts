import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const file = (name: string) => readFileSync(new URL(name, import.meta.url), "utf8");
describe("legacy giving information is not a premature charity payment product", () => {
  const page = file("../app/get-involved/legacy-giving/page.tsx");
  it("does not invite online transfers, legal drafting, tax promises or invented bequest acceptance", () => {
    expect(page).toContain("robots: { index: false, follow: false, noarchive: true }");
    expect(page).toContain("not an online bequest programme");
    expect(page).toContain("independent advice");
    expect(page).toContain("No payment · No legal documents collected");
    expect(page).toContain('href="/governance"');
    expect(page).toContain('href="/compliance"');
    expect(page).not.toContain("Razorpay");
    expect(page).not.toContain("80G deduction");
  });
  it("provides accessible step sequence and explicit legal/privacy safeguards", () => {
    expect(page).toContain('aria-labelledby="legacy-process-title"');
    expect(page).toContain("<ol className={styles.steps}>");
    expect(page).toContain("Do not upload a will");
    expect(page).toContain("does not establish any entitlement or accepted commitment");
  });
  it("keeps legible type, reduced-motion policy and mobile card layout", () => {
    const css = file("../app/get-involved/legacy-giving/legacy-giving.module.css");
    expect(css).toContain("font-size:1rem");
    expect(css).toContain("@media(max-width:680px)");
    expect(css).toContain("@media(prefers-reduced-motion:reduce)");
  });
});
