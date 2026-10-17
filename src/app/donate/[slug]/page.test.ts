import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { donationAmountValidationMessage } from "@/lib/donation-amount-input";

const mocks = vi.hoisted(() => ({ getDonationPageData: vi.fn(), methods: vi.fn() }));
vi.mock("@/lib/public-page-data", () => ({ getDonationPageData: mocks.getDonationPageData }));
vi.mock("@/lib/donation-payment-details", () => ({ getDonationPaymentDetails: () => ({}) }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("not found"); } }));
vi.mock("@/components/donation-methods", () => ({ DonationMethods: (props: { maxAmount: number }) => {
  mocks.methods(props);
  return createElement("div", { "data-maximum": props.maxAmount });
} }));
vi.mock("@/components/page-hero", () => ({ PageHero: ({ visual }: { visual: ReactNode }) => visual }));
import DonatePage from "./page";

const appeal = { id: "synthetic", slug: "synthetic", title: "Synthetic appeal", status: "PUBLISHED", closesAt: null, zakatEligible: false };
const params = { params: Promise.resolve({ slug: "synthetic" }) };
beforeEach(() => vi.resetAllMocks());

describe("exact donation page bounds", () => {
  it.each([
    { raised: "0.01", goal: "2.01", expected: 2, donation: "2" },
    { raised: "0.01", goal: "10.01", expected: 10, donation: "10" },
    { raised: "0.30", goal: "400.01", expected: 399.71, donation: "399" },
  ])("passes exact $expected remaining rupees to both payment methods", async ({ raised, goal, expected, donation }) => {
    mocks.getDonationPageData.mockResolvedValue({ ...appeal, amountRaised: raised, goalAmount: goal });
    const html = renderToStaticMarkup(await DonatePage(params));
    expect(html).toContain(`data-maximum="${expected}"`);
    const maximum = mocks.methods.mock.calls[0]?.[0].maxAmount;
    expect(maximum).toBe(expected);
    expect(donationAmountValidationMessage(donation, maximum < 10 ? maximum : 10, maximum)).toBe("");
  });

  it("fails closed if the projected appeal has an unpayable final balance", async () => {
    mocks.getDonationPageData.mockResolvedValue({ ...appeal, amountRaised: "0.01", goalAmount: "2.02" });
    await expect(DonatePage(params)).rejects.toThrow("not found");
    expect(mocks.methods).not.toHaveBeenCalled();
  });
});
