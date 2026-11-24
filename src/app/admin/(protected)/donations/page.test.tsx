import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  permission: vi.fn(),
  donationCount: vi.fn(),
  donationAggregate: vi.fn(),
  donationTotalsQuery: vi.fn(),
  donationFind: vi.fn(),
  donationGroups: vi.fn(),
  paymentCount: vi.fn(),
  paymentFind: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requirePermission: mocks.permission }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: mocks.donationTotalsQuery,
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
  mocks.donationTotalsQuery.mockResolvedValue([{ grossCaptured: money(250), refunded: money(0), netRetained: money(250) }]);
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
    expect(mocks.donationTotalsQuery).not.toHaveBeenCalled();
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

describe("admin Donations minimum displayed-row projection", () => {
  it("reads only visible donation fields and the linked appeal title", async () => {
    mocks.donationFind.mockResolvedValueOnce([{
      id: "synthetic-donation-row",
      referenceNumber: "SYNTHETIC-PROJECTION-1",
      donorName: "Synthetic donation viewer",
      donorEmail: "synthetic@example.invalid",
      appeal: { title: "Synthetic appeal" },
      givingIntent: "GENERAL",
      paymentMethod: "DIRECT_UPI",
      amount: money(300),
      refundedAmount: money(0),
      status: "CAPTURED",
      createdAt: new Date("2026-11-10T00:00:00Z"),
    }]);

    const html = renderToStaticMarkup(await DonationsPage({ searchParams: Promise.resolve({}) }));

    expect(mocks.permission).toHaveBeenCalledWith("donation.view");
    expect(mocks.donationFind).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      select: {
        id: true,
        referenceNumber: true,
        donorName: true,
        donorEmail: true,
        givingIntent: true,
        paymentMethod: true,
        amount: true,
        refundedAmount: true,
        status: true,
        createdAt: true,
        appeal: { select: { title: true } },
        fund: { select: { name: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }));
    expect(html).toContain("SYNTHETIC-PROJECTION-1");
    expect(html).toContain("Synthetic donation viewer");
    expect(html).toContain("Synthetic appeal");
    expect(html).toContain("Direct UPI");
  });
});

describe("admin donation outcomes card", () => {
  const render = async () => renderToStaticMarkup(await DonationsPage({ searchParams: Promise.resolve({}) }));
  const funnelCall = () => mocks.donationGroups.mock.calls.map(call => call[0]).find(args => Array.isArray(args.by) && args.by.includes("paymentMethod"));

  it("asks the database only for counts by payment method and status over the last 90 days", async () => {
    const before = Date.now();
    mocks.donationFind.mockResolvedValue([]);
    await render();
    const args = funnelCall();
    expect(args.by).toEqual(["paymentMethod", "status"]);
    expect(args._count).toEqual({ _all: true });
    expect(Object.keys(args).sort()).toEqual(["_count", "by", "where"]);
    const since = (args.where.createdAt.gte as Date).getTime();
    expect(before - since).toBeGreaterThanOrEqual(90 * 24 * 60 * 60 * 1000 - 1000);
    expect(before - since).toBeLessThanOrEqual(90 * 24 * 60 * 60 * 1000 + 60_000);
  });

  it("shows confirmed outcomes per method and hides small counts instead of printing them", async () => {
    mocks.donationFind.mockResolvedValue([]);
    mocks.donationGroups.mockImplementation(async (args: { by: string[] }) => args.by.includes("paymentMethod") ? [
      { paymentMethod: "RAZORPAY", status: "CAPTURED", _count: { _all: 40 } },
      { paymentMethod: "RAZORPAY", status: "FAILED", _count: { _all: 10 } },
      { paymentMethod: "DIRECT_UPI", status: "CAPTURED", _count: { _all: 2 } },
      { paymentMethod: "DIRECT_UPI", status: "PENDING_VERIFICATION", _count: { _all: 20 } },
    ] : []);
    const html = await render();
    expect(html).toContain("Donation outcomes, last 90 days");
    expect(html).toContain("Online (Razorpay)");
    expect(html).toContain("Direct UPI transfer");
    expect(html).toContain(">40<");
    expect(html).toContain("withheld<span class=\"sr-only\"> to protect small counts</span>");
    expect(html).toContain("This does not show where donors came from.");
    expect(html).not.toContain("All methods");
  });

  it("says plainly when nothing was started in the period", async () => {
    mocks.donationFind.mockResolvedValue([]);
    expect(await render()).toContain("No donations were started in this period.");
  });
});

describe("admin donation summary excludes refunded processing fees", () => {
  it("reports retained charitable principal, not gross provider refunds", async () => {
    // Two INR 100 gifts. The first refunds INR 5 of INR 12 covered fee;
    // the second refunds INR 7 including INR 2 covered fee. Only INR 5
    // reduces the donations themselves.
    mocks.donationFind.mockResolvedValue([]);
    mocks.donationAggregate.mockResolvedValue({ _sum: { amount: money(200), refundedAmount: money(12) } });
    mocks.donationTotalsQuery.mockResolvedValue([{ grossCaptured: money(200), refunded: money(5), netRetained: money(195) }]);
    const html = renderToStaticMarkup(await DonationsPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("Gross captured: ₹200");
    expect(html).toContain("Refunded: ₹5");
    expect(html).toContain("Net retained: ₹195");
    expect(html).not.toContain("Net retained: ₹188");
  });
});
