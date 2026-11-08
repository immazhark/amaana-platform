import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  permission: vi.fn(),
  donationCount: vi.fn(),
  donationAggregate: vi.fn(),
  donationFind: vi.fn(),
  donationGroups: vi.fn(),
  paymentCount: vi.fn(),
  paymentFind: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requirePermission: mocks.permission }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    donation: {
      count: mocks.donationCount,
      aggregate: mocks.donationAggregate,
      findMany: mocks.donationFind,
      groupBy: mocks.donationGroups,
    },
    paymentEvent: { count: mocks.paymentCount, findMany: mocks.paymentFind },
  },
}));

import DonationsPage from "./page";

const money = (rupees: number) => ({ toNumber: () => rupees });

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("TZ", "UTC");
  mocks.permission.mockResolvedValue({ id: "synthetic-donation-viewer" });
  mocks.donationCount.mockResolvedValue(1);
  mocks.donationAggregate.mockResolvedValue({
    _sum: { amount: money(250), refundedAmount: money(0) },
  });
  mocks.donationGroups.mockResolvedValue([]);
  mocks.paymentCount.mockResolvedValue(0);
  mocks.paymentFind.mockResolvedValue([]);
});

afterEach(() => vi.unstubAllEnvs());

describe("admin donation list IST dates", () => {
  it.each([
    ["2026-12-31T18:29:59.000Z", "31/12/2026"],
    ["2026-12-31T18:30:00.000Z", "1/1/2027"],
    ["2026-12-31T18:35:00.000Z", "1/1/2027"],
  ])("renders bank-day date for UTC timestamp %s as %s when the server is UTC", async (iso, expected) => {
    mocks.donationFind.mockResolvedValueOnce([{
      id: "synthetic-donation",
      referenceNumber: "SYNTHETIC-IST-01",
      donorName: "Synthetic donor",
      donorEmail: "synthetic@example.invalid",
      appeal: { title: "Synthetic appeal" },
      givingIntent: "GENERAL",
      paymentMethod: "BANK_TRANSFER",
      amount: money(250),
      refundedAmount: money(0),
      status: "CAPTURED",
      createdAt: new Date(iso),
    }]);

    const markup = renderToStaticMarkup(await DonationsPage({ searchParams: Promise.resolve({}) }));

    expect(markup).toContain("<td>" + expected + "</td>");
    expect(mocks.permission).toHaveBeenCalledWith("donation.view");
  });

  it("rejects an unauthorised viewer before querying donor details", async () => {
    mocks.permission.mockRejectedValueOnce(new Error("donation.view permission required"));
    await expect(DonationsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("donation.view permission required");
    expect(mocks.donationCount).not.toHaveBeenCalled();
    expect(mocks.donationFind).not.toHaveBeenCalled();
    expect(mocks.paymentFind).not.toHaveBeenCalled();
  });
});


describe("unmatched critical provider event IST audit time", () => {
  it.each([
    ["2026-12-31T18:29:59.000Z", "31/12/2026"],
    ["2026-12-31T18:30:00.000Z", "1/1/2027"],
    ["2026-12-31T18:35:00.000Z", "1/1/2027"],
  ])("shows unmatched captured event %s under India date %s on a UTC server", async (utc, date) => {
    mocks.donationFind.mockResolvedValueOnce([]);
    mocks.paymentCount.mockResolvedValueOnce(1);
    mocks.paymentFind.mockResolvedValueOnce([{
      id: "synthetic-event",
      providerEventId: "synthetic-evt-id",
      eventType: "payment.captured",
      processedAt: new Date(utc),
    }]);

    const html = renderToStaticMarkup(await DonationsPage({ searchParams: Promise.resolve({}) }));

    expect(html).toContain("Unmatched payment events");
    expect(html).toContain("synthetic-evt-id");
    expect(html).toContain("<span>" + date);
    expect(mocks.permission).toHaveBeenCalledWith("donation.view");
  });
});
