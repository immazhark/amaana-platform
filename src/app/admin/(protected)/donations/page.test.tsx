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
  pendingReview: vi.fn(),
  logServerError: vi.fn(),
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

vi.mock("@/lib/pending-transfer-review", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/pending-transfer-review")>(), loadPendingTransferReview: mocks.pendingReview }));

vi.mock("@/lib/server-log", () => ({ logServerError: mocks.logServerError }));

import DonationsPage from "./page";

const money = (rupees: number) => ({ toNumber: () => rupees });
const reportRow = (paymentMethod: string | null, gross: number, refunded: number, pendingAmount = 0, pendingCount = 0) => ({
  paymentMethod, grossCaptured: money(gross), refunded: money(refunded), netRetained: money(gross - refunded),
  pendingAmount: money(pendingAmount), pendingCount: BigInt(pendingCount),
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("TZ", "UTC");
  mocks.permission.mockResolvedValue({ id: "synthetic-donation-viewer" });
  mocks.donationCount.mockResolvedValue(1);
  mocks.donationAggregate.mockResolvedValue({
    _sum: { amount: money(250), refundedAmount: money(0) },
  });
  mocks.donationTotalsQuery.mockResolvedValue([reportRow(null, 250, 0), reportRow("RAZORPAY", 250, 0)]);
  mocks.donationGroups.mockResolvedValue([]);
  mocks.paymentCount.mockResolvedValue(0);
  mocks.paymentFind.mockResolvedValue([]);
  mocks.pendingReview.mockResolvedValue([]);
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
    expect(mocks.pendingReview).not.toHaveBeenCalled();
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
    mocks.donationTotalsQuery.mockResolvedValue([reportRow(null, 200, 5), reportRow("RAZORPAY", 200, 5)]);
    const html = renderToStaticMarkup(await DonationsPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("Gross captured: ₹200");
    expect(html).toContain("Refunded: ₹5");
    expect(html).toContain("Net retained: ₹195");
    expect(html).toContain("Total returned (incl. fees)");
    expect(html).not.toContain("Net retained: ₹188");
  });
});

