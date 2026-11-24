import { fundDonationFormCopy } from "@/components/fund-giving/fund-copy";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { FundGivingCheckout } from "@/components/fund-giving/fund-giving-checkout";
import type { GiveFund } from "@/components/fund-giving/fund-copy";
import type { DonationPaymentDetails } from "@/lib/donation-payment-details";
import { FUNDS_HERO_ACTIONS, FUND_CHOICE_ANCHOR, GIVE_HERO_ACTIONS } from "./giving-hero-actions";

const funds: GiveFund[] = [
  { slug: "general", name: "General Fund", summary: "Used where the need is greatest.", zakatPolicy: "ACCEPTED", isGeneral: true },
];
const paymentDetails = { upi: { id: "x@bank", qrImageUrl: null }, bank: null } as unknown as DonationPaymentDetails;

describe("fund-giving hero actions", () => {
  it("never fall back to the generic article actions", () => {
    for (const action of [...GIVE_HERO_ACTIONS, ...FUNDS_HERO_ACTIONS]) {
      expect(["Explore Our Work", "Contact Amaana"]).not.toContain(action.label);
    }
  });

  it("the give page's first action lands on a real element in the checkout", () => {
    expect(GIVE_HERO_ACTIONS[0]?.href).toBe(FUND_CHOICE_ANCHOR);
    const html = renderToStaticMarkup(<FundGivingCheckout funds={funds} copies={Object.fromEntries(funds.map(fund => [fund.slug, fundDonationFormCopy(fund)]))} paymentDetails={paymentDetails} feeBps={236} />);
    expect(html).toContain(`id="${FUND_CHOICE_ANCHOR.slice(1)}"`);
  });

  it("the ledger leads to giving and only links to routes that exist", () => {
    expect(FUNDS_HERO_ACTIONS[0]).toEqual({ label: "Give to a fund", href: "/give" });
    for (const action of [...GIVE_HERO_ACTIONS, ...FUNDS_HERO_ACTIONS]) {
      expect(action.href).toMatch(/^(#[a-z-]+|\/[a-z-]+)$/);
    }
  });
});
