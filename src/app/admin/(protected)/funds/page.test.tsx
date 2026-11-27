import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ permission: vi.fn(), ledger: vi.fn(), report: vi.fn(), annual: vi.fn(), log: vi.fn() }));
vi.mock("@/lib/server-log", () => ({ logServerError: mocks.log }));
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
  mocks.annual.mockResolvedValue({ destinations: [], channels: [], byDestinationAndChannel: [] });
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

  it("selects a separate sponsorship financial year and preserves the annual report selection", async () => {
    const html = renderToStaticMarkup(await FundsLedgerPage({ searchParams: Promise.resolve({ fy: "2020-21", taleemFy: "2021-22" }) }));
    expect(mocks.report).toHaveBeenCalledExactlyOnceWith(expect.anything(), expect.objectContaining({ label: "2021-22", start: new Date("2021-03-31T18:30:00Z"), end: new Date("2022-03-31T18:30:00Z") }));
    expect(mocks.annual).toHaveBeenCalledExactlyOnceWith(expect.anything(), expect.objectContaining({ label: "2020-21" }));
    expect(html).toContain('name="fy" value="2020-21"');
    expect(html).toContain('name="taleemFy" value="2021-22"');
    expect(html).toContain("No matching verified sponsorship gifts or pending claims for FY 2021-22.");
    expect(html).toContain("not refund-date cash flows");
  });

  it("uses the labelled all-time scope for absent, repeated or unknown sponsorship selectors", async () => {
    for (const taleemFy of [undefined, ["2021-22", "2020-21"], "PRIVATE_SYNTHETIC_INVALID"]) {
      mocks.report.mockClear();
      const html = renderToStaticMarkup(await FundsLedgerPage({ searchParams: Promise.resolve({ fy: "2020-21", taleemFy }) }));
      expect(mocks.report).toHaveBeenCalledExactlyOnceWith(expect.anything(), undefined);
      expect(html).toContain("All recorded dates");
      expect(html).not.toContain("PRIVATE_SYNTHETIC_INVALID");
    }
  });

  it("renders an explicit empty state", async () => {
    expect(renderToStaticMarkup(await FundsLedgerPage({ searchParams: Promise.resolve({ fy: "2020-21" }) }))).toContain("No verified sponsorship gifts or pending claims recorded.");
  });
});

describe("annual finance review", () => {
  it("selects an Indian financial year and exposes aggregate CSV only after authorization", async () => {
    mocks.annual.mockResolvedValue({ destinations: [{ destination: "fund", fundSlug: "taleem", pool: "ZAKAT", grossPaise: 10001, refundedPaise: 1, retainedPaise: 10000, pendingPaise: 0, pendingCount: 0, draftPaise: 0, publishedPaise: 1250 }], channels: [{ paymentMethod: "RAZORPAY", grossPaise: 10001, refundedPaise: 1, retainedPaise: 10000, pendingPaise: 0, pendingCount: 0 }], byDestinationAndChannel: [{ destination: "fund", fundSlug: "taleem", pool: "ZAKAT", paymentMethod: "RAZORPAY", grossPaise: 10001, refundedPaise: 1, retainedPaise: 10000, pendingPaise: 0, pendingCount: 0 }] });
    const html = renderToStaticMarkup(await FundsLedgerPage({ searchParams: Promise.resolve({ fy: "2020-21" }) }));
    expect(mocks.annual).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ label: "2020-21", start: new Date("2020-03-31T18:30:00Z"), end: new Date("2021-03-31T18:30:00Z") }));
    expect(html).toContain("amaana-application-finance-review-2020-21.csv");
    expect(html).toContain('aria-labelledby="annual-finance-heading"');
    expect(html).toContain('id="annual-finance-heading">Financial-year reconciliation review</h2>');
    expect(html).toContain('role="region" aria-label="Financial-year destination totals"');
    expect(html).not.toContain('aria-label="Financial-year reconciliation review"');
    expect(html).toContain("₹100.01");
    expect(html).toContain("not refund-date cash flows");
    expect(html).toContain("not bank statements, statutory tax filings");
    expect(html).not.toContain("donorEmail");
    expect(html).toContain("Payment channels · FY 2020-21");
    expect(html).toContain("<th scope=\"row\">Razorpay</th><td>₹100.01</td><td>₹0.01</td><td>₹100</td>");
    expect(html).toContain("Spending is not attributed to a channel.");
    expect(html).toContain("amaana-application-channel-review-2020-21.csv");
    expect(html).toContain("Financial-year destination and channel reconciliation");
    expect(html).toContain("same receipts and claims, not additional income");
    expect(html).toContain("<td>Razorpay</td><td>₹100.01</td><td>₹0.01</td><td>₹100</td>");
    expect(mocks.annual).toHaveBeenCalledTimes(1);
  });

  it("does not imply zero foundation activity when no matching records exist", async () => {
    const html = renderToStaticMarkup(await FundsLedgerPage({ searchParams: Promise.resolve({ fy: "2020-21" }) }));
    expect(html).toContain("This does not establish zero foundation activity.");
    expect(html).not.toContain("Download aggregate CSV");
    expect(html).not.toContain("Download destination and channel CSV");
    expect(html).toContain("No matching receipt or claim intersections for this year.");
    expect(html).toContain("No matching receipt or direct claim records for this year.");
  });
});