describe("private payment channel reconciliation", () => {
  it("reports verified principal and unverified claims separately and links to filtered records", async () => {
    mocks.donationFind.mockResolvedValue([]);
    mocks.donationTotalsQuery.mockResolvedValue([
      reportRow(null, 500, 105, 230, 2),
      reportRow("RAZORPAY", 300, 105),
      reportRow("DIRECT_UPI", 200, 0, 80, 1),
      reportRow("BANK_TRANSFER", 0, 0, 150, 1),
    ]);
    const html = renderToStaticMarkup(await DonationsPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("Payment channel reconciliation");
    expect(html).toContain("not bank balances or provider settlement statements");
    expect(html).toContain('href="/admin/donations?method=BANK_TRANSFER&amp;status=PENDING_VERIFICATION"');
    expect(html).toContain('href="/admin/donations?method=DIRECT_UPI&amp;status=PENDING_VERIFICATION"');
    expect(html).toContain("Net retained: ₹395");
    expect(html).toContain("₹230");
    expect(mocks.donationTotalsQuery).toHaveBeenCalledOnce();
  });

  it("preserves method and status filters in the record scope, counts and pagination without filtering the global report", async () => {
    mocks.donationFind.mockResolvedValue([]);
    mocks.donationGroups.mockImplementation(async (args: { by: string[] }) => args.by.includes("givingIntent") ? [
      { status: "PENDING_VERIFICATION", givingIntent: "SADAQAH", _count: { _all: 101 } },
      { status: "CAPTURED", givingIntent: "SADAQAH", _count: { _all: 4 } },
      { status: "PENDING_VERIFICATION", givingIntent: "GENERAL", _count: { _all: 5 } },
    ] : []);
    const html = renderToStaticMarkup(await DonationsPage({ searchParams: Promise.resolve({ method: "BANK_TRANSFER", status: "PENDING_VERIFICATION", intent: "SADAQAH", page: "2" }) }));
    const where = { paymentMethod: "BANK_TRANSFER", status: "PENDING_VERIFICATION", givingIntent: "SADAQAH" };
    expect(mocks.donationFind).toHaveBeenCalledWith(expect.objectContaining({ where, skip: 50, take: 50 }));
    expect(mocks.donationCount).toHaveBeenCalledTimes(2);
    expect(mocks.donationGroups).toHaveBeenCalledWith({ by: ["status", "givingIntent"], where: { paymentMethod: "BANK_TRANSFER" }, _count: { _all: true } });
    expect(mocks.donationGroups).toHaveBeenCalledTimes(2); // joint filters and global outcome cohort
    expect(html).toContain("Page 2 of 3 · 101 records");
    expect(html).toContain("CAPTURED (4)");
    expect(html).toContain("PENDING_VERIFICATION (101)");
    expect(html).toContain('href="/admin/donations?status=PENDING_VERIFICATION&amp;intent=SADAQAH&amp;method=BANK_TRANSFER&amp;page=3"');
    expect(html).toContain('href="/admin/donations?status=PENDING_VERIFICATION&amp;intent=SADAQAH&amp;method=DIRECT_UPI"');
    expect(html).toContain('href="/admin/donations?method=RAZORPAY"');
    expect(mocks.donationTotalsQuery).toHaveBeenCalledOnce();
  });

  it.each(["unknown", "razorpay", ["DIRECT_UPI", "BANK_TRANSFER"]])("ignores unsupported payment method %s", async method => {
    mocks.donationFind.mockResolvedValue([]);
    await DonationsPage({ searchParams: Promise.resolve({ method: method as string }) });
    expect(mocks.donationFind).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });
});

describe("direct transfer review workbench", () => {
  it("shows claim age and oldest-first review links without promising a verification time", async () => {
    mocks.donationFind.mockResolvedValue([]);
    mocks.pendingReview.mockResolvedValue([{ paymentMethod: "DIRECT_UPI", underDay: 1, oneToSevenDays: 2, overSevenDays: 3, future: 1, total: 7 }]);
    const html = renderToStaticMarkup(await DonationsPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("Direct-transfer review workbench");
    expect(html).toContain("Future timestamp");
    expect(html).toContain("7 pending, oldest first");
    expect(html).toContain('href="/admin/donations?method=DIRECT_UPI&amp;status=PENDING_VERIFICATION&amp;sort=oldest"');
    expect(html).toContain("not the bank credit date or a promised verification time");
  });
  it("uses the exact reference and preserves sorting and filters", async () => {
    mocks.donationFind.mockResolvedValue([]);
    const html = renderToStaticMarkup(await DonationsPage({ searchParams: Promise.resolve({ reference: "afd-2026-12345678", status: "PENDING_VERIFICATION", method: "BANK_TRANSFER", sort: "oldest" }) }));
    expect(mocks.donationFind).toHaveBeenCalledWith(expect.objectContaining({ where: { referenceNumber: "AFD-2026-12345678", status: "PENDING_VERIFICATION", paymentMethod: "BANK_TRANSFER" }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] }));
    expect(mocks.donationGroups).toHaveBeenCalledWith({ by: ["status", "givingIntent"], where: { referenceNumber: "AFD-2026-12345678", paymentMethod: "BANK_TRANSFER" }, _count: { _all: true } });
    expect(mocks.donationCount).toHaveBeenCalledTimes(2);
    expect(html).toContain("reference=AFD-2026-12345678");
    expect(html).toContain("sort=oldest");
    expect(html).toContain("Clear reference lookup");
  });
  it("does not broaden invalid reference lookup or render raw input", async () => {
    mocks.donationFind.mockResolvedValue([]);
    for (const reference of [["AFD-2026-12345678"], "private@example.test", "AFD-2026-12345678#token=private"]) {
      const html = renderToStaticMarkup(await DonationsPage({ searchParams: Promise.resolve({ reference }) }));
      expect(mocks.donationFind).toHaveBeenLastCalledWith(expect.objectContaining({ where: { id: { in: [] } } }));
      expect(html).toContain("No records were matched.");
      expect(html).not.toContain("private@example.test");
      expect(html).not.toContain("#token=private");
    }
  });
});

describe("operational reconciliation exception drill-down", () => {
  it("links the global counters directly to the corresponding oldest-first record queues", async () => {
    mocks.donationFind.mockResolvedValue([]);
    const html = renderToStaticMarkup(await DonationsPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain('href="/admin/donations?issue=missing-acknowledgement&amp;sort=oldest"');
    expect(html).toContain('href="/admin/donations?issue=missing-refund-time&amp;sort=oldest"');
    expect(html).toContain("may overlap; they do not count distinct affected donations");
  });
  it.each([
    ["missing-acknowledgement", { status: { in: ["CAPTURED", "REFUNDED"] }, receiptNumber: null }],
    ["missing-refund-time", { status: "REFUNDED", refundedAt: null }],
  ] as const)("intersects %s with existing filters and uses the same predicate for global counts", async (issue, predicate) => {
    mocks.donationFind.mockResolvedValue([]);
    const status = issue === "missing-refund-time" ? "REFUNDED" : "CAPTURED";
    mocks.donationGroups.mockImplementation(async (args: { by: string[] }) => args.by.includes("givingIntent") ? [
      { status, givingIntent: "SADAQAH", _count: { _all: 101 } },
    ] : []);
    const html = renderToStaticMarkup(await DonationsPage({ searchParams: Promise.resolve({ issue, status, method: "BANK_TRANSFER", intent: "SADAQAH", reference: "AFD-2026-12345678", sort: "oldest", page: "2" }) }));
    const scope = { paymentMethod: "BANK_TRANSFER", referenceNumber: "AFD-2026-12345678", AND: [predicate] };
    const where = { ...scope, status, givingIntent: "SADAQAH" };
    expect(mocks.donationFind).toHaveBeenCalledWith(expect.objectContaining({ where, orderBy: [{ createdAt: "asc" }, { id: "asc" }], skip: 50, take: 50 }));
    expect(mocks.donationCount).toHaveBeenCalledTimes(2);
    expect(mocks.donationCount).toHaveBeenCalledWith({ where: predicate });
    expect(mocks.donationGroups).toHaveBeenCalledWith({ by: ["status", "givingIntent"], where: scope, _count: { _all: true } });
    expect(html).toContain(`name="issue" value="${issue}"`);
    expect(html).toContain(`issue=${issue}&amp;page=3`);
    expect(html).toContain("Clear exception review");
    expect(mocks.donationTotalsQuery).toHaveBeenCalledOnce();
  });
  it("does not broaden or reflect invalid selectors when navigating or searching", async () => {
    mocks.donationFind.mockResolvedValue([]);
    const html = renderToStaticMarkup(await DonationsPage({ searchParams: Promise.resolve({ issue: ["missing-refund-time", "private@example.invalid"], reference: "private-bank-token" }) }));
    expect(mocks.donationFind).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: [] }, AND: [{ id: { in: [] } }] } }));
    expect(html).toContain("Unsupported review filter. No records were matched.");
    expect(html).toContain("issue=invalid");
    expect(html).toContain("reference=invalid");
    expect(html).not.toContain("private@example.invalid");
    expect(html).not.toContain("private-bank-token");
  });
});

