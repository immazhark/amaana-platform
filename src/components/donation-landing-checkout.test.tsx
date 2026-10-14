import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DonationLandingCheckout } from "./donation-landing-checkout";
import type { AppealDonationChoice } from "./appeal-donation-flow";
import type { DonorFund } from "@/lib/fund-checkout-contract";

const appeal: AppealDonationChoice = {
  id: "synthetic_appeal", slug: "reviewed-appeal",
  title: "Reviewed appeal", raised: 100, goal: 500, remaining: 400,
  zakatEligible: false,
};
const fund: DonorFund = {
  id: "synthetic_fund", revision: 1,
  name: "Synthetic approved fund", purpose: "A reviewed purpose for assistance",
  disclosure: "This is a synthetic reviewed fund for tests",
  acceptedIntents: ["GENERAL", "SADAQAH"],
};
const common = {
  bankAvailable: false,
  paymentInstructions: { DIRECT_UPI: null, BANK_TRANSFER: null },
};

describe("single donor checkout route selection", () => {
  it("does not render an unapproved checkout when there are no choices", () => {
    const html = renderToStaticMarkup(
      <DonationLandingCheckout appeals={[]} funds={[]} {...common}/>,
    );
    expect(html).toBe("");
  });

  it("renders exactly one form route when appeal and approved fund both exist", () => {
    const html = renderToStaticMarkup(
      <DonationLandingCheckout appeals={[appeal]} funds={[fund]} {...common}/>,
    );
    expect(html).toContain("Choose your giving route");
    expect(html).toContain("Support an active appeal");
    expect(html).toContain("Support an approved fund");
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("active-appeal-checkout");
    expect(html).not.toContain('id="giving-fund-selection"');
    expect(html).toContain("₹400");
  });

  it("shows approved fund flow instead of an empty appeal selector", () => {
    const html = renderToStaticMarkup(
      <DonationLandingCheckout appeals={[]} funds={[fund]} {...common}/>,
    );
    expect(html).not.toContain("active-appeal-checkout");
    expect(html).toContain('id="giving-fund-selection"');
    expect(html).toContain("Synthetic approved fund");
  });

  it("opens the approved fund checkout when the visitor follows the fund route", () => {
    const html = renderToStaticMarkup(
      <DonationLandingCheckout initialRoute="fund" appeals={[appeal]} funds={[fund]} {...common}/>,
    );
    expect(html).toContain('id="giving-fund-selection"');
    expect(html).not.toContain('id="active-appeal-checkout"');
    expect(html).toContain("Synthetic approved fund");
  });

  it("cannot open an unapproved fund based solely on a deep-link parameter", () => {
    const html = renderToStaticMarkup(
      <DonationLandingCheckout initialRoute="fund" appeals={[appeal]} funds={[]} {...common}/>,
    );
    expect(html).toContain('id="active-appeal-checkout"');
    expect(html).not.toContain('id="giving-fund-selection"');
  });

  it("does not render fund checkout when only an appeal is available", () => {
    const html = renderToStaticMarkup(
      <DonationLandingCheckout appeals={[appeal]} funds={[]} {...common}/>,
    );
    expect(html).toContain("active-appeal-checkout");
    expect(html).not.toContain("giving-fund-choice");
    expect(html).not.toContain("Choose your giving route");
  });
});
