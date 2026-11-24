import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { loadFundsLedger } from "@/lib/funds-ledger";
import { loadDonationReconciliationTotals } from "@/lib/donation-reconciliation-totals";

class Rollback extends Error {}
class NotRefused extends Error {}

// Opt-in and loopback-only: this suite never mutates a hosted, staging or live database. Every case runs inside a
// transaction that is rolled back, so the isolated database is left exactly as the migrations made it.
describe.skipIf(process.env.AMAANA_DATABASE_TESTS !== "true")("designated giving PostgreSQL invariants", () => {
  const prefix = randomUUID().replaceAll("-", "").slice(0, 16);
  let sequence = 0;
  const next = () => `${prefix}${sequence++}`;

  beforeAll(() => {
    const url = new URL(process.env.DATABASE_URL!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/amaana") {
      throw new Error("Giving DB tests require the isolated loopback amaana database");
    }
  });
  afterAll(async () => { await prisma.$disconnect(); });

  // Runs work in a transaction and always rolls back; resolves with whatever the work returned.
  async function probe<T>(work: (tx: Prisma.TransactionClient) => Promise<T>, isolationLevel?: Prisma.TransactionIsolationLevel): Promise<T> {
    let result: T | undefined;
    try {
      await prisma.$transaction(async tx => { result = await work(tx); throw new Rollback(); }, { isolationLevel });
    } catch (error) { if (!(error instanceof Rollback)) throw error; }
    return result as T;
  }
  // Runs a statement the database must refuse, in a transaction that can never commit: if the database wrongly accepts
  // it, NotRefused is thrown inside the transaction so the synthetic rows roll back instead of being left behind. A
  // failed statement aborts its transaction, so each refusal gets its own. Resolves with the error that was raised.
  async function attempt(work: (tx: Prisma.TransactionClient) => Promise<unknown>): Promise<unknown> {
    try {
      await prisma.$transaction(async tx => { await work(tx); throw new NotRefused("the database accepted a statement it must refuse"); });
    } catch (error) { return error; }
    throw new NotRefused("unreachable: the transaction neither committed nor failed");
  }
  // The refusal must come from the named constraint: otherwise an unrelated rule (or a malformed fixture) could make the
  // test pass without proving anything.
  async function refused(constraint: string, work: (tx: Prisma.TransactionClient) => Promise<unknown>) {
    const error = await attempt(work);
    expect(error, "the database accepted a statement it must refuse").not.toBeInstanceOf(NotRefused);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(constraint);
  }
  // Same guarantee for rules that surface as a Prisma error code (a unique index or a foreign key) rather than a CHECK.
  async function refusedWithCode(code: string, work: (tx: Prisma.TransactionClient) => Promise<unknown>) {
    const error = await attempt(work);
    expect(error, "the database accepted a statement it must refuse").not.toBeInstanceOf(NotRefused);
    expect(error).toMatchObject({ code });
  }
  const user = (tx: Prisma.TransactionClient) => tx.user.create({ data: { name: "Synthetic operator", email: `${next()}@example.test` } });
  const fund = (tx: Prisma.TransactionClient, over: Partial<Prisma.FundUncheckedCreateInput> = {}) =>
    tx.fund.create({ data: { slug: `t-${next()}`, name: "Synthetic fund", summary: "Synthetic fund for tests only.", status: "ACTIVE", ...over } });
  const donation = (fundId: string | null, over: Partial<Prisma.DonationUncheckedCreateInput> = {}) => ({
    referenceNumber: `AFD-${next()}`, fundId, donorName: "Synthetic donor", donorEmail: "donor@example.test",
    // A Razorpay-shaped row, so the older payment-method CHECK is satisfied and only fund rules are under test.
    provider: "razorpay", providerOrderId: `order_${next()}`,
    domesticConfirmedAt: new Date(), amount: 100, receiptTokenHash: "0".repeat(64), ...over,
  } satisfies Prisma.DonationUncheckedCreateInput);

  it("seeds the owner-listed funds with the Zakat rulings of 19 November 2026", async () => {
    const funds = await prisma.fund.findMany({ select: { slug: true, zakatPolicy: true, status: true, isGeneral: true } });
    const policy = Object.fromEntries(funds.map(f => [f.slug, f.zakatPolicy]));
    for (const slug of ["general", "taleem", "modern-education", "medical", "orphan"]) expect(policy[slug], slug).toBe("ACCEPTED");
    for (const slug of ["eid-kits", "qurbani-meat", "dates", "foundation-operations"]) expect(policy[slug], slug).toBe("NOT_ACCEPTED");
    expect(policy["madarsa-operations"]).toBe("UNDER_REVIEW");
    expect(funds.filter(f => f.isGeneral).map(f => f.slug)).toEqual(["general"]);
    expect(funds.every(f => f.status === "ACTIVE")).toBe(true);
  });

  it("keeps the seeded summaries free of the repeated Zakat sentence", async () => {
    const rows = await prisma.fund.findMany({ where: { slug: { in: ["eid-kits", "qurbani-meat", "dates", "foundation-operations"] } }, select: { summary: true } });
    expect(rows).toHaveLength(4);
    for (const row of rows) expect(row.summary).not.toMatch(/Zakat is not accepted/);
  });

  it("allows only one General fund", async () => {
    await refusedWithCode("P2002", tx => fund(tx, { isGeneral: true }));
  });

  it("gives every donation exactly one destination: an appeal or a fund", async () => {
    await probe(async tx => { // a fund alone is fine
      const f = await fund(tx);
      await tx.donation.create({ data: donation(f.id) });
    });
    await refused("Donation_exactly_one_destination", tx => tx.donation.create({ data: donation(null) })); // neither
    await refused("Donation_exactly_one_destination", async tx => { // both
      const owner = await user(tx);
      const f = await fund(tx);
      const appeal = await tx.appeal.create({ data: { slug: `a-${next()}`, title: "Synthetic", summary: "CI only", story: "CI only", category: "MEDICAL", status: "PUBLISHED", beneficiaryName: "Synthetic", goalAmount: 1000, createdById: owner.id } });
      await tx.donation.create({ data: donation(f.id, { appealId: appeal.id }) });
    });
  });

  it("refuses a negative gateway-fee contribution", async () => {
    await refused("Donation_fee_contribution_nonnegative", async tx => { const f = await fund(tx); await tx.donation.create({ data: donation(f.id, { feeContributionAmount: -1 }) }); });
  });

  it("will not delete a fund that has gifts, spending, or both", async () => {
    const withGift = async (tx: Prisma.TransactionClient, fundId: string) => { await tx.donation.create({ data: donation(fundId) }); };
    const withSpend = async (tx: Prisma.TransactionClient, fundId: string) => {
      const owner = await user(tx);
      await tx.fundDisbursement.create({ data: { fundId, createdById: owner.id, pool: "NON_ZAKAT", amount: 10, spentOn: new Date("2026-11-01"), financialYear: "2026-27", title: "Synthetic spend" } });
    };
    // Control: a fund with nothing recorded against it deletes cleanly, so the refusals below are caused by the records.
    await probe(async tx => { const f = await fund(tx); await tx.fund.delete({ where: { id: f.id } }); });
    await refusedWithCode("P2003", async tx => { const f = await fund(tx); await withGift(tx, f.id); await tx.fund.delete({ where: { id: f.id } }); });
    await refusedWithCode("P2003", async tx => { const f = await fund(tx); await withSpend(tx, f.id); await tx.fund.delete({ where: { id: f.id } }); });
    await refusedWithCode("P2003", async tx => { const f = await fund(tx); await withGift(tx, f.id); await withSpend(tx, f.id); await tx.fund.delete({ where: { id: f.id } }); });
  });

  it("guards spending: positive amounts, Zakat only with recorded eligibility, void only with a reason", async () => {
    const base = (fundId: string, createdById: string) => ({ fundId, createdById, pool: "NON_ZAKAT" as const, amount: 10, spentOn: new Date("2026-11-01"), financialYear: "2026-27", title: "Synthetic spend" });
    await probe(async tx => {
      const owner = await user(tx); const f = await fund(tx);
      await tx.fundDisbursement.create({ data: base(f.id, owner.id) });
      await tx.fundDisbursement.create({ data: { ...base(f.id, owner.id), pool: "ZAKAT", zakatEligibilityConfirmedAt: new Date(), zakatEligibilityBasis: "All recipients verified as eligible" } });
      await tx.fundDisbursement.create({ data: { ...base(f.id, owner.id), status: "VOID", voidedAt: new Date(), voidReason: "Entered twice" } });
    });
    await refused("FundDisbursement_amount_positive", async tx => { const o = await user(tx); const f = await fund(tx); await tx.fundDisbursement.create({ data: { ...base(f.id, o.id), amount: 0 } }); });
    await refused("FundDisbursement_zakat_requires_eligibility", async tx => { const o = await user(tx); const f = await fund(tx); await tx.fundDisbursement.create({ data: { ...base(f.id, o.id), pool: "ZAKAT" } }); });
    await refused("FundDisbursement_zakat_requires_eligibility", async tx => { const o = await user(tx); const f = await fund(tx); await tx.fundDisbursement.create({ data: { ...base(f.id, o.id), pool: "ZAKAT", zakatEligibilityConfirmedAt: new Date() } }); });
    await refused("FundDisbursement_void_reason", async tx => { const o = await user(tx); const f = await fund(tx); await tx.fundDisbursement.create({ data: { ...base(f.id, o.id), status: "VOID" } }); });
  });

  it("computes the ledger exactly from real rows: per-donation fee-first refunds, pools, pending and void", async () => {
    const result = await probe(async tx => {
      const owner = await user(tx);
      const f = await fund(tx);
      const captured = new Date("2026-11-10T06:00:00Z");
      const gift = (over: Partial<Prisma.DonationUncheckedCreateInput>) => tx.donation.create({ data: donation(f.id, { givingIntent: "SADAQAH", status: "CAPTURED", capturedAt: captured, ...over }) });
      await gift({ status: "REFUNDED", refundedAmount: 100 });                                  // fully refunded, no fee: received 0
      await gift({ feeContributionAmount: 12, refundedAmount: 12 });                            // only the fee returned: received 100
      await gift({});                                                                           // untouched: 100
      await gift({ givingIntent: "ZAKAT", amount: 50 });                                        // Zakat pool 50
      await gift({ status: "PENDING_VERIFICATION", capturedAt: null, amount: 70, givingIntent: "GENERAL" }); // pending, never received
      await gift({ status: "FAILED", capturedAt: null, amount: 90 });                          // ignored
      const spend = (over: Partial<Prisma.FundDisbursementUncheckedCreateInput>) => tx.fundDisbursement.create({ data: { fundId: f.id, createdById: owner.id, pool: "NON_ZAKAT", amount: 120, spentOn: new Date("2026-11-12"), financialYear: "2026-27", title: "Synthetic", status: "PUBLISHED", ...over } });
      await spend({});
      await spend({ pool: "ZAKAT", amount: 20, status: "DRAFT", zakatEligibilityConfirmedAt: new Date(), zakatEligibilityBasis: "All recipients verified as eligible" });
      await spend({ amount: 999, status: "VOID", voidedAt: new Date(), voidReason: "Entered twice" });
      const all = await loadFundsLedger(tx, { fundId: f.id });
      const windowed = await loadFundsLedger(tx, { fundId: f.id, capturedIn: { start: new Date("2026-03-31T18:30:00Z"), end: new Date("2027-03-31T18:30:00Z") } });
      return { id: f.id, all: all.byFund[f.id], windowed: windowed.byFund[f.id], zakat: all.zakatAccount };
    });
    expect(result.all?.total).toMatchObject({ receivedPaise: 25_000, pendingPaise: 7_000, refundedPaise: 10_000, spentPaise: 14_000, publishedSpentPaise: 12_000, balancePaise: 11_000 });
    expect(result.all?.nonZakat).toMatchObject({ receivedPaise: 20_000, spentPaise: 12_000, balancePaise: 8_000 });
    expect(result.all?.zakat).toMatchObject({ receivedPaise: 5_000, spentPaise: 2_000, balancePaise: 3_000 });
    expect(result.zakat).toMatchObject({ receivedPaise: 5_000, spentPaise: 2_000, balancePaise: 3_000 });
    // The capture window excludes the pending claim (it has no capture date) and nothing else.
    expect(result.windowed?.total.receivedPaise).toBe(25_000);
    expect(result.windowed?.total.pendingPaise).toBe(0);
  });

  it("returns the covered gateway fee before the gift itself on a partial refund", async () => {
    const result = await probe(async tx => {
      const f = await fund(tx);
      // Rs 100 gift plus Rs 12 covered fee; Rs 50 has gone back to the donor.
      await tx.donation.create({ data: donation(f.id, { givingIntent: "SADAQAH", status: "CAPTURED", capturedAt: new Date("2026-11-10T06:00:00Z"), amount: 100, feeContributionAmount: 12, refundedAmount: 50 }) });
      return (await loadFundsLedger(tx, { fundId: f.id })).byFund[f.id];
    });
    // The first Rs 12 returned the fee, so only Rs 38 of the gift is refunded and Rs 62 is still received.
    expect(result?.total).toMatchObject({ receivedPaise: 6_200, refundedPaise: 3_800, spentPaise: 0, balancePaise: 6_200 });
  });

  it("reports fee-first donation refunds across all captured and refunded rows in one snapshot", async () => {
    const result = await probe(async tx => {
      const f = await fund(tx);
      const before = await loadDonationReconciliationTotals(tx);
      const captured = new Date("2026-11-10T06:00:00Z");
      const gift = (over: Partial<Prisma.DonationUncheckedCreateInput>) => tx.donation.create({
        data: donation(f.id, { status: "CAPTURED", capturedAt: captured, amount: 100, ...over }),
      });
      await gift({ feeContributionAmount: 12, refundedAmount: 5 });
      await gift({ feeContributionAmount: 2, refundedAmount: 7 });
      await gift({ status: "REFUNDED", feeContributionAmount: 12, refundedAmount: 112, refundedAt: captured });
      await gift({ feeContributionAmount: 3 });
      await gift({ refundedAmount: 25 });
      await gift({ status: "PENDING_VERIFICATION", capturedAt: null });
      await gift({ status: "FAILED", capturedAt: null });
      const after = await loadDonationReconciliationTotals(tx);
      // Compare to the existing scoped fund ledger, which applies the same per-row rule.
      const ledger = (await loadFundsLedger(tx, { fundId: f.id })).byFund[f.id]?.total;
      return { gross: after.grossCaptured - before.grossCaptured, refunds: after.refunded - before.refunded, retained: after.netRetained - before.netRetained, ledger };
    }, Prisma.TransactionIsolationLevel.RepeatableRead);
    expect(result.gross).toBeCloseTo(500, 2);
    expect(result.refunds).toBeCloseTo(130, 2);
    expect(result.retained).toBeCloseTo(370, 2);
    expect(result.ledger).toMatchObject({ refundedPaise: 13000, receivedPaise: 37000 });
  });

  it("caps a recorded refund at the whole charge: the gift plus any covered gateway fee", async () => {
    const captured = new Date("2026-11-10T06:00:00Z");
    // No covered fee: the ceiling is the gift itself, exactly as before.
    await probe(async tx => { const f = await fund(tx); await tx.donation.create({ data: donation(f.id, { status: "CAPTURED", capturedAt: captured, amount: 100, refundedAmount: 100 }) }); });
    await refused("Donation_refundedAmount_lte_charge_check", async tx => { const f = await fund(tx); await tx.donation.create({ data: donation(f.id, { status: "CAPTURED", capturedAt: captured, amount: 100, refundedAmount: 100.01 }) }); });
    // A covered fee raises the ceiling by exactly that fee, and no further.
    await probe(async tx => { const f = await fund(tx); await tx.donation.create({ data: donation(f.id, { status: "CAPTURED", capturedAt: captured, amount: 100, feeContributionAmount: 12, refundedAmount: 112 }) }); });
    await refused("Donation_refundedAmount_lte_charge_check", async tx => { const f = await fund(tx); await tx.donation.create({ data: donation(f.id, { status: "CAPTURED", capturedAt: captured, amount: 100, feeContributionAmount: 12, refundedAmount: 112.01 }) }); });
  });

  // AF-FUNDING-MATH. The Razorpay webhook caps a provider refund at the full charge (gift plus covered fee) and, on a
  // full refund, increments refundedAmount to that total (src/app/api/webhooks/razorpay/route.ts). This issues exactly
  // that update against real PostgreSQL and checks the ledger: the donor was refunded the fee first and then the whole
  // gift, so nothing is still received.
  it("records a full refund of a fee-covered donation and the ledger then shows nothing received", async () => {
    const result = await probe(async tx => {
      const f = await fund(tx);
      const gift = await tx.donation.create({ data: donation(f.id, { givingIntent: "SADAQAH", status: "CAPTURED", capturedAt: new Date("2026-11-10T06:00:00Z"), amount: 100, feeContributionAmount: 12 }) });
      await tx.donation.update({ where: { id: gift.id }, data: { refundedAmount: { increment: 112 }, status: "REFUNDED", refundedAt: new Date("2026-11-11T06:00:00Z") } });
      const stored = await tx.donation.findUniqueOrThrow({ where: { id: gift.id }, select: { status: true, refundedAmount: true } });
      return { stored, ledger: (await loadFundsLedger(tx, { fundId: f.id })).byFund[f.id] };
    });
    expect(result.stored.status).toBe("REFUNDED");
    expect(result.stored.refundedAmount.toNumber()).toBe(112);
    expect(result.ledger?.total).toMatchObject({ receivedPaise: 0, refundedPaise: 10_000, spentPaise: 0, balancePaise: 0 });
  });
});