describe("independent private report availability", () => {
  const render = async () => renderToStaticMarkup(await FundsLedgerPage({ searchParams: Promise.resolve({ fy: "2020-21" }) }));
  const row = { destination: "fund", fundSlug: "taleem", pool: "NON_ZAKAT", grossPaise: 101, refundedPaise: 1, retainedPaise: 100, pendingPaise: 200, pendingCount: 1, draftPaise: 12, publishedPaise: 30 };
  it("shows annual control totals and keeps annual export available when sponsorship reporting fails", async () => {
    mocks.report.mockRejectedValueOnce(new Error("PRIVATE_SYNTHETIC_REPORT"));
    mocks.annual.mockResolvedValueOnce({ destinations: [row, { ...row, fundSlug: "other" }], channels: [], byDestinationAndChannel: [] });
    const html = await render();
    expect(html).toContain("Taleem sponsorship report temporarily unavailable");
    expect(html).toContain("Download aggregate CSV");
    expect(html).toContain('<th scope="row">All destinations · control total</th><td>₹2.02</td><td>₹0.02</td><td>₹2</td><td>2</td><td>₹4</td><td>₹0.24</td><td>₹0.6</td>');
    expect(html).not.toContain("PRIVATE_SYNTHETIC_REPORT");
    expect(mocks.log).toHaveBeenCalledExactlyOnceWith("finance.taleem_report_unavailable");
    expect(mocks.annual).toHaveBeenCalledTimes(1);
  });
  it("does not display empty or downloadable annual reports on failure, preserving the other ledger sections", async () => {
    mocks.annual.mockRejectedValueOnce(new Error("PRIVATE_SYNTHETIC_ANNUAL"));
    const html = await render();
    expect(html).toContain("Financial-year report temporarily unavailable");
    expect(html).toContain("Payment-channel report temporarily unavailable");
    expect(html).toContain("Destination and channel report temporarily unavailable");
    expect(html).not.toContain("Download aggregate CSV");
    expect(html).not.toContain("No matching application records");
    expect(html).not.toContain("PRIVATE_SYNTHETIC_ANNUAL");
    expect(html).toContain("All Zakat received");
    expect(html).toContain("No verified sponsorship gifts or pending claims recorded.");
    expect(mocks.log).toHaveBeenCalledExactlyOnceWith("finance.annual_report_unavailable");
  });
  it("withholds all annual sections if aggregate control totals overflow", async () => {
    mocks.annual.mockResolvedValueOnce({ destinations: [{ ...row, grossPaise: Number.MAX_SAFE_INTEGER }, row], channels: [], byDestinationAndChannel: [] });
    const html = await render();
    expect(html).toContain("Financial-year report temporarily unavailable");
    expect(html).not.toContain("Download aggregate CSV");
    expect(mocks.log).toHaveBeenCalledExactlyOnceWith("finance.annual_report_unavailable");
  });
  it("withholds failed all-time ledger balances without losing independently available reports", async () => {
    mocks.ledger.mockRejectedValueOnce(new Error("PRIVATE_SYNTHETIC_LEDGER"));
    mocks.annual.mockResolvedValueOnce({ destinations: [row], channels: [], byDestinationAndChannel: [] });
    const html = await render();
    expect(html).toContain("All-time ledger temporarily unavailable");
    expect(html).not.toContain("All Zakat received");
    expect(html).not.toContain("Zakat balance still to distribute");
    expect(html).toContain("Download aggregate CSV");
    expect(html).toContain("No verified sponsorship gifts or pending claims recorded.");
    expect(html).not.toContain("PRIVATE_SYNTHETIC_LEDGER");
    expect(mocks.log).toHaveBeenCalledExactlyOnceWith("finance.funds_ledger_unavailable");
  });
});

describe("Taleem aggregate accountant export", () => {
  const cohort = { programme: "qaida", monthlyRate: 900, rateVersion: "historic", verifiedCount: 2, grossCaptured: 1800, principalRefunded: 0.01, netRetained: 1799.99, pendingCount: 1, pendingAmount: 900, verifiedQuotedUnitMonths: 2, retainedWholeUnitMonths: 1, retainedRemainder: 899.99, pendingQuotedUnitMonths: 1 };
  it("exports the selected scope and shows verified/pending controls without cross-rate unit totals", async () => {
    mocks.report.mockResolvedValueOnce([cohort]);
    const html = renderToStaticMarkup(await FundsLedgerPage({ searchParams: Promise.resolve({ fy: "2020-21", taleemFy: "2021-22" }) }));
    expect(html).toContain('download="amaana-taleem-sponsorship-review-2021-22.csv"');
    expect(html).toContain("Download sponsorship reconciliation CSV");
    expect(html).toContain("All cohorts · control total");
    expect(html).toContain("Not summed across programmes and historical rates");
    expect(html).toContain("₹1,799.99");
    expect(html).not.toContain("donorEmail");
    expect(mocks.report).toHaveBeenCalledTimes(1);
  });
  it("withholds inconsistent cohorts rather than exposing a partial report or export", async () => {
    mocks.report.mockResolvedValueOnce([{ ...cohort, retainedRemainder: 900 }]);
    const html = renderToStaticMarkup(await FundsLedgerPage({ searchParams: Promise.resolve({ fy: "2020-21" }) }));
    expect(html).toContain("Taleem sponsorship report temporarily unavailable");
    expect(html).not.toContain("Download sponsorship reconciliation CSV");
    expect(html).not.toContain("All cohorts · control total");
    expect(mocks.log).toHaveBeenCalledExactlyOnceWith("finance.taleem_report_unavailable");
  });
});
