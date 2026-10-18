import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EidGrowthExplorer } from "./eid-growth-explorer";

describe("homepage interactive Eid growth explorer", () => {
  it("exposes every verified year as a native keyboard-operable disclosure without client JavaScript", () => {
    const html = renderToStaticMarkup(createElement(EidGrowthExplorer));
    expect((html.match(/<details\b/g) ?? [])).toHaveLength(7);
    expect((html.match(/<summary\b/g) ?? [])).toHaveLength(7);
    expect(html).toContain("2020");
    expect(html).toContain("2026");
    expect(html).toContain("2,830");
    expect(html).toContain("710");
    expect(html).toContain("60");
    expect(html).toContain("families reached that year");
    expect(html).toContain("family distributions across seven");
    expect(html).not.toContain("documented Eid Kit distributions.");
    expect(html).toContain("not a count of distinct families");
    expect(html).not.toContain("aria-pressed");
  });

  it("does not include a hidden donation, personal data collection, or misleading payment promise", () => {
    const html = renderToStaticMarkup(createElement(EidGrowthExplorer));
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<input");
    expect(html).not.toContain("Razorpay");
    expect(html).not.toContain("payment");
    expect(html).toContain("2026");
    expect(html).toContain("2020");
  });
});
