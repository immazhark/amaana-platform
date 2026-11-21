import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({ current: undefined as unknown }));

const base = {
  found: true as const,
  presentation: { tone: "captured" as const, heading: "Donation received", summary: "Synthetic acknowledgement", statusLabel: "Payment verified" },
  donation: {
    referenceNumber: "AFD-SYNTHETIC-TALEEM", receiptNumber: "ACK-SYNTHETIC-TALEEM", donorName: "Synthetic Donor", givingIntent: "SADAQAH",
    amount: 14_400, refundedAmount: 0, recordDate: "2026-11-18T10:00:00.000Z", providerPaymentId: "pay_synthetic",
    appeal: null, fund: { name: "Taleem Fund", slug: "taleem" },
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

it("shows the programme, units, months and rate recorded on the donation", () => {
  const html = render({ sponsorship: { programme: "Nazira", units: 2, months: 6, monthlyRate: 1200 } });
  expect(html).toContain("<dt>Programme sponsorship</dt>");
  expect(html).toContain("Nazira: 2 units × 6 months × ₹1,200 a month");
});

it("uses singular wording for one unit and one month", () => {
  const html = render({ amount: 1000, sponsorship: { programme: "Qaida", units: 1, months: 1, monthlyRate: 1000 } });
  expect(html).toContain("Qaida: 1 unit × 1 month × ₹1,000 a month");
});

it("says the gift supports the programme, is not a named student, and is not a subscription", () => {
  const html = render({ sponsorship: { programme: "Nazira", units: 2, months: 6, monthlyRate: 1200 } });
  expect(html).toMatch(/supports the Taleem programme, not a named or reserved student/);
  expect(html).toMatch(/paid once and is not a monthly subscription/);
});

it("adds nothing for an ordinary gift", () => {
  for (const donation of [{}, { sponsorship: null }]) {
    const html = render(donation);
    expect(html).not.toContain("Programme sponsorship");
    expect(html).not.toContain("named or reserved student");
  }
});
