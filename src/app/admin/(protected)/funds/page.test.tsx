import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ permission: vi.fn(), ledger: vi.fn(), report: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.permission }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/funds-ledger", () => ({ getFundsLedger: mocks.ledger }));
vi.mock("@/lib/taleem-sponsorship-report", () => ({ loadTaleemSponsorshipReport: mocks.report }));

import FundsLedgerPage from "./page";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.permission.mockResolvedValue({ id: "synthetic-viewer" });
  mocks.ledger.mockResolvedValue({ funds: [], byFund: {}, zakatAccount: { receivedPaise: 0, pendingPaise: 0, refundedPaise: 0, spentPaise: 0, publishedSpentPaise: 0, balancePaise: 0 } });
  mocks.report.mockResolvedValue([]);
});

describe("private Taleem reconciliation", () => {
  it("does not query the ledger or sponsorship report if viewing is denied", async () => {
    mocks.permission.mockRejectedValue(new Error("denied"));
    await expect(FundsLedgerPage()).rejects.toThrow("denied");
    expect(mocks.permission).toHaveBeenCalledWith("donation.view");
    expect(mocks.ledger).not.toHaveBeenCalled();
    expect(mocks.report).not.toHaveBeenCalled();
  });

  it("renders historic rates, retained principal and unverified claims separately", async () => {
    mocks.report.mockResolvedValue([
      { programme: "qaida", monthlyRate: 900, rateVersion: "historic", verifiedCount: 1, grossCaptured: 900, principalRefunded: 0, netRetained: 900, pendingCount: 0, pendingAmount: 0 },
      { programme: "qaida", monthlyRate: 1000, rateVersion: "current", verifiedCount: 3, grossCaptured: 3000, principalRefunded: 1100, netRetained: 1900, pendingCount: 1, pendingAmount: 3000 },
    ]);
    const html = renderToStaticMarkup(await FundsLedgerPage());
    expect(html).toContain("Taleem sponsorship reconciliation");
    expect(html).toContain("₹900 per unit/month · historic");
    expect(html).toContain("₹1,000 per unit/month · current");
    expect(html).toContain("<td>₹1,100</td><td>₹1,900</td><td>1</td><td>₹3,000</td>");
    expect(html).toContain("not student assignments");
    expect(html).toContain("Pending claims are not receipts");
  });

  it("renders an explicit empty state", async () => {
    expect(renderToStaticMarkup(await FundsLedgerPage())).toContain("No verified sponsorship gifts or pending claims recorded.");
  });
});
