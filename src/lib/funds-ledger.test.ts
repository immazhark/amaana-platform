import { describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  fund: { findMany: vi.fn() },
  donation: { groupBy: vi.fn(), findMany: vi.fn() },
  fundDisbursement: { groupBy: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { getFundsLedger, loadFundsLedger } from "./funds-ledger";

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

  it("restricts all three reads to active fund relations only when explicitly requested", async () => {
    const scoped = client({});
    await loadFundsLedger(scoped as never, { activeFundsOnly: true });
    for (const query of [scoped.donation.groupBy, scoped.donation.findMany, scoped.fundDisbursement.groupBy]) {
      expect(query).toHaveBeenCalledOnce();
      expect(query.mock.calls[0]?.[0].where.fund).toEqual({ is: { status: "ACTIVE" } });
    }
    const unrestricted = client({});
    await loadFundsLedger(unrestricted as never);
    for (const query of [unrestricted.donation.groupBy, unrestricted.donation.findMany, unrestricted.fundDisbursement.groupBy]) {
      expect(query.mock.calls[0]?.[0].where).not.toHaveProperty("fund");
    }
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

describe("admin fund ledger consistent refund snapshot", () => {
  function fixture(order: "double" | "missed", initialRefund = 0) {
    let refund = initialRefund;
    let release: () => void = () => undefined;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const fund = { id: "synthetic", slug: "synthetic", name: "Synthetic", status: "ACTIVE", zakatPolicy: "ACCEPTED" };
    const snapshotClient = (snapshot?: number) => ({
      fund: { findMany: async () => [fund] },
      donation: {
        groupBy: async () => {
          if (order === "missed") await gate;
          const observed = snapshot ?? refund;
          if (order === "double") refund = 30;
          return observed === 0 ? [{ fundId: fund.id, givingIntent: "ZAKAT", status: "CAPTURED", _sum: { amount: dec(100) } }] : [];
        },
        findMany: async () => {
          const observed = snapshot ?? refund;
          if (order === "missed") { refund = 30; release(); }
          return observed > 0 ? [{ fundId: fund.id, givingIntent: "ZAKAT", status: "CAPTURED", amount: dec(100), refundedAmount: dec(observed), feeContributionAmount: dec(0) }] : [];
        },
      },
      fundDisbursement: { groupBy: async () => [{ fundId: fund.id, pool: "ZAKAT", status: "DRAFT", _sum: { amount: dec(20) } }] },
    });
    const live = snapshotClient();
    mockPrisma.fund.findMany.mockImplementation(live.fund.findMany);
    mockPrisma.donation.groupBy.mockImplementation(live.donation.groupBy);
    mockPrisma.donation.findMany.mockImplementation(live.donation.findMany);
    mockPrisma.fundDisbursement.groupBy.mockImplementation(live.fundDisbursement.groupBy);
    mockPrisma.$transaction.mockImplementation(async (work: (tx: ReturnType<typeof snapshotClient>) => Promise<unknown>, options: { isolationLevel: string }) => {
      expect(options.isolationLevel).toBe("RepeatableRead");
      return work(snapshotClient(refund));
    });
  }

  it.each(["double", "missed"] as const)("prevents the %s refund-partition race from corrupting the displayed balance", async order => {
    fixture(order);
    const report = await getFundsLedger();
    expect(report.zakatAccount).toMatchObject({ receivedPaise: 10_000, spentPaise: 2_000, balancePaise: 8_000 });
    expect(report.byFund.synthetic?.total.balancePaise).toBe(8_000);
  });

  it("preserves a previously partially refunded gift and draft spending", async () => {
    fixture("double", 30);
    const report = await getFundsLedger();
    expect(report.zakatAccount).toMatchObject({ receivedPaise: 7_000, refundedPaise: 3_000, spentPaise: 2_000, balancePaise: 5_000 });
  });
});
