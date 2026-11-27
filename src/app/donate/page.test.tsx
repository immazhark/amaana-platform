import { afterEach, describe, expect, it, vi } from "vitest";
import { Suspense, isValidElement, type ReactElement, type ReactNode } from "react";

vi.mock("@/lib/public-page-data", () => ({ getReviewedDonationPageData: vi.fn(), getDonationImpactHighlights: vi.fn() }));
vi.mock("@/lib/donation-checkout-balance", () => ({ getDonationCheckoutRemainingAmount: vi.fn() }));
vi.mock("@/lib/donation-payment-details", () => ({ getDonationPaymentDetails: () => ({ upi: null, bank: null }) }));
vi.mock("@/lib/server-log", () => ({ logServerError: vi.fn() }));
vi.mock("@/lib/fund-giving-flag", () => ({ isFundGivingEnabled: () => true }));

import Page from "./page";
import { DonatePageView } from "./donate-page-view";
import { getReviewedDonationPageData, getDonationImpactHighlights } from "@/lib/public-page-data";
import { getDonationCheckoutRemainingAmount } from "@/lib/donation-checkout-balance";
import { logServerError } from "@/lib/server-log";
import { VerifiedImpactStrip } from "@/components/verified-impact-strip";

afterEach(() => vi.resetAllMocks());

type Deferred = ReactElement<Record<string, unknown>, (props: Record<string, unknown>) => Promise<ReactElement | null>>;
function deferred(node: ReactNode): Deferred {
  if (!isValidElement(node) || typeof node.type !== "function") throw new Error("Missing server component");
  return node as Deferred;
}

function content() {
  const records = Array.from({ length: 6 }, (_, index) => ({
    id: `synthetic-${index}`, slug: `synthetic-${index}`, title: `Synthetic ${index}`, zakatEligible: false,
  }));
  vi.mocked(getReviewedDonationPageData).mockResolvedValueOnce(records as unknown as Awaited<ReturnType<typeof getReviewedDonationPageData>>);
  vi.mocked(getDonationCheckoutRemainingAmount).mockReturnValueOnce(null).mockReturnValue(100);
  const outer = Page() as ReactElement<{ children: ReactNode }>;
  return deferred(outer.props.children);
}

async function evidenceChild() {
  const node = content();
  const view = await node.type(node.props) as ReactElement<{ impactEvidence: ReactElement<{ children: ReactNode; fallback: ReactNode }> }>;
  expect(view.type).toBe(DonatePageView);
  expect(getDonationImpactHighlights).not.toHaveBeenCalled();
  expect(view.props.impactEvidence.type).toBe(Suspense);
  expect(view.props.impactEvidence.props.fallback).toBeNull();
  const evidence = deferred(view.props.impactEvidence.props.children);
  return evidence.type(evidence.props);
}

describe("/donate optional reviewed outcomes", () => {
  it("does not wait for optional evidence and retains the live balance guard and four-choice limit", async () => {
    let release!: (items: Awaited<ReturnType<typeof getDonationImpactHighlights>>) => void;
    vi.mocked(getDonationImpactHighlights).mockReturnValueOnce(new Promise(resolve => { release = resolve; }));
    const node = content();
    type View = ReactElement<{ choices: { id: string; maxAmount: number }[]; impactEvidence: ReactElement }>;
    const observed: { view: View | null } = { view: null };
    const pending = node.type(node.props).then(result => { observed.view = result as View | null; });
    try {
      await new Promise<void>(resolve => setImmediate(resolve));
      expect(observed.view).not.toBeNull();
      expect(observed.view!.type).toBe(DonatePageView);
      expect(getDonationImpactHighlights).not.toHaveBeenCalled();
      expect(getDonationCheckoutRemainingAmount).toHaveBeenCalledTimes(6);
      expect(observed.view!.props.choices.map(choice => choice.id)).toEqual(["synthetic-1", "synthetic-2", "synthetic-3", "synthetic-4"]);
      expect(observed.view!.props.choices.every(choice => choice.maxAmount === 100)).toBe(true);
      expect(observed.view!.props.impactEvidence.type).toBe(Suspense);
    } finally { release([]); await pending; }
  });

  it("streams only existing complete evidence records", async () => {
    vi.mocked(getDonationImpactHighlights).mockResolvedValueOnce([
      { slug: "synthetic", title: "Synthetic evidence", primaryMetric: "42", primaryMetricLabel: "reviewed units" },
      { slug: "missing", title: "Missing metric", primaryMetric: null, primaryMetricLabel: "units" },
    ] as Awaited<ReturnType<typeof getDonationImpactHighlights>>);
    const result = await evidenceChild() as ReactElement<{ items: unknown[]; headingId: string }>;
    expect(result.type).toBe(VerifiedImpactStrip);
    expect(result.props.headingId).toBe("donate-published-outcomes");
    expect(result.props.items).toEqual([{ slug: "synthetic", title: "Synthetic evidence", value: "42", label: "reviewed units" }]);
  });

  it("renders no empty or failed evidence claim and logs only the error class", async () => {
    vi.mocked(getDonationImpactHighlights).mockResolvedValueOnce([]);
    expect(await evidenceChild()).toBeNull();
    vi.mocked(getDonationImpactHighlights).mockClear();
    vi.mocked(getDonationImpactHighlights).mockRejectedValueOnce(new Error("synthetic private diagnostic"));
    expect(await evidenceChild()).toBeNull();
    expect(logServerError).toHaveBeenCalledWith("donation.published_impact_unavailable", { errorName: "Error" });
  });
});

describe("/donate appeal availability failure", () => {
  const renderLanding = async () => {
    const outer = Page() as ReactElement<{ children: ReactNode }>;
    const node = deferred(outer.props.children);
    return await node.type(node.props) as ReactElement<{ choices: unknown[]; appealsUnavailable: boolean; fundGivingEnabled: boolean }>;
  };

  it("keeps independent giving routes available without a checkout when the appeal lookup fails", async () => {
    vi.mocked(getReviewedDonationPageData).mockRejectedValueOnce(new Error("PRIVATE_SYNTHETIC_DIAGNOSTIC"));
    const result = await renderLanding();
    expect(result.type).toBe(DonatePageView);
    expect(result.props.choices).toEqual([]);
    expect(result.props.appealsUnavailable).toBe(true);
    expect(result.props.fundGivingEnabled).toBe(true);
    expect(getDonationCheckoutRemainingAmount).not.toHaveBeenCalled();
    expect(logServerError).toHaveBeenCalledExactlyOnceWith("donation.reviewed_appeals_unavailable");
  });

  it("distinguishes a successful empty lookup from an unavailable lookup", async () => {
    vi.mocked(getReviewedDonationPageData).mockResolvedValueOnce([]);
    const result = await renderLanding();
    expect(result.props.choices).toEqual([]);
    expect(result.props.appealsUnavailable).toBe(false);
    expect(logServerError).not.toHaveBeenCalled();
  });
});
