import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ permission: vi.fn(), ledger: vi.fn(), report: vi.fn(), annual: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.permission }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/funds-ledger", () => ({ getFundsLedger: mocks.ledger }));
vi.mock("@/lib/taleem-sponsorship-report", () => ({ loadTaleemSponsorshipReport: mocks.report }));
vi.mock("@/lib/annual-finance-review", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/annual-finance-review")>(), loadAnnualFinanceBreakdown: mocks.annual }));

import FundsLedgerPage from "./page";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.permission.mockResolvedValue({ id: "synthetic-viewer" });
  mocks.ledger.mockResolvedValue({ funds: [], byFund: {}, zakatAccount: { receivedPaise: 0, pendingPaise: 0, refundedPaise: 0, spentPaise: 0, publishedSpentPaise: 0, balancePaise: 0 } });
  mocks.report.mockResolvedValue([]);
  mocks.annual.mockResolvedValue({ destinations: [], channels: [] });
});

describe("private Taleem reconciliation", () => {
  it("does not query the ledger or sponsorship report if viewing is denied", async () => {
    mocks.permission.mockRejectedValue(new Error("denied"));
    await expect(FundsLedgerPage({ searchParams: Promise.resolve({ fy: "2020-21" }) })).rejects.toThrow("denied");
    expect(mocks.permission).toHaveBeenCalledWith("donation.view");
    expect(mocks.ledger).not.toHaveBeenCalled();
    expect(mocks.report).not.toHaveBeenCalled();
    expect(mocks.annual).not.toHaveBeenCalled();
  });

  it("renders historic rates, retained principal and unverified claims separately", async () => {
    mocks.report.mockResolvedValue([
      { programme: "qaida", monthlyRate: 900, rateVersion: "historic", verifiedCount: 1, grossCaptured: 900, principalRefunded: 0, netRetained: 900, pendingCount: 0, pendingAmount: 0, verifiedQuotedUnitMonths: 1, retainedWholeUnitMonths: 1, retainedRemainder: 0, pendingQuotedUnitMonths: 0 },
      { programme: "qaida", monthlyRate: 1000, rateVersion: "current", verifiedCount: 3, grossCaptured: 3000, principalRefunded: 1100, netRetained: 1900, pendingCount: 1, pendingAmount: 3000, verifiedQuotedUnitMonths: 3, retainedWholeUnitMonths: 1, retainedRemainder: 900, pendingQuotedUnitMonths: 3 },
    ]);
    const html = renderToStaticMarkup(await FundsLedgerPage({ searchParams: Promise.resolve({ fy: "2020-21" }) }));
    expect(html).toContain("Taleem sponsorship reconciliation");
    expect(html).toContain("₹900 per unit/month · historic");
    expect(html).toContain("₹1,000 per unit/month · current");
    expect(html).toContain("<td>₹1,100</td><td>₹1,900</td><td>1</td><td>₹3,000</td>");
    expect(html).toContain("not student assignments");
    expect(html).toContain("Pending claims are not receipts");
    expect(html).toContain("Verified quoted unit-months");
    expect(html).toContain("Retained whole rate equivalents");
    expect(html).toContain("Pending quoted unit-months");
    expect(html).toContain("<td>₹3,000</td><td>3</td><td>1</td><td>₹900</td><td>3</td>");
    expect(html).toContain("not allocated places, unspent balances, fee coverage dates or available sponsorship capacity");
  });

  it("renders an explicit empty state", async () => {
    expect(renderToStaticMarkup(await FundsLedgerPage({ searchParams: Promise.resolve({ fy: "2020-21" }) }))).toContain("No verified sponsorship gifts or pending claims recorded.");
  });
});

describe("annual finance review", () => {
  it("selects an Indian financial year and exposes aggregate CSV only after authorization", async () => {
    mocks.annual.mockResolvedValue({ destinations: [{ destination: "fund", fundSlug: "taleem", pool: "ZAKAT", grossPaise: 10001, refundedPaise: 1, retainedPaise: 10000, pendingPaise: 0, pendingCount: 0, draftPaise: 0, publishedPaise: 1250 }], channels: [{ paymentMethod: "RAZORPAY", grossPaise: 10001, refundedPaise: 1, retainedPaise: 10000, pendingPaise: 0, pendingCount: 0 }] });
    const html = renderToStaticMarkup(await FundsLedgerPage({ searchParams: Promise.resolve({ fy: "2020-21" }) }));
    expect(mocks.annual).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ label: "2020-21", start: new Date("2020-03-31T18:30:00Z"), end: new Date("2021-03-31T18:30:00Z") }));
    expect(html).toContain("amaana-application-finance-review-2020-21.csv");
    expect(html).toContain("₹100.01");
    expect(html).toContain("not refund-date cash flows");
    expect(html).toContain("not bank statements, statutory tax filings");
    expect(html).not.toContain("donorEmail");
    expect(html).toContain("Payment channels · FY 2020-21");
    expect(html).toContain("<th scope=\"row\">Razorpay</th><td>₹100.01</td><td>₹0.01</td><td>₹100</td>");
    expect(html).toContain("Spending is not attributed to a channel.");
    expect(mocks.annual).toHaveBeenCalledTimes(1);
  });

  it("does not imply zero foundation activity when no matching records exist", async () => {
    const html = renderToStaticMarkup(await FundsLedgerPage({ searchParams: Promise.resolve({ fy: "2020-21" }) }));
    expect(html).toContain("This does not establish zero foundation activity.");
    expect(html).not.toContain("Download aggregate CSV");
    expect(html).toContain("No matching receipt or direct claim records for this year.");
  });
});
