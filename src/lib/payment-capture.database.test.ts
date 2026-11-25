import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "./prisma";
import { captureDonation } from "./payment-processing";

// Opt-in and loopback-only: this suite never mutates a hosted, staging or live database. Synthetic data only.
describe.skipIf(process.env.AMAANA_DATABASE_TESTS !== "true")("payment capture PostgreSQL invariants", () => {
  const prefix = randomUUID().replaceAll("-", "");
  const created: { userId: string; appealId: string; donationId: string }[] = [];

  beforeAll(() => {
    const url = new URL(process.env.DATABASE_URL!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/amaana") {
      throw new Error("Payment capture DB tests require the isolated loopback amaana database");
    }
  });

  afterAll(async () => {
    for (const f of created.reverse()) {
      await prisma.notification.deleteMany({ where: { donationId: f.donationId } });
      await prisma.donation.delete({ where: { id: f.donationId } });
      await prisma.appeal.delete({ where: { id: f.appealId } });
      await prisma.user.delete({ where: { id: f.userId } });
    }
    await prisma.$disconnect();
  });

  async function fixture() {
    const key = prefix + created.length;
    const user = await prisma.user.create({ data: { name: "Synthetic operator", email: key + "@example.test" } });
    const appeal = await prisma.appeal.create({ data: {
      slug: key, title: "Synthetic capture test", summary: "CI only", story: "CI only", category: "MEDICAL", status: "PUBLISHED",
      beneficiaryName: "Synthetic", goalAmount: 100000, amountRaised: 0, createdById: user.id,
    } });
    const orderId = "order_" + key;
    const donation = await prisma.donation.create({ data: {
      referenceNumber: key, appealId: appeal.id, donorName: "Synthetic donor", donorEmail: key + "@example.test",
      domesticConfirmedAt: new Date(), amount: 100, feeContributionAmount: 0, status: "CREATED", providerOrderId: orderId,
      receiptTokenHash: "synthetic-not-a-real-token",
    } });
    created.push({ userId: user.id, appealId: appeal.id, donationId: donation.id });
    return { donation, appeal, orderId, paymentId: "pay_" + key };
  }

  async function expectCapturedOnce(f: Awaited<ReturnType<typeof fixture>>) {
    const donation = await prisma.donation.findUniqueOrThrow({ where: { id: f.donation.id } });
    const appeal = await prisma.appeal.findUniqueOrThrow({ where: { id: f.appeal.id } });
    expect(donation.status).toBe("CAPTURED");
    expect(donation.providerPaymentId).toBe(f.paymentId);
    expect(donation.receiptNumber).not.toBeNull();
    expect(appeal.amountRaised.toNumber()).toBe(100);
    expect(await prisma.notification.count({ where: { donationId: donation.id, templateKey: "donation-acknowledgement" } })).toBe(1);
  }

  it("concurrent duplicate captures of one payment raise the total and queue the acknowledgement exactly once", async () => {
    const f = await fixture();
    const results = await Promise.allSettled([1, 2, 3].map(() => captureDonation(f.orderId, f.paymentId, 10000)));
    expect(results.some(result => result.status === "fulfilled")).toBe(true);
    // A serialization conflict may exhaust its retries for one caller; the others must still leave exactly one effect.
    await captureDonation(f.orderId, f.paymentId, 10000);
    await expectCapturedOnce(f);
  });

  it("a later replay of an already captured payment changes nothing", async () => {
    const f = await fixture();
    await captureDonation(f.orderId, f.paymentId, 10000);
    await captureDonation(f.orderId, f.paymentId, 10000);
    await expectCapturedOnce(f);
  });

  it("refuses a different payment for an order that is already captured, and a wrong amount", async () => {
    const f = await fixture();
    await captureDonation(f.orderId, f.paymentId, 10000);
    await expect(captureDonation(f.orderId, "pay_other_" + prefix, 10000)).rejects.toThrow(/different captured payment/);
    const g = await fixture();
    await expect(captureDonation(g.orderId, g.paymentId, 9999)).rejects.toThrow(/does not match/);
    expect((await prisma.donation.findUniqueOrThrow({ where: { id: g.donation.id } })).status).toBe("CREATED");
  });
});
