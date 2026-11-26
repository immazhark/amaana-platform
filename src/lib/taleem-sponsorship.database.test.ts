import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { loadTaleemSponsorshipReport } from "@/lib/taleem-sponsorship-report";

class Rollback extends Error {}
class NotRefused extends Error {}

// Opt-in and loopback-only, like the other database suites: never a hosted, staging or live database. Every case runs
// in a transaction that can never commit, so the isolated database is left as the migrations made it.
describe.skipIf(process.env.AMAANA_DATABASE_TESTS !== "true")("Taleem sponsorship PostgreSQL invariants", () => {
  const prefix = randomUUID().replaceAll("-", "").slice(0, 16);
  let sequence = 0;
  const next = () => `${prefix}${sequence++}`;

  beforeAll(() => {
    const url = new URL(process.env.DATABASE_URL!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/amaana") {
      throw new Error("Taleem sponsorship DB tests require the isolated loopback amaana database");
    }
  });
  afterAll(async () => { await prisma.$disconnect(); });

  async function probe<T>(work: (tx: Prisma.TransactionClient) => Promise<T>, isolationLevel?: Prisma.TransactionIsolationLevel): Promise<T> {
    let result: T | undefined;
    try {
      await prisma.$transaction(async tx => { result = await work(tx); throw new Rollback(); }, { isolationLevel });
    } catch (error) { if (!(error instanceof Rollback)) throw error; }
    return result as T;
  }
  // A statement the database must refuse, because of exactly the named constraint. If it is wrongly accepted, NotRefused
  // is thrown inside the transaction so nothing commits. PostgreSQL reports the first CHECK that fails, so every case
  // below violates one constraint only.
  async function refused(constraint: string, work: (tx: Prisma.TransactionClient) => Promise<unknown>) {
    let error: unknown;
    try {
      await prisma.$transaction(async tx => { await work(tx); throw new NotRefused("the database accepted a statement it must refuse"); });
    } catch (caught) { error = caught; }
    expect(error, "the database accepted a statement it must refuse").not.toBeInstanceOf(NotRefused);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(constraint);
  }

  const user = (tx: Prisma.TransactionClient) => tx.user.create({ data: { name: "Synthetic operator", email: `${next()}@example.test` } });
  const fund = (tx: Prisma.TransactionClient) =>
    tx.fund.create({ data: { slug: `t-${next()}`, name: "Synthetic fund", summary: "Synthetic fund for tests only.", status: "ACTIVE" } });
  // A Razorpay-shaped row, so the older payment-method CHECK is satisfied and only sponsorship rules are under test.
  const donation = (over: Partial<Prisma.DonationUncheckedCreateInput>) => ({
    referenceNumber: `AFD-${next()}`, donorName: "Synthetic donor", donorEmail: "donor@example.test",
    provider: "razorpay", providerOrderId: `order_${next()}`,
    domesticConfirmedAt: new Date(), receiptTokenHash: "0".repeat(64), ...over,
  } satisfies Partial<Prisma.DonationUncheckedCreateInput> as Prisma.DonationUncheckedCreateInput);
  // 2 units x 12 months x Rs 1,500 = Rs 36,000, the figure the quote engine produces for Hifdh day scholar.
  const sponsorship = { sponsorshipProgramme: "hifdh-day-scholar", sponsorshipUnits: 2, sponsorshipMonths: 12, sponsorshipMonthlyRate: 1500, sponsorshipRateVersion: "baseline-2026-11" } as const;

  it("accepts a programme-level sponsorship whose amount is exactly units x months x the recorded rate", async () => {
    const row = await probe(async tx => {
      const f = await fund(tx);
      const created = await tx.donation.create({ data: donation({ fundId: f.id, amount: 36_000, ...sponsorship }) });
      return tx.donation.findUniqueOrThrow({ where: { id: created.id }, select: { amount: true, sponsorshipProgramme: true, sponsorshipUnits: true, sponsorshipMonths: true, sponsorshipMonthlyRate: true, sponsorshipRateVersion: true } });
    });
    expect(row.amount.toNumber()).toBe(36_000);
    expect(row).toMatchObject({ sponsorshipProgramme: "hifdh-day-scholar", sponsorshipUnits: 2, sponsorshipMonths: 12, sponsorshipRateVersion: "baseline-2026-11" });
    expect(row.sponsorshipMonthlyRate?.toNumber()).toBe(1500);
  });

  it("leaves an ordinary fund gift with all five sponsorship columns empty", async () => {
    const row = await probe(async tx => {
      const f = await fund(tx);
      const created = await tx.donation.create({ data: donation({ fundId: f.id, amount: 500 }) });
      return tx.donation.findUniqueOrThrow({ where: { id: created.id }, select: { sponsorshipProgramme: true, sponsorshipUnits: true, sponsorshipMonths: true, sponsorshipMonthlyRate: true, sponsorshipRateVersion: true } });
    });
    expect(row).toEqual({ sponsorshipProgramme: null, sponsorshipUnits: null, sponsorshipMonths: null, sponsorshipMonthlyRate: null, sponsorshipRateVersion: null });
  });

  it("refuses a sponsorship that records only some of its fields", async () => {
    await refused("Donation_sponsorship_fields_together", async tx => { const f = await fund(tx); await tx.donation.create({ data: donation({ fundId: f.id, amount: 500, sponsorshipProgramme: "qaida" }) }); });
    await refused("Donation_sponsorship_fields_together", async tx => { const f = await fund(tx); await tx.donation.create({ data: donation({ fundId: f.id, amount: 500, sponsorshipRateVersion: "baseline-2026-11" }) }); });
  });

  it("refuses units outside 1 to 50, durations other than 1, 3, 6 or 12 months, and a malformed programme", async () => {
    // Each amount equals units x months x rate, so only the named range or format rule can refuse the row.
    await refused("Donation_sponsorship_units_range", async tx => { const f = await fund(tx); await tx.donation.create({ data: donation({ fundId: f.id, amount: 51_000, sponsorshipProgramme: "qaida", sponsorshipUnits: 51, sponsorshipMonths: 1, sponsorshipMonthlyRate: 1000, sponsorshipRateVersion: "v" }) }); });
    await refused("Donation_sponsorship_months_allowed", async tx => { const f = await fund(tx); await tx.donation.create({ data: donation({ fundId: f.id, amount: 2_000, sponsorshipProgramme: "qaida", sponsorshipUnits: 1, sponsorshipMonths: 2, sponsorshipMonthlyRate: 1000, sponsorshipRateVersion: "v" }) }); });
    await refused("Donation_sponsorship_programme_slug", async tx => { const f = await fund(tx); await tx.donation.create({ data: donation({ fundId: f.id, amount: 1_000, sponsorshipProgramme: "Hifdh Day", sponsorshipUnits: 1, sponsorshipMonths: 1, sponsorshipMonthlyRate: 1000, sponsorshipRateVersion: "v" }) }); });
  });

  it("refuses an amount that is not exactly units x months x the recorded rate, and a fractional-rupee rate", async () => {
    await refused("Donation_sponsorship_amount_exact", async tx => { const f = await fund(tx); await tx.donation.create({ data: donation({ fundId: f.id, amount: 999, sponsorshipProgramme: "qaida", sponsorshipUnits: 1, sponsorshipMonths: 1, sponsorshipMonthlyRate: 1000, sponsorshipRateVersion: "v" }) }); });
    await refused("Donation_sponsorship_rate_whole_rupees", async tx => { const f = await fund(tx); await tx.donation.create({ data: donation({ fundId: f.id, amount: 1000.5, sponsorshipProgramme: "qaida", sponsorshipUnits: 1, sponsorshipMonths: 1, sponsorshipMonthlyRate: 1000.5, sponsorshipRateVersion: "v" }) }); });
  });

  it("refuses a sponsorship to an appeal, and one that is also a seasonal-campaign gift", async () => {
    await refused("Donation_sponsorship_requires_fund", async tx => {
      const owner = await user(tx);
      const appeal = await tx.appeal.create({ data: { slug: `a-${next()}`, title: "Synthetic", summary: "CI only", story: "CI only", category: "MEDICAL", status: "PUBLISHED", beneficiaryName: "Synthetic", goalAmount: 100_000, createdById: owner.id } });
      await tx.donation.create({ data: donation({ appealId: appeal.id, amount: 36_000, ...sponsorship }) });
    });
    await refused("Donation_sponsorship_not_campaign", async tx => {
      const owner = await user(tx);
      const f = await fund(tx);
      const campaign = await tx.fundCampaign.create({ data: { fundId: f.id, slug: `c-${next()}`, title: "Synthetic campaign", unitLabel: "unit", unitLabelPlural: "units", unitPrice: 1000, opensAt: new Date("2026-11-01"), closesAt: new Date("2026-12-01"), createdById: owner.id } });
      // 2 x Rs 1,000 as a campaign gift and 2 units x 1 month x Rs 1,000 as a sponsorship: both exact, so only the exclusivity rule can refuse it.
      await tx.donation.create({ data: donation({ fundId: f.id, amount: 2_000, campaignId: campaign.id, units: 2, unitPrice: 1000, sponsorshipProgramme: "qaida", sponsorshipUnits: 2, sponsorshipMonths: 1, sponsorshipMonthlyRate: 1000, sponsorshipRateVersion: "v" }) });
    });
  });

  it("reports historical quote cohorts, refunds and unverified claims without mixing ordinary or unrelated gifts", async () => {
    const result = await probe(async tx => {
      const taleem = await tx.fund.findUniqueOrThrow({ where: { slug: "taleem" } });
      const other = await fund(tx);
      const version = `synthetic-${prefix}`;
      const capturedAt = new Date("2026-11-21T06:00:00Z");
      const gift = (over: Partial<Prisma.DonationUncheckedCreateInput>) => tx.donation.create({ data: donation({
        fundId: taleem.id, amount: 1000, status: "CAPTURED", capturedAt,
        sponsorshipProgramme: "qaida", sponsorshipUnits: 1, sponsorshipMonths: 1,
        sponsorshipMonthlyRate: 1000, sponsorshipRateVersion: version, ...over,
      }) });
      await gift({ amount: 900, sponsorshipMonthlyRate: 900 });
      await gift({ feeContributionAmount: 12, refundedAmount: 5 });
      await gift({ feeContributionAmount: 12, refundedAmount: 112 });
      await gift({ status: "REFUNDED", feeContributionAmount: 12, refundedAmount: 1012, refundedAt: capturedAt });
      await gift({ status: "PENDING_VERIFICATION", capturedAt: null, amount: 3000, sponsorshipMonths: 3,
        paymentMethod: "DIRECT_UPI", provider: null, providerOrderId: null, transferReference: next(), transferredAt: capturedAt });
      await gift({ status: "FAILED", capturedAt: null });
      await gift({ fundId: other.id });
      await tx.donation.create({ data: donation({ fundId: taleem.id, amount: 999, status: "CAPTURED", capturedAt }) });
      return (await loadTaleemSponsorshipReport(tx)).filter(row => row.rateVersion === version);
    }, Prisma.TransactionIsolationLevel.RepeatableRead);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ programme: "qaida", monthlyRate: 900, verifiedCount: 1, grossCaptured: 900, principalRefunded: 0, netRetained: 900, pendingCount: 0, pendingAmount: 0 });
    expect(result[1]).toMatchObject({ programme: "qaida", monthlyRate: 1000, verifiedCount: 3, grossCaptured: 3000, principalRefunded: 1100, netRetained: 1900, pendingCount: 1, pendingAmount: 3000 });
  });
});
