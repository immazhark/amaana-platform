import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { financeReviewPeriod, loadAnnualFinanceBreakdown } from "./annual-finance-review";
import { donationExceptionWhere, loadVerifiedEvidenceCounts } from "./donation-exception-review";

class Rollback extends Error {}
describe.skipIf(process.env.AMAANA_DATABASE_TESTS !== "true")("financial-year channel snapshot PostgreSQL", () => {
  beforeAll(() => {
    const url = new URL(process.env.DATABASE_URL!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/amaana") throw new Error("Financial-year tests require isolated loopback amaana database");
  });
  afterAll(async () => { await prisma.$disconnect(); });
  it("reconciles missing capture and acknowledgement counts against the review predicates and annual exclusion", async () => {
    const prefix = randomUUID().replaceAll("-", "").slice(0, 16);
    let i = 0;
    const next = () => prefix + i++;
    const period = financeReviewPeriod("2026-27", new Date("2026-11-27"));
    try {
      await prisma.$transaction(async tx => {
        const before = await loadVerifiedEvidenceCounts(tx);
        const fund = await tx.fund.create({ data: { slug: "t-" + next(), name: "Synthetic", summary: "Synthetic isolated test", status: "ACTIVE" } });
        const gift = (over: Partial<Prisma.DonationUncheckedCreateInput>) => tx.donation.create({ data: {
          referenceNumber: "AFD-" + next(), fundId: fund.id, donorName: "Synthetic", donorEmail: "synthetic@example.test",
          provider: "razorpay", providerOrderId: "order_" + next(), domesticConfirmedAt: period.start, amount: 100,
          receiptTokenHash: "0".repeat(64), status: "CAPTURED", capturedAt: period.start, createdAt: period.start, ...over,
        } });
        await gift({ capturedAt: null, receiptNumber: "AFR-" + next() });
        await gift({ capturedAt: null });
        await gift({ receiptNumber: "AFR-" + next() });
        await gift({ status: "FAILED", capturedAt: null });
        const after = await loadVerifiedEvidenceCounts(tx);
        expect(after.missingAcknowledgements - before.missingAcknowledgements).toBe(1);
        expect(after.missingCaptureTimes - before.missingCaptureTimes).toBe(2);
        expect(await tx.donation.count({ where: { fundId: fund.id, AND: [donationExceptionWhere("missing-capture-time")] } })).toBe(2);
        expect(await tx.donation.count({ where: { fundId: fund.id, AND: [donationExceptionWhere("missing-acknowledgement")] } })).toBe(1);
        const annual = await loadAnnualFinanceBreakdown(tx, period);
        expect(annual.destinations.filter(row => row.fundSlug === fund.slug).reduce((sum, row) => sum + row.grossPaise, 0)).toBe(10000);
        throw new Rollback();
      }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    } catch (error) { if (!(error instanceof Rollback)) throw error; }
  });

  it("reconciles channel and destination deltas with fee-first refunds and no spending attribution", async () => {
    const prefix = randomUUID().replaceAll("-", "").slice(0, 16);
    let i = 0;
    const next = () => prefix + i++;
    const period = financeReviewPeriod("2026-27", new Date("2026-11-27"));
    try {
      await prisma.$transaction(async tx => {
        const before = await loadAnnualFinanceBreakdown(tx, period);
        const fund = await tx.fund.create({ data: { slug: "t-" + next(), name: "Synthetic", summary: "Synthetic isolated test", status: "ACTIVE" } });
        const owner = await tx.user.create({ data: { name: "Synthetic", email: next() + "@example.test" } });
        const gift = (over: Partial<Prisma.DonationUncheckedCreateInput>) => tx.donation.create({ data: { referenceNumber: "AFD-" + next(), fundId: fund.id, donorName: "Synthetic", donorEmail: "synthetic@example.test", provider: "razorpay", providerOrderId: "order_" + next(), domesticConfirmedAt: period.start, amount: 100, receiptTokenHash: "0".repeat(64), status: "CAPTURED", capturedAt: period.start, createdAt: period.start, ...over } });
        await gift({ amount: 100.25, feeContributionAmount: 12, refundedAmount: 17 });
        await gift({ amount: 20.5, givingIntent: "ZAKAT", paymentMethod: "DIRECT_UPI", provider: null, providerOrderId: null, transferReference: next(), transferredAt: period.start });
        await gift({ amount: 1.25, status: "PENDING_VERIFICATION", capturedAt: null, paymentMethod: "BANK_TRANSFER", provider: null, providerOrderId: null, transferReference: next(), transferredAt: period.start });
        await gift({ amount: 999, capturedAt: period.end, createdAt: period.end });
        await tx.fundDisbursement.create({ data: { fundId: fund.id, createdById: owner.id, pool: "NON_ZAKAT", amount: 9.99, spentOn: new Date("2026-11-12"), financialYear: period.label, title: "Synthetic", status: "DRAFT" } });
        const after = await loadAnnualFinanceBreakdown(tx, period);
        const keys = ["grossPaise", "refundedPaise", "retainedPaise", "pendingPaise", "pendingCount"] as const;
        const delta = (method: "RAZORPAY" | "DIRECT_UPI" | "BANK_TRANSFER") => {
          const old = before.channels.find(row => row.paymentMethod === method);
          const current = after.channels.find(row => row.paymentMethod === method);
          if (!current) throw new Error("Missing synthetic channel");
          return keys.map(key => current[key] - (old?.[key] ?? 0));
        };
        expect(delta("RAZORPAY")).toEqual([10025, 500, 9525, 0, 0]);
        expect(delta("DIRECT_UPI")).toEqual([2050, 0, 2050, 0, 0]);
        expect(delta("BANK_TRANSFER")).toEqual([0, 0, 0, 125, 1]);
        const destination = after.destinations.filter(row => row.fundSlug === fund.slug);
        expect(destination).toHaveLength(2);
        expect(keys.map(key => destination.reduce((sum, row) => sum + row[key], 0))).toEqual([12075, 500, 11575, 125, 1]);
        expect(destination.reduce((sum, row) => sum + row.draftPaise, 0)).toBe(999);
        const cross = after.byDestinationAndChannel.filter(row => row.fundSlug === fund.slug);
        expect(cross).toHaveLength(3);
        for (const [paymentMethod, pool, expected] of [
          ["RAZORPAY", "NON_ZAKAT", [10025, 500, 9525, 0, 0]],
          ["DIRECT_UPI", "ZAKAT", [2050, 0, 2050, 0, 0]],
          ["BANK_TRANSFER", "NON_ZAKAT", [0, 0, 0, 125, 1]],
        ] as const) {
          const row = cross.find(row => row.paymentMethod === paymentMethod && row.pool === pool);
          if (!row) throw new Error("Missing synthetic destination/channel intersection");
          expect(keys.map(key => row[key])).toEqual(expected);
          expect(row).not.toHaveProperty("draftPaise");
        }
        throw new Rollback();
      }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    } catch (error) { if (!(error instanceof Rollback)) throw error; }
  });
});
