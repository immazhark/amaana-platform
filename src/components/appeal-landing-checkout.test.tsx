import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppealLandingCheckout } from "./appeal-landing-checkout";

vi.mock("./donation-methods", () => ({
  DonationMethods: ({ appealId }: { appealId: string }) => <div data-reviewed-checkout={appealId} />,
}));

const paymentDetails = { upi: { id: "verified@upi", qrImageUrl: null }, bank: null };
const appeals = [
  { id: "approved-first", slug: "approved-first", title: "Approved education", maxAmount: 900, zakatEligible: false },
  { id: "approved-second", slug: "approved-second", title: "Approved healthcare", maxAmount: 2_500, zakatEligible: true },
];

describe("AF-R083 landing-page donation selection", () => {
  it("renders exactly one reviewed checkout with purpose-specific accessible selection", () => {
    const html = renderToStaticMarkup(<AppealLandingCheckout appeals={appeals} paymentDetails={paymentDetails}/>);
    expect(html).toContain('data-reviewed-checkout="approved-first"');
    expect(html).not.toContain('data-reviewed-checkout="approved-second"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain("₹900");
    expect(html).toContain("₹2,500");
    expect(html).toContain("/appeals/approved-first");
    expect(html).toContain("/appeals/approved-second");
  });

  it("omits in-page payment controls when the reviewed appeal list has no payable balance", () => {
    const invalid = [
      { ...appeals[0]!, maxAmount: 0 },
      { ...appeals[1]!, maxAmount: 9.5 },
    ];
    expect(renderToStaticMarkup(<AppealLandingCheckout appeals={invalid} paymentDetails={paymentDetails}/>)).toBe("");
    expect(renderToStaticMarkup(<AppealLandingCheckout appeals={[]} paymentDetails={paymentDetails}/>)).toBe("");
  });
});
