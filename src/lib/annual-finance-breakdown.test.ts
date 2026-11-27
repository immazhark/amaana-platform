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
    expect(report.byDestinationAndChannel).toHaveLength(4);
    expect(report.byDestinationAndChannel[0]).toEqual({ destination: "fund", fundSlug: "synthetic", pool: "NON_ZAKAT", paymentMethod: "RAZORPAY", grossPaise: 10025, refundedPaise: 500, retainedPaise: 9525, pendingPaise: 0, pendingCount: 0 });
    for (const key of ["grossPaise", "refundedPaise", "retainedPaise", "pendingPaise", "pendingCount"] as const) {
      const total = report.byDestinationAndChannel.reduce((sum, row) => sum + row[key], 0);
      expect(total).toBe(report.destinations.reduce((sum, row) => sum + row[key], 0));
      expect(total).toBe(report.channels.reduce((sum, row) => sum + row[key], 0));
    }
    expect(report.byDestinationAndChannel.every(row => !("draftPaise" in row) && !("publishedPaise" in row))).toBe(true);
    expect(report.channels).toEqual([{ paymentMethod: "RAZORPAY", grossPaise: 10525, refundedPaise: 500, retainedPaise: 10025, pendingPaise: 0, pendingCount: 0 }, { paymentMethod: "DIRECT_UPI", grossPaise: 2050, refundedPaise: 0, retainedPaise: 2050, pendingPaise: 100, pendingCount: 1 }, { paymentMethod: "BANK_TRANSFER", grossPaise: 0, refundedPaise: 0, retainedPaise: 0, pendingPaise: 125, pendingCount: 1 }]);
  });
  it("does not invent a channel for spending-only or empty snapshots", async () => {
    const report = await load([row(null, { draftPaise: 99n })]).result;
    expect(report.channels).toEqual([]);
    expect(report.byDestinationAndChannel).toEqual([]);
    expect(await load([]).result).toEqual({ destinations: [], channels: [], byDestinationAndChannel: [] });
  });
  it("refuses receipt or claim rows with missing payment-channel evidence", async () => {
    await expect(load([row(null, { grossPaise: 100n, retainedPaise: 100n })]).result).rejects.toThrow("Missing annual finance payment method");
    await expect(load([row(null, { pendingPaise: 100n, pendingCount: 1n })]).result).rejects.toThrow("Missing annual finance payment method");
  });
  it("rejects overflow and unsupported payment methods", async () => {
    await expect(load([row("RAZORPAY", { grossPaise: 9007199254740991n, retainedPaise: 9007199254740991n }), row("BANK_TRANSFER", { grossPaise: 1n, retainedPaise: 1n })]).result).rejects.toBeInstanceOf(RangeError);
    await expect(load([row("UNKNOWN")]).result).rejects.toThrow("payment method");
  });
});

describe("annual finance aggregate integrity", () => {
  it.each([null, 0, "0", false, undefined])("rejects non-bigint aggregate counts: %s", async value => {
    await expect(load([row("DIRECT_UPI", { pendingCount: value })]).result).rejects.toThrow("safe integer range");
  });

  it("rejects duplicate receipt and spending identities instead of double counting", async () => {
    const gift = row("RAZORPAY", { grossPaise: 100n, retainedPaise: 100n });
    const spend = row(null, { draftPaise: 20n });
    for (const duplicate of [gift, spend]) {
      await expect(load([duplicate, duplicate]).result).rejects.toThrow("Duplicate annual finance aggregate identity");
    }
  });

  it.each([{ destination: "other" }, { fundSlug: null }, { pool: "GENERAL" }, { destination: "appeals", fundSlug: "synthetic" }])("rejects invalid destination and pool identities", async overrides => {
    await expect(load([row("RAZORPAY", overrides)]).result).rejects.toThrow("Invalid annual finance aggregate identity");
  });

  it("rejects inconsistent principal and spending or claims assigned to an impossible channel", async () => {
    await expect(load([row("RAZORPAY", { grossPaise: 100n, refundedPaise: 10n, retainedPaise: 89n })]).result).rejects.toThrow("Inconsistent annual finance refund totals");
    await expect(load([row("DIRECT_UPI", { draftPaise: 1n })]).result).rejects.toThrow("Invalid annual finance spending channel");
    await expect(load([row("BANK_TRANSFER", { publishedPaise: 1n })]).result).rejects.toThrow("Invalid annual finance spending channel");
    await expect(load([row("RAZORPAY", { pendingPaise: 1n, pendingCount: 1n })]).result).rejects.toThrow("Invalid annual finance pending channel");
    await expect(load([row(null, { destination: "appeals", fundSlug: null, draftPaise: 1n })]).result).rejects.toThrow("Invalid annual finance spending destination");
  });

  it("rejects report-wide overflow even when each destination and channel is safe", async () => {
    const max = BigInt(Number.MAX_SAFE_INTEGER);
    await expect(load([
      row("RAZORPAY", { grossPaise: max, retainedPaise: max }),
      row("BANK_TRANSFER", { fundSlug: "other", grossPaise: 1n, retainedPaise: 1n }),
    ]).result).rejects.toBeInstanceOf(RangeError);
  });

  it("retains distinct valid joint rows, appeal receipts and fund spending", async () => {
    const report = await load([
      row("RAZORPAY", { grossPaise: 100n, refundedPaise: 10n, retainedPaise: 90n }),
      row("BANK_TRANSFER", { pendingPaise: 200n, pendingCount: 1n }),
      row(null, { draftPaise: 30n, publishedPaise: 40n }),
      row("RAZORPAY", { destination: "appeals", fundSlug: null, pool: "ZAKAT", grossPaise: 100n, refundedPaise: 10n, retainedPaise: 90n }),
    ]).result;
    expect(report.destinations).toHaveLength(2);
    expect(report.byDestinationAndChannel).toHaveLength(3);
    expect(report.destinations[0]).toMatchObject({ retainedPaise: 90, draftPaise: 30, publishedPaise: 40 });
    expect(report.channels[0]?.grossPaise).toBe(200);
  });
});
