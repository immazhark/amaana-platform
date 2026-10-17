import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicFundingMeter } from "./public-funding-meter";
import { getPublicAppealProgress } from "@/lib/public-appeal-progress";

describe("shared accessible fundraising meter", () => {
  it("renders the same exact paise and percent for donor selection and public cards", () => {
    const amount = getPublicAppealProgress(100.3, 500.01);
    if (!amount) throw new Error("Missing synthetic reviewed amount");
    const html = renderToStaticMarkup(<PublicFundingMeter progress={amount}
      title="Reviewed synthetic appeal" trackClassName="v2-appeal-progress"/>);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="20"');
    expect(html).toContain('aria-valuemax="100"');
    expect(html).toContain("₹100.30");
    expect(html).toContain("₹500.01");
    expect(html).toContain('width:20%');
    expect(html).toContain('aria-hidden="true"');
  });
  it("renders the meter visually without nested progressbar semantics inside chooser buttons", () => {
    const amount = getPublicAppealProgress(125.5, 500);
    if (!amount) throw new Error("Missing synthetic reviewed amount");
    const html = renderToStaticMarkup(<PublicFundingMeter decorative progress={amount}
      title="Synthetic appeal" trackClassName="choice-track"/>);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('width:25%');
    expect(html).not.toContain('role="progressbar"');
    expect(html).not.toContain('aria-valuenow');
  });
  it("never falsely announces 100 percent for a still-partial target", () => {
    const amount = getPublicAppealProgress(999.99, 1000);
    if (!amount) throw new Error("Missing partial fundraising state");
    const html = renderToStaticMarkup(<PublicFundingMeter progress={amount}
      title="Partial review" trackClassName="track"/>);
    expect(html).toContain('aria-valuenow="99"');
    expect(html).not.toContain('aria-valuenow="100"');
  });
});
