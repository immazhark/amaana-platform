import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppealDonationFlow, type AppealDonationChoice } from "./appeal-donation-flow";

const appeal: AppealDonationChoice = {
  id: "synthetic_appeal", slug: "synthetic-approved-appeal",
  title: "Synthetic approved need", raised: 100, goal: 500,
  remaining: 400, zakatEligible: false,
};
describe("reviewed in-page appeal selector", () => {
  it("never displays checkout for an empty approved appeal selection", () => {
    const markup = renderToStaticMarkup(<AppealDonationFlow appeals={[]}
      bankAvailable={false} paymentInstructions={{ DIRECT_UPI: null, BANK_TRANSFER: null }}/>);
    expect(markup).toContain("No verified appeal is available");
    expect(markup).not.toContain("Secure online payment");
  });
  it("shows per-appeal verified goal and its actual eligible remainder", () => {
    const markup = renderToStaticMarkup(<AppealDonationFlow appeals={[appeal]}
      bankAvailable={true} paymentInstructions={{ DIRECT_UPI: null, BANK_TRANSFER: null }}/>);
    expect(markup).toContain("Synthetic approved need");
    expect(markup).toContain("₹400");
    expect(markup).toContain("₹500");
    expect(markup).toContain("20%");
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain('aria-label="Select Synthetic approved need; ₹400.00 remaining; 20% of ₹500.00 supported"');
    expect(markup).not.toContain('role="progressbar"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain("server rechecks eligibility");
  });
  it("does not merge independent appeal targets or preselect Zakat for any cause", () => {
    const next: AppealDonationChoice = { ...appeal, id: "different_appeal",
      title: "Second reviewed need", raised: 40, goal: 100, remaining: 60 };
    const markup = renderToStaticMarkup(<AppealDonationFlow appeals={[appeal,next]}
      bankAvailable={false} paymentInstructions={{ DIRECT_UPI: null, BANK_TRANSFER: null }}/>);
    expect(markup).toContain("20%");
    expect(markup).toContain("40%");
    expect(markup).not.toContain("₹600");
  });
  it("does not offer a payment method for sub-minimum fractional remainders", () => {
    const fractional = { ...appeal, raised: 490.5, goal: 500, remaining: 9.5 };
    const markup = renderToStaticMarkup(<AppealDonationFlow appeals={[fractional]}
      bankAvailable={true} paymentInstructions={{ DIRECT_UPI: null, BANK_TRANSFER: null }}/>);
    expect(markup).toContain("No verified appeal is available for checkout");
    expect(markup).not.toContain('aria-pressed="true"');
  });
  it("keeps checkout available when a fractional balance permits at least ten whole rupees", () => {
    const fractional = { ...appeal, raised: 489.75, goal: 500, remaining: 10.25 };
    const markup = renderToStaticMarkup(<AppealDonationFlow appeals={[fractional]}
      bankAvailable={true} paymentInstructions={{ DIRECT_UPI: null, BANK_TRANSFER: null }}/>);
    expect(markup).toContain("₹10.25 remaining");
    expect(markup).toContain('aria-pressed="true"');
  });
});
