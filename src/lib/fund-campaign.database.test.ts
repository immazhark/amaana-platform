import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";

class Rollback extends Error {}

// Opt-in and loopback-only: this suite never mutates a hosted, staging or live database. Every case runs inside a
// transaction that is rolled back, so the isolated database is left exactly as the migrations made it.
describe.skipIf(process.env.AMAANA_DATABASE_TESTS !== "true")("fund campaign PostgreSQL invariants", () => {
  const prefix = randomUUID().replaceAll("-", "").slice(0, 16);
  let sequence = 0;
  const next = () => `${prefix}${sequence++}`;

  beforeAll(() => {
    const url = new URL(process.env.DATABASE_URL!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/amaana") {
      throw new Error("Campaign DB tests require the isolated loopback amaana database");
    }
  });
  afterAll(async () => { await prisma.$disconnect(); });

  async function probe<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    let result: T | undefined;
    try {
      await prisma.$transaction(async tx => { result = await work(tx); throw new Rollback(); });
    } catch (error) { if (!(error instanceof Rollback)) throw error; }
    return result as T;
  }
  // A statement the database must refuse; a failed statement aborts its transaction, so each refusal gets its own.
  const refused = (work: (tx: Prisma.TransactionClient) => Promise<unknown>) => expect(prisma.$transaction(async tx => { await work(tx); })).rejects.toBeTruthy();

  const owner = (tx: Prisma.TransactionClient) => tx.user.create({ data: { name: "Synthetic operator", email: `${next()}@example.test` } });
  const fund = (tx: Prisma.TransactionClient) => tx.fund.create({ data: { slug: `t-${next()}`, name: "Synthetic fund", summary: "Synthetic fund for tests only.", status: "ACTIVE" } });
  const campaign = (tx: Prisma.TransactionClient, fundId: string, createdById: string, over: Partial<Prisma.FundCampaignUncheckedCreateInput> = {}) =>
    tx.fundCampaign.create({ data: { fundId, createdById, slug: `c-${next()}`, title: "Synthetic campaign", unitLabel: "kit", unitLabelPlural: "kits", unitPrice: 1500, maxUnits: 100, opensAt: new Date("2027-02-18T03:30:00Z"), closesAt: new Date("2027-02-24T18:29:00Z"), status: "ACTIVE", ...over } });
  const gift = (fundId: string | null, over: Partial<Prisma.DonationUncheckedCreateInput> = {}) => ({
    referenceNumber: `AFD-${next()}`, fundId, donorName: "Synthetic donor", donorEmail: "donor@example.test",
    domesticConfirmedAt: new Date(), amount: 4500, receiptTokenHash: "0".repeat(64), ...over,
  } satisfies Prisma.DonationUncheckedCreateInput);
  const setup = async (tx: Prisma.TransactionClient) => { const user = await owner(tx); const f = await fund(tx); const c = await campaign(tx, f.id, user.id); return { user, f, c }; };

  it("accepts a valid campaign and a gift of exactly units x unit price", async () => {
    await probe(async tx => {
      const { f, c } = await setup(tx);
      const created = await tx.donation.create({ data: gift(f.id, { campaignId: c.id, units: 3, unitPrice: 1500, amount: 4500 }) });
      expect(created.units).toBe(3);
    });
  });

  it("refuses campaign prices that are not positive whole rupees", async () => {
    for (const unitPrice of [0, -5, 1500.5]) {
      await refused(async tx => { const u = await owner(tx); const f = await fund(tx); await campaign(tx, f.id, u.id, { unitPrice }); });
    }
  });

  it("refuses unit limits outside 1 to 1000 and a window that closes before it opens", async () => {
    for (const maxUnits of [0, 1001]) await refused(async tx => { const u = await owner(tx); const f = await fund(tx); await campaign(tx, f.id, u.id, { maxUnits }); });
    await refused(async tx => { const u = await owner(tx); const f = await fund(tx); await campaign(tx, f.id, u.id, { closesAt: new Date("2027-02-18T03:30:00Z") }); });
    await refused(async tx => { const u = await owner(tx); const f = await fund(tx); await campaign(tx, f.id, u.id, { closesAt: new Date("2027-02-01T00:00:00Z") }); });
  });

  it("keeps a campaign slug unique", async () => {
    await expect(prisma.$transaction(async tx => {
      const u = await owner(tx); const f = await fund(tx);
      await campaign(tx, f.id, u.id, { slug: "duplicate-slug-probe" });
      await campaign(tx, f.id, u.id, { slug: "duplicate-slug-probe" });
    })).rejects.toBeTruthy();
  });

  it("refuses a gift whose amount is not exactly units x the recorded unit price", async () => {
    for (const amount of [4400, 4501, 1500]) {
      await refused(async tx => { const { f, c } = await setup(tx); await tx.donation.create({ data: gift(f.id, { campaignId: c.id, units: 3, unitPrice: 1500, amount }) }); });
    }
    await refused(async tx => { const { f, c } = await setup(tx); await tx.donation.create({ data: gift(f.id, { campaignId: c.id, units: 0, unitPrice: 1500, amount: 0.01 }) }); });
  });

  it("requires campaign, units and unit price together, or none of them", async () => {
    await refused(async tx => { const { f, c } = await setup(tx); await tx.donation.create({ data: gift(f.id, { campaignId: c.id }) }); });
    await refused(async tx => { const { f } = await setup(tx); await tx.donation.create({ data: gift(f.id, { units: 3, unitPrice: 1500 }) }); });
    await refused(async tx => { const { f, c } = await setup(tx); await tx.donation.create({ data: gift(f.id, { campaignId: c.id, units: 3 }) }); });
    await probe(async tx => { const { f } = await setup(tx); await tx.donation.create({ data: gift(f.id) }); }); // an ordinary fund gift is still fine
  });

  it("never lets a campaign gift attach to an appeal", async () => {
    await refused(async tx => {
      const { user, c } = await setup(tx);
      const appeal = await tx.appeal.create({ data: { slug: `a-${next()}`, title: "Synthetic", summary: "CI only", story: "CI only", category: "MEDICAL", status: "PUBLISHED", beneficiaryName: "Synthetic", goalAmount: 10000, createdById: user.id } });
      await tx.donation.create({ data: gift(null, { appealId: appeal.id, campaignId: c.id, units: 3, unitPrice: 1500, amount: 4500 }) });
    });
  });

  it("will not delete a campaign that has gifts", async () => {
    await expect(prisma.$transaction(async tx => {
      const { f, c } = await setup(tx);
      await tx.donation.create({ data: gift(f.id, { campaignId: c.id, units: 3, unitPrice: 1500, amount: 4500 }) });
      await tx.fundCampaign.delete({ where: { id: c.id } });
    })).rejects.toMatchObject({ code: "P2003" });
  });
});
