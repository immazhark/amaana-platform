import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const provider = vi.hoisted(() => ({ fetchPayment: vi.fn() }));
vi.mock("@/lib/env", () => ({ validateProductionEnvironment: () => undefined }));
vi.mock("@/lib/razorpay", () => ({
  verifyWebhookSignature: () => true,
  fetchRazorpayPayment: provider.fetchPayment,
}));

import { prisma } from "@/lib/prisma";
import { approvedFundDesignationSnapshot } from "@/lib/giving-funds";
import * as refundAccounting from "@/lib/refund-accounting";
import { POST } from "./route";

// Opt-in and loopback-only: this suite never mutates a hosted/staging/live DB.
describe.skipIf(process.env.AMAANA_DATABASE_TESTS !== "true")("refund entity PostgreSQL invariants", () => {
  const prefix = randomUUID().replaceAll("-", "");
  const fixtures: { userId: string; appealId: string; donationId: string }[] = [];
  const fundFixtures: { donationId: string; fundId: string; userIds: string[] }[] = [];

  beforeAll(() => {
    const url = new URL(process.env.DATABASE_URL!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/amaana") {
      throw new Error("Refund DB tests require the isolated loopback amaana database");
    }
  });

  afterAll(async () => {
    for (const f of fundFixtures.reverse()) {
      await prisma.notification.deleteMany({ where: { donationId: f.donationId } });
      await prisma.paymentEvent.deleteMany({ where: { donationId: f.donationId } });
      await prisma.refundLedger.deleteMany({ where: { donationId: f.donationId } });
      await prisma.donation.delete({ where: { id: f.donationId } });
      await prisma.givingFund.delete({ where: { id: f.fundId } });
      for (const userId of f.userIds) await prisma.user.delete({ where: { id: userId } });
    }
    for (const f of fixtures.reverse()) {
      await prisma.notification.deleteMany({ where: { donationId: f.donationId } });
      await prisma.paymentEvent.deleteMany({ where: { donationId: f.donationId } });
      await prisma.refundLedger.deleteMany({ where: { donationId: f.donationId } });
      await prisma.donation.delete({ where: { id: f.donationId } });
      await prisma.appeal.delete({ where: { id: f.appealId } });
      await prisma.user.delete({ where: { id: f.userId } });
    }
    await prisma.$disconnect();
  });

  async function fixture(captured = true) {
    const key = prefix + fixtures.length;
    const user = await prisma.user.create({ data: { name: "Synthetic operator", email: key + "@example.test" } });
    const appeal = await prisma.appeal.create({ data: {
      slug: key, title: "Synthetic refund test", summary: "CI only", story: "CI only",
      category: "MEDICAL", status: "PUBLISHED", beneficiaryName: "Synthetic",
      goalAmount: 1000, amountRaised: captured ? 100 : 0, createdById: user.id,
    } });
    const paymentId = "pay_" + key;
    const orderId = "order_" + key;
    const donation = await prisma.donation.create({ data: {
      referenceNumber: key, appealId: appeal.id, donorName: "Synthetic donor",
      donorEmail: key + "@example.test", domesticConfirmedAt: new Date(),
      amount: 100, status: captured ? "CAPTURED" : "CREATED",
      providerOrderId: orderId, providerPaymentId: captured ? paymentId : null,
      receiptTokenHash: "synthetic-not-a-real-token",
    } });
    fixtures.push({ userId: user.id, appealId: appeal.id, donationId: donation.id });
    return { donation, appeal, paymentId, orderId, refundId: "rfnd_" + key };
  }

  function request(f: { paymentId: string; refundId: string }, eventId: string, amount = 2500) {
    return new Request("https://amaana.example/api/webhooks/razorpay", {
      method: "POST",
      headers: { "x-razorpay-signature": "mocked", "x-razorpay-event-id": prefix + eventId },
      body: JSON.stringify({ event: "refund.processed", payload: { refund: {
        entity: { id: f.refundId, payment_id: f.paymentId, amount, currency: "INR", status: "processed" },
      } } }),
    });
  }

  async function expectTotals(f: Awaited<ReturnType<typeof fixture>>, refunded: number, notifications = 1) {
    const donation = await prisma.donation.findUniqueOrThrow({ where: { id: f.donation.id } });
    const appeal = await prisma.appeal.findUniqueOrThrow({ where: { id: f.appeal.id } });
    expect(donation.refundedAmount.toNumber()).toBe(refunded);
    expect(appeal.amountRaised.toNumber()).toBe(100 - refunded);
    expect(await prisma.notification.count({ where: { donationId: donation.id, templateKey: "donation-refund-processed" } })).toBe(notifications);
  }

  it("applies one entity once for distinct concurrent event IDs and subsequent replays", async () => {
    const f = await fixture();
    const responses = await Promise.all(["raceA", "raceB"].map(id => POST(request(f, id))));
    expect(responses.map(r => r.status)).toEqual([200, 200]);
    expect((await POST(request(f, "raceC"))).status).toBe(200);
    expect((await POST(request(f, "raceA"))).status).toBe(200);
    await expectTotals(f, 25);
    expect(await prisma.refundLedger.count({ where: { donationId: f.donation.id } })).toBe(1);
    expect(await prisma.paymentEvent.count({ where: { donationId: f.donation.id } })).toBe(3);
  });

  it("serializes different concurrent partial refunds without losing either", async () => {
    const f = await fixture();
    const responses = await Promise.all([
      POST(request(f, "partialA", 2500)),
      POST(request({ ...f, refundId: f.refundId + "B" }, "partialB", 3000)),
    ]);
    expect(responses.map(r => r.status)).toEqual([200, 200]);
    await expectTotals(f, 55, 2);
  });

  it("rolls back a conflicting identity including its incoming event", async () => {
    const f = await fixture();
    expect((await POST(request(f, "original"))).status).toBe(200);
    expect((await POST(request(f, "conflict", 3500))).status).toBe(500);
    expect(await prisma.paymentEvent.findUnique({ where: { providerEventId: prefix + "conflict" } })).toBeNull();
    await expectTotals(f, 25);
  });

  it("rolls back the claim when accounting fails, then permits the same event to retry", async () => {
    const f = await fixture();
    const update = vi.spyOn(refundAccounting, "calculateRefundAccounting").mockImplementationOnce(() => {
      throw new Error("synthetic failure after ledger claim");
    });
    expect((await POST(request(f, "retry"))).status).toBe(500);
    update.mockRestore();
    expect(await prisma.refundLedger.findUnique({ where: { providerRefundId: f.refundId } })).toBeNull();
    expect((await POST(request(f, "retry"))).status).toBe(200);
    await expectTotals(f, 25);
  });

  it("captures a known order before an early refund and does not repeat capture on replay", async () => {
    const f = await fixture(false);
    provider.fetchPayment.mockResolvedValue({ id: f.paymentId, order_id: f.orderId, amount: 10000, currency: "INR", status: "refunded" });
    expect((await POST(request(f, "early"))).status).toBe(200);
    expect((await POST(request(f, "earlyAgain"))).status).toBe(200);
    await expectTotals(f, 25);
    expect(await prisma.notification.count({ where: { donationId: f.donation.id, templateKey: "donation-acknowledgement" } })).toBe(1);
  });

  it("enforces uniqueness even for direct database inserts", async () => {
    const f = await fixture();
    const data = { providerRefundId: f.refundId, providerPaymentId: f.paymentId, donationId: f.donation.id, amount: 25, currency: "INR" };
    await prisma.refundLedger.create({ data });
    await expect(prisma.refundLedger.create({ data })).rejects.toMatchObject({ code: "P2002" });
  });
  function failedPaymentRequest(f: Awaited<ReturnType<typeof fixture>>, paymentId: string, eventId: string) {
    return new Request("https://amaana.example/api/webhooks/razorpay", {
      method: "POST",
      headers: { "x-razorpay-signature": "mocked", "x-razorpay-event-id": prefix + eventId },
      body: JSON.stringify({ event: "payment.failed", payload: { payment: {
        entity: { id: paymentId, order_id: f.orderId, amount: 10000, currency: "INR", status: "failed" },
      } } }),
    });
  }

  it("records and replays an older failed attempt without overwriting a newer authorization", async () => {
    const f = await fixture(false);
    await prisma.donation.update({ where: { id: f.donation.id }, data: {
      status: "AUTHORIZED", providerPaymentId: f.paymentId,
    } });
    const eventId = "olderAttempt";
    expect((await POST(failedPaymentRequest(f, f.paymentId + "old", eventId))).status).toBe(200);
    expect((await POST(failedPaymentRequest(f, f.paymentId + "old", eventId))).status).toBe(200);
    const donation = await prisma.donation.findUniqueOrThrow({ where: { id: f.donation.id } });
    expect(donation.status).toBe("AUTHORIZED");
    expect(donation.providerPaymentId).toBe(f.paymentId);
    expect(donation.failedAt).toBeNull();
    expect(await prisma.paymentEvent.count({ where: { donationId: donation.id } })).toBe(1);
    expect((await prisma.appeal.findUniqueOrThrow({ where: { id: f.appeal.id } })).amountRaised.toNumber()).toBe(0);
    expect(await prisma.notification.count({ where: { donationId: donation.id } })).toBe(0);
  });

  it.each(["CREATED", "AUTHORIZED"] as const)("still fails a matching %s attempt without changing accounting", async status => {
    const f = await fixture(false);
    if (status === "AUTHORIZED") await prisma.donation.update({ where: { id: f.donation.id }, data: {
      status, providerPaymentId: f.paymentId,
    } });
    expect((await POST(failedPaymentRequest(f, f.paymentId, "matching" + status))).status).toBe(200);
    const donation = await prisma.donation.findUniqueOrThrow({ where: { id: f.donation.id } });
    expect(donation.status).toBe("FAILED");
    expect(donation.providerPaymentId).toBe(f.paymentId);
    expect(donation.failedAt).toBeInstanceOf(Date);
    expect(await prisma.paymentEvent.count({ where: { donationId: donation.id } })).toBe(1);
    expect((await prisma.appeal.findUniqueOrThrow({ where: { id: f.appeal.id } })).amountRaised.toNumber()).toBe(0);
    expect(await prisma.notification.count({ where: { donationId: donation.id } })).toBe(0);
  });
  it("persists an approved fund-only refund and replay without modifying appeal totals", async () => {
    const label = prefix + "-fund";
    const creator = await prisma.user.create({ data: { name: "Fund creator", email: label + "c@example.test" } });
    const editor = await prisma.user.create({ data: { name: "Fund editor", email: label + "e@example.test" } });
    const approver = await prisma.user.create({ data: { name: "Independent reviewer", email: label + "a@example.test" } });
    const fund = await prisma.givingFund.create({ data: {
      slug: label, name: "Independently approved giving fund",
      purpose: "A reviewed domestic charitable programme restricted to documented support.",
      disclosure: "Donations support independently reviewed beneficiaries and documented charitable work.",
      accountCode: "TEST-" + prefix.slice(0, 20).toUpperCase(), currency: "INR",
      acceptedIntents: ["GENERAL", "SADAQAH"], status: "APPROVED", revision: 4,
      createdById: creator.id, lastEditedById: editor.id,
      approvedById: approver.id, approvedAt: new Date(),
    } });
    const snapshot = approvedFundDesignationSnapshot(fund, 4, "GENERAL");
    const paymentId = "pay_fund_" + prefix;
    const donation = await prisma.donation.create({ data: {
      referenceNumber: "AFD-FUND-" + prefix, appealId: null, fundId: fund.id,
      designationSnapshot: snapshot,
      donorName: "Synthetic donor", donorEmail: label + "@example.test",
      domesticConfirmedAt: new Date(), amount: 100, status: "CAPTURED",
      providerOrderId: "order_fund_" + prefix, providerPaymentId: paymentId,
      receiptTokenHash: "synthetic-not-a-real-token",
    } });
    fundFixtures.push({ donationId: donation.id, fundId: fund.id, userIds: [creator.id, editor.id, approver.id] });
    const refundId = "rfnd_fund_" + prefix;
    const f = { paymentId, refundId };

    expect((await POST(request(f, "fundRefundOne", 2500))).status).toBe(200);
    expect((await POST(request(f, "fundRefundReplay", 2500))).status).toBe(200);
    const result = await prisma.donation.findUniqueOrThrow({ where: { id: donation.id } });
    expect(result.appealId).toBeNull();
    expect(result.fundId).toBe(fund.id);
    expect(result.refundedAmount.toNumber()).toBe(25);
    expect(result.status).toBe("CAPTURED");
    expect(await prisma.refundLedger.count({ where: { donationId: donation.id } })).toBe(1);
    expect(await prisma.notification.count({ where: { donationId: donation.id, templateKey: "donation-refund-processed" } })).toBe(1);
    await expect(prisma.donation.update({
      where: { id: donation.id }, data: { givingIntent: "SADAQAH" },
    })).rejects.toThrow();
    await prisma.givingFund.update({ where: { id: fund.id }, data: { status: "PAUSED" } });
    await expect(prisma.donation.create({ data: {
      referenceNumber: "AFD-PAUSED-" + prefix, fundId: fund.id, appealId: null,
      designationSnapshot: snapshot, donorName: "Another synthetic donor",
      donorEmail: label + "@example.test", domesticConfirmedAt: new Date(),
      amount: 10, receiptTokenHash: "synthetic-not-a-real-token",
    } })).rejects.toThrow();
  });

});
