import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  found: true as const,
  presentation: {
    tone: "captured" as const,
    heading: "Donation received",
    summary: "Synthetic acknowledgement",
    statusLabel: "Payment verified",
  },
  donation: {
    referenceNumber: "AFD-SYNTHETIC-IST",
    receiptNumber: "ACK-SYNTHETIC-IST",
    donorName: "Synthetic Donor",
    givingIntent: "GENERAL",
    amount: 500,
    refundedAmount: 0,
    recordDate: "2026-10-26T19:00:00.000Z",
    providerPaymentId: "pay_synthetic",
    appeal: { title: "Synthetic appeal", slug: "synthetic-appeal" },
  },
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) =>
    createElement("a", { href }, children),
}));
vi.mock("react", async importOriginal => ({
  ...await importOriginal<typeof import("react")>(),
  useState: (initial: unknown) => [initial === undefined ? { reference: fixture.donation.referenceNumber, record: fixture } : initial, vi.fn()],
  useEffect: () => {},
}));

import { DonationAcknowledgementClient } from "./donation-acknowledgement-client";

it("displays the India record date on a UTC device without changing the private transaction", () => {
  const dateSpy = vi.spyOn(Date.prototype, "toLocaleDateString").mockImplementation(function (
    this: Date, locales, options,
  ) {
    return new Intl.DateTimeFormat(locales, { ...options, timeZone: options?.timeZone ?? "UTC" }).format(this);
  });
  try {
    const html = renderToStaticMarkup(<DonationAcknowledgementClient reference={fixture.donation.referenceNumber} />);
    expect(html).toContain("<dt>Record date</dt><dd>27 October 2026</dd>");
    expect(html).not.toContain("<dt>Record date</dt><dd>26 October 2026</dd>");
    expect(html).toContain(fixture.donation.referenceNumber);
  } finally {
    dateSpy.mockRestore();
  }
});
