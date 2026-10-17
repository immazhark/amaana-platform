import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { ZakatEstimator } from "./zakat-estimator";

const source = readFileSync(new URL("../app/zakat-calculator/page.tsx", import.meta.url), "utf8");
const donorPage = readFileSync(new URL("../app/donate/page.tsx", import.meta.url), "utf8");

describe("review-gated, private Zakat estimator", () => {
  it("displays a visitor-controlled calculator, not an automatic bank or gold-price feed", () => {
    const markup = renderToStaticMarkup(<ZakatEstimator />);
    for (const field of ["cash", "metals", "investments", "inventory",
      "receivables", "liabilities", "nisab"]) {
      expect(markup).toContain('id="zakat-' + field + '"');
    }
    expect(markup).toContain("No account, upload or payment is created");
    expect(markup).not.toContain("name=\"token\"");
    expect(markup).not.toContain("form action=");
    expect(markup).not.toContain("₹0.00</strong>");
  });
  it("requires a server-side editorial gate and robots noindex, with no second main landmark", () => {
    expect(source).toContain('AMAANA_ZAKAT_ESTIMATOR_REVIEWED !== "true"');
    expect(source).toContain("notFound()");
    expect(source).toContain("index: false");
    expect(source).not.toContain("<main");
  });
  it("only links the optional estimate from Donate when the review gate is enabled", () => {
    expect(donorPage).toContain('AMAANA_ZAKAT_ESTIMATOR_REVIEWED === "true"');
    expect(donorPage).toContain('href="/zakat-calculator"');
    expect(donorPage).toContain("does not establish which fund is authorised to accept Zakat");
  });
});
