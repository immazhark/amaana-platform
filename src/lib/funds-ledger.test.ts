import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { loadFundsLedger } from "./funds-ledger";

const dec = (rupees: number) => ({ mul: (n: number) => ({ toNumber: () => rupees * n }) });

function client(opts: { unrefunded?: unknown[]; refunded?: unknown[]; disbursements?: unknown[] }) {
  return {
    donation: { groupBy: vi.fn().mockResolvedValue(opts.unrefunded ?? []), findMany: vi.fn().mockResolvedValue(opts.refunded ?? []) },
    fundDisbursement: { groupBy: vi.fn().mockResolvedValue(opts.disbursements ?? []) },
  };
}

describe("loadFundsLedger", () => {
  it("applies the fee-first refund rule to each donation, not to an aggregate", async () => {
    // A: 100 refunded in full, no fee. B: 100 with a 12 fee, only the fee refunded. C: 100 untouched.
    const c = client({
      unrefunded: [{ fundId: "orphan", givingIntent: "SADAQAH", status: "CAPTURED", _sum: { amount: dec(100) } }],
      refunded: [
        { fundId: "orphan", givingIntent: "SADAQAH", status: "REFUNDED", amount: dec(100), refundedAmount: dec(100), feeContributionAmount: dec(0) },
        { fundId: "orphan", givingIntent: "SADAQAH", status: "CAPTURED", amount: dec(100), refundedAmount: dec(12), feeContributionAmount: dec(12) },
      ],
    });
    const { byFund } = await loadFundsLedger(c as never);
    // Received: A 0 + B 100 + C 100 = 200. An aggregate (refunded 112 - fee 12) would have given 100 refunded: 100.
    expect(byFund.orphan?.total).toMatchObject({ receivedPaise: 20_000 * 1, refundedPaise: 10_000 });
  });

  it("separates unrefunded gifts (summed in the database) from refunded ones (read individually)", async () => {
    const c = client({});
    await loadFundsLedger(c as never);
    expect(c.donation.groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ refundedAmount: 0 }) }));
    expect(c.donation.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ refundedAmount: { gt: 0 } }) }));
  });

  it("limits donations to a fund and to a capture window, and disbursements to a spending window", async () => {
    const start = new Date("2026-03-31T18:30:00Z");
    const end = new Date("2027-03-31T18:30:00Z");
    const c = client({});
    await loadFundsLedger(c as never, { fundId: "fund_x", capturedIn: { start, end }, spentIn: { start, end } });
    const donationWhere = c.donation.groupBy.mock.calls[0]?.[0].where;
    expect(donationWhere).toMatchObject({ fundId: "fund_x", capturedAt: { gte: start, lt: end } });
    expect(c.fundDisbursement.groupBy.mock.calls[0]?.[0].where).toMatchObject({ fundId: "fund_x", spentOn: { gte: start, lt: end }, status: { in: ["DRAFT", "PUBLISHED"] } });
  });

  it("never counts failed or rejected gifts and keeps pending bank/UPI claims out of received", async () => {
    const c = client({ unrefunded: [
      { fundId: "orphan", givingIntent: "GENERAL", status: "PENDING_VERIFICATION", _sum: { amount: dec(50) } },
      { fundId: "orphan", givingIntent: "GENERAL", status: "CAPTURED", _sum: { amount: dec(70) } },
    ] });
    const { byFund } = await loadFundsLedger(c as never);
    expect(byFund.orphan?.total).toMatchObject({ receivedPaise: 7_000, pendingPaise: 5_000 });
    expect(c.donation.groupBy.mock.calls[0]?.[0].where.status).toEqual({ in: ["CAPTURED", "REFUNDED", "PENDING_VERIFICATION"] });
  });
});