describe("independent donation report failures", () => {
  const record = () => [{
    id: "synthetic-report-record", referenceNumber: "SYNTHETIC-REPORT-RECORD", donorName: "Synthetic donor", donorEmail: "synthetic@example.invalid",
    givingIntent: "GENERAL", paymentMethod: "DIRECT_UPI", amount: money(250), refundedAmount: money(0), status: "CAPTURED",
    createdAt: new Date("2026-11-10T00:00:00.000Z"), appeal: null, fund: null,
  }];
  it("keeps individual records and exception counts when reconciliation fails, without inventing financial totals", async () => {
    mocks.donationTotalsQuery.mockRejectedValueOnce(new Error("PRIVATE_SYNTHETIC_DIAGNOSTIC"));
    mocks.donationCount.mockResolvedValue(0);
    mocks.donationFind.mockResolvedValue(record());
    const html = renderToStaticMarkup(await DonationsPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("SYNTHETIC-REPORT-RECORD");
    expect(html).toContain("Financial summary temporarily unavailable");
    expect(html).toContain("Payment channel report temporarily unavailable");
    expect(html).toContain("REVIEW INCOMPLETE");
    expect(html).not.toContain("HEALTHY");
    expect(html).not.toContain("Gross captured: ₹0");
    expect(html).not.toContain("Payment channel reconciliation totals");
    expect(html).not.toContain("PRIVATE_SYNTHETIC_DIAGNOSTIC");
    expect(mocks.logServerError).toHaveBeenCalledExactlyOnceWith("donation.reconciliation_report_unavailable");
  });
  it("keeps financial figures, known warnings and transfer drill-down when ancillary reports fail", async () => {
    mocks.pendingReview.mockRejectedValueOnce(new Error("PRIVATE_SYNTHETIC_DIAGNOSTIC"));
    mocks.donationGroups.mockImplementation(async (args: { by: string[] }) => {
      if (args.by.includes("paymentMethod")) throw new Error("PRIVATE_SYNTHETIC_DIAGNOSTIC");
      return [];
    });
    mocks.donationFind.mockResolvedValue(record());
    const html = renderToStaticMarkup(await DonationsPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("SYNTHETIC-REPORT-RECORD");
    expect(html).toContain("Gross captured: ₹250");
    expect(html).toContain("NEED ATTENTION");
    expect(html).toContain("Transfer age report temporarily unavailable");
    expect(html).toContain("Donation outcomes report temporarily unavailable");
    expect(html).not.toContain("No donations were started in this period.");
    expect(html).not.toContain("PRIVATE_SYNTHETIC_DIAGNOSTIC");
    expect(html).toContain('href="/admin/donations?method=BANK_TRANSFER&amp;status=PENDING_VERIFICATION&amp;sort=oldest"');
    expect(mocks.logServerError).toHaveBeenCalledTimes(2);
    expect(mocks.logServerError).toHaveBeenCalledWith("donation.pending_transfer_report_unavailable");
    expect(mocks.logServerError).toHaveBeenCalledWith("donation.outcomes_report_unavailable");
  });
  it("still propagates a failed core queue read rather than inventing an empty queue", async () => {
    mocks.donationGroups.mockImplementation(async (args: { by: string[] }) => {
      if (args.by.includes("givingIntent")) throw new Error("core queue unavailable");
      return [];
    });
    await expect(DonationsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("core queue unavailable");
    expect(mocks.donationFind).not.toHaveBeenCalled();
  });
  it("still propagates a failed critical event count rather than reporting health", async () => {
    mocks.paymentCount.mockRejectedValueOnce(new Error("critical evidence unavailable"));
    await expect(DonationsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("critical evidence unavailable");
    expect(mocks.donationFind).not.toHaveBeenCalled();
  });
});

describe("joint scoped donation counts", () => {
  it("clamps an incompatible exception and status to zero without broadening the scope", async () => {
    mocks.donationFind.mockResolvedValue([]);
    mocks.donationGroups.mockImplementation(async (args: { by: string[] }) => args.by.includes("givingIntent") ? [
      { status: "REFUNDED", givingIntent: "GENERAL", _count: { _all: 60 } },
    ] : []);
    const html = renderToStaticMarkup(await DonationsPage({ searchParams: Promise.resolve({ issue: "missing-refund-time", status: "CAPTURED", page: "3" }) }));
    const scope = { AND: [{ status: "REFUNDED", refundedAt: null }] };
    expect(mocks.donationGroups).toHaveBeenCalledWith({ by: ["status", "givingIntent"], where: scope, _count: { _all: true } });
    expect(mocks.donationFind).toHaveBeenCalledWith(expect.objectContaining({ where: { ...scope, status: "CAPTURED" }, skip: 0, take: 50 }));
    expect(html).toContain("Page 1 of 1 · 0 records");
    expect(html).toContain("REFUNDED (60)");
    expect(mocks.donationCount).toHaveBeenCalledTimes(2);
  });
});
