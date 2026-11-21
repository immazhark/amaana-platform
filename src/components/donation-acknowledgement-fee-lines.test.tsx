import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  current: undefined as unknown,
}));

const base = {
  found: true as const,
  presentation: { tone: "captured" as const, heading: "Donation received", summary: "Synthetic acknowledgement", statusLabel: "Payment verified" },
  donation: {
    referenceNumber: "AFD-SYNTHETIC-FEE", receiptNumber: "ACK-SYNTHETIC-FEE", donorName: "Synthetic Donor", givingIntent: "SADAQAH",
    amount: 5000, refundedAmount: 0, recordDate: "2026-11-18T10:00:00.000Z", providerPaymentId: "pay_synthetic",
    appeal: null, fund: { name: "Synthetic Fund", slug: "synthetic-fund" },
  },
};

vi.mock("next/link", () => ({ default: ({ children, href }: { children: ReactNode; href: string }) => createElement("a", { href }, children) }));
vi.mock("react", async importOriginal => ({
  ...await importOriginal<typeof import("react")>(),
  useState: (initial: unknown) => [initial === undefined ? fixture.current : initial, vi.fn()],
  useEffect: () => {},
}));

import { DonationAcknowledgementClient } from "./donation-acknowledgement-client";

const render = (donation: Record<string, unknown>) => {
  fixture.current = { ...base, donation: { ...base.donation, ...donation } };
  return renderToStaticMarkup(<DonationAcknowledgementClient reference={base.donation.referenceNumber} />);
};

beforeEach(() => { fixture.current = undefined; });

it("shows the covered payment fee and the total charged beside, not inside, the donation amount", () => {
  const html = render({ feeContributionAmount: 120.86 });
  expect(html).toContain("<dt>Original amount</dt><dd>₹5,000</dd>");
  expect(html).toContain("<dt>Payment fee you covered</dt><dd>₹120.86</dd>");
  expect(html).toContain("<dt>Total charged</dt><dd>₹5,120.86</dd>");
  expect(html).toContain("A refund returns that fee first");
});

it("adds no fee rows or fee note when no fee was covered", () => {
  for (const donation of [{}, { feeContributionAmount: 0 }]) {
    const html = render(donation);
    expect(html).not.toContain("Payment fee you covered");
    expect(html).not.toContain("Total charged");
    expect(html).not.toContain("A refund returns that fee first");
  }
});

it("names the seasonal initiative with the units and unit price the donor bought", () => {
  const html = render({ amount: 4500, campaign: { title: "Eid gift kits", units: 3, unitLabel: "kits", unitPrice: 1500 } });
  expect(html).toContain("<dt>Seasonal initiative</dt><dd>Eid gift kits: 3 kits × ₹1,500</dd>");
});

it("shows no seasonal-initiative row for an ordinary gift", () => {
  expect(render({ campaign: null })).not.toContain("Seasonal initiative");
  expect(render({})).not.toContain("Seasonal initiative");
});

it("keeps the refunded amount as the donation's own share and the fee note beside it", () => {
  const html = render({ feeContributionAmount: 120.86, refundedAmount: 5000 });
  expect(html).toContain("<dt>Refunded amount</dt><dd>₹5,000</dd>");
  expect(html).toContain("<dt>Total charged</dt><dd>₹5,120.86</dd>");
});
