import type { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { financeReviewPeriod, loadAnnualFinanceBreakdown } from "./annual-finance-review";

const row = (paymentMethod: string | null, overrides = {}) => ({ destination: "fund", fundSlug: "synthetic", pool: "NON_ZAKAT", paymentMethod, grossPaise: 0n, refundedPaise: 0n, retainedPaise: 0n, pendingPaise: 0n, pendingCount: 0n, draftPaise: 0n, publishedPaise: 0n, ...overrides });
const period = financeReviewPeriod("2026-27", new Date("2026-11-27"));
const load = (rows: unknown[]) => {
  const query = vi.fn().mockResolvedValue(rows);
  return { query, result: loadAnnualFinanceBreakdown({ $queryRaw: query } as unknown as Pick<Prisma.TransactionClient, "$queryRaw">, period) };
};
describe("annual payment channel breakdown", () => {
  it("reconciles destination and channel totals from one aggregate snapshot", async () => {
    const { query, result } = load([row("RAZORPAY", { grossPaise: 10025n, refundedPaise: 500n, retainedPaise: 9525n }), row("DIRECT_UPI", { grossPaise: 2050n, retainedPaise: 2050n, pendingPaise: 100n, pendingCount: 1n }), row("BANK_TRANSFER", { pendingPaise: 125n, pendingCount: 1n }), row(null, { draftPaise: 99n, publishedPaise: 200n }), row("RAZORPAY", { pool: "ZAKAT", grossPaise: 500n, retainedPaise: 500n })]);
    const report = await result;
    expect(query).toHaveBeenCalledTimes(1);
    expect(report.destinations).toHaveLength(2);
    expect(report.destinations[0]).toEqual({ destination: "fund", fundSlug: "synthetic", pool: "NON_ZAKAT", grossPaise: 12075, refundedPaise: 500, retainedPaise: 11575, pendingPaise: 225, pendingCount: 2, draftPaise: 99, publishedPaise: 200 });
    expect(report.channels).toEqual([{ paymentMethod: "RAZORPAY", grossPaise: 10525, refundedPaise: 500, retainedPaise: 10025, pendingPaise: 0, pendingCount: 0 }, { paymentMethod: "DIRECT_UPI", grossPaise: 2050, refundedPaise: 0, retainedPaise: 2050, pendingPaise: 100, pendingCount: 1 }, { paymentMethod: "BANK_TRANSFER", grossPaise: 0, refundedPaise: 0, retainedPaise: 0, pendingPaise: 125, pendingCount: 1 }]);
  });
  it("does not invent a channel for spending-only or empty snapshots", async () => {
    expect((await load([row(null, { draftPaise: 99n })]).result).channels).toEqual([]);
    expect(await load([]).result).toEqual({ destinations: [], channels: [] });
  });
  it("rejects overflow and unsupported payment methods", async () => {
    await expect(load([row("RAZORPAY", { grossPaise: 9007199254740991n, retainedPaise: 9007199254740991n }), row("RAZORPAY", { grossPaise: 1n, retainedPaise: 1n })]).result).rejects.toBeInstanceOf(RangeError);
    await expect(load([row("UNKNOWN")]).result).rejects.toThrow("payment method");
  });
});
