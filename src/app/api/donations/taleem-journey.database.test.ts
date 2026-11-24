import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const provider = vi.hoisted(() => ({ createOrder: vi.fn(), fetchPayment: vi.fn() }));
vi.mock("@/lib/env", () => ({ validateProductionEnvironment: () => undefined }));
// Only the network calls to Razorpay and the per-client rate limiters are replaced. The routes, Prisma, the transaction
// helper, origin checking, token hashing and the response shaping are all real.
vi.mock("@/lib/razorpay", async importOriginal => ({
  ...(await importOriginal<typeof import("@/lib/razorpay")>()),
  createRazorpayOrder: provider.createOrder,
  fetchRazorpayPayment: provider.fetchPayment,
  verifyWebhookSignature: () => true,
}));
vi.mock("@/lib/request-security", async importOriginal => ({
  ...(await importOriginal<typeof import("@/lib/request-security")>()),
  enforceDonationRateLimit: async () => true,
  enforceAcknowledgementRateLimit: async () => true,
}));

import { prisma } from "@/lib/prisma";
import { POST as acknowledgement } from "./acknowledgement/route";
import { POST as order } from "./order/route";
import { POST as directTransfer } from "./direct-transfer/route";
import { POST as webhook } from "../webhooks/razorpay/route";

const ORIGIN = "http://localhost:3000";

// Opt-in and loopback-only, like the other database suites. Synthetic rows only, removed in afterAll.
describe.skipIf(process.env.AMAANA_DATABASE_TESTS !== "true")("Taleem programme sponsorship, end to end on PostgreSQL", () => {
  const prefix = randomUUID().replaceAll("-", "").slice(0, 16);
  const email = `${prefix}@example.test`;
  const created: { fundId?: string; createdFund: boolean; donationIds: string[] } = { createdFund: false, donationIds: [] };
  const ids = { order: `order_${prefix}J1`, payment: `pay_${prefix}J1`, refund: `rfnd_${prefix}J1` };
  const sponsorship = { sponsorshipProgramme: "qaida", sponsorshipUnits: 2, sponsorshipMonths: 3 };
  // 2 units x 3 months x Rs 1,000 (approved-2026-11) = Rs 6,000.
  const goodBody = { fundSlug: "taleem", donorName: "Synthetic donor", donorEmail: email, amount: 6000, givingIntent: "SADAQAH", domesticConfirmed: true, ...sponsorship };
  const state: { donationId?: string; receiptToken?: string; reference?: string } = {};

  let isolatedDatabaseConfirmed = false;
  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/amaana") {
      throw new Error("Taleem journey DB tests require the isolated loopback amaana database");
    }
    isolatedDatabaseConfirmed = true;
    vi.stubEnv("NEXT_PUBLIC_APP_URL", ORIGIN);
    const existing = await prisma.fund.findFirst({ where: { slug: "taleem" } });
    if (existing) {
      created.fundId = existing.id;
      if (existing.status !== "ACTIVE") throw new Error("The seeded taleem fund is not ACTIVE in the test database");
    } else {
      const fund = await prisma.fund.create({ data: { slug: "taleem", name: "Taleem Fund", summary: "Synthetic Taleem fund for tests only.", status: "ACTIVE" } });
      created.fundId = fund.id;
      created.createdFund = true;
    }
    provider.createOrder.mockImplementation(async (input: { amountPaise: number; receipt: string }) => ({
      id: ids.order, amount: input.amountPaise, currency: "INR", receipt: input.receipt, status: "created",
    }));
  });

  afterEach(() => { vi.unstubAllEnvs(); vi.stubEnv("NEXT_PUBLIC_APP_URL", ORIGIN); });

  afterAll(async () => {
    vi.unstubAllEnvs();
    if (!isolatedDatabaseConfirmed) return;
    const donations = await prisma.donation.findMany({ where: { donorEmail: email }, select: { id: true } });
    const donationIds = donations.map(row => row.id);
    if (donationIds.length) {
      await prisma.notification.deleteMany({ where: { donationId: { in: donationIds } } });
      await prisma.paymentEvent.deleteMany({ where: { donationId: { in: donationIds } } });
      await prisma.refundLedger.deleteMany({ where: { donationId: { in: donationIds } } });
      await prisma.donation.deleteMany({ where: { id: { in: donationIds } } });
    }
    if (created.createdFund && created.fundId) await prisma.fund.delete({ where: { id: created.fundId } });
    await prisma.$disconnect();
  });

  const json = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    new Request(`${ORIGIN}${path}`, { method: "POST", headers: { origin: ORIGIN, "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
  const placeOrder = (body: unknown) => order(json("/api/donations/order", body));
  const sendWebhook = (event: string, entity: Record<string, unknown>, eventId: string) => webhook(json("/api/webhooks/razorpay", {
    event, payload: event.startsWith("refund") ? { refund: { entity } } : { payment: { entity } },
  }, { "x-razorpay-signature": "mocked", "x-razorpay-event-id": `${prefix}-${eventId}` }));
  const ask = () => acknowledgement(json("/api/donations/acknowledgement", { reference: state.reference, token: state.receiptToken }));
  const rowsFor = () => prisma.donation.count({ where: { donorEmail: email } });

  it.each([
    ["fund giving open, Taleem switch off", { FUND_GIVING_ENABLED: "true", TALEEM_SPONSORSHIP_ENABLED: "false" }],
    ["Taleem switch on, fund giving closed", { FUND_GIVING_ENABLED: "false", TALEEM_SPONSORSHIP_ENABLED: "true" }],
    ["both switches off", { FUND_GIVING_ENABLED: "false", TALEEM_SPONSORSHIP_ENABLED: "false" }],
  ])("refuses a sponsorship order and writes nothing when %s", async (_name, env) => {
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
    const response = await placeOrder(goodBody);
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(await rowsFor()).toBe(0);
    expect(provider.createOrder).not.toHaveBeenCalled();
  });

  it("refuses a tampered amount with nothing written and no provider order", async () => {
    vi.stubEnv("FUND_GIVING_ENABLED", "true");
    vi.stubEnv("TALEEM_SPONSORSHIP_ENABLED", "true");
    const response = await placeOrder({ ...goodBody, amount: 5999 });
    expect(response.status).toBe(409);
    expect(await rowsFor()).toBe(0);
    expect(provider.createOrder).not.toHaveBeenCalled();
  });

  it("creates the order at the server's price and stores the quote on the donation", async () => {
    vi.stubEnv("FUND_GIVING_ENABLED", "true");
    vi.stubEnv("TALEEM_SPONSORSHIP_ENABLED", "true");
    const response = await placeOrder(goodBody);
    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload).toMatchObject({ orderId: ids.order, amount: 600_000, currency: "INR" });
    expect(provider.createOrder).toHaveBeenCalledOnce();
    state.donationId = payload.donationId;
    state.receiptToken = payload.receiptToken;
    const row = await prisma.donation.findUniqueOrThrow({ where: { id: payload.donationId } });
    state.reference = row.referenceNumber;
    created.donationIds.push(row.id);
    expect(row).toMatchObject({
      status: "CREATED", providerOrderId: ids.order, sponsorshipProgramme: "qaida", sponsorshipUnits: 2, sponsorshipMonths: 3, sponsorshipRateVersion: "approved-2026-11",
    });
    expect(row.amount.toNumber()).toBe(6000);
    expect(row.sponsorshipMonthlyRate?.toNumber()).toBe(1000);
  });

  it("does not mark a payment captured when the provider amount differs from the order", async () => {
    const response = await sendWebhook("payment.captured", { id: ids.payment, order_id: ids.order, currency: "INR", status: "captured", captured: true, amount: 500_000 }, "wrong-amount");
    expect(response.status).toBeGreaterThanOrEqual(400);
    const row = await prisma.donation.findUniqueOrThrow({ where: { id: state.donationId! } });
    expect(row.status).toBe("CREATED");
    expect(row.providerPaymentId).toBeNull();
  });

  it("captures on the matching signed event, once, even when the event is replayed", async () => {
    const entity = { id: ids.payment, order_id: ids.order, currency: "INR", status: "captured", captured: true, amount: 600_000 };
    expect((await sendWebhook("payment.captured", entity, "capture")).status).toBe(200);
    expect((await sendWebhook("payment.captured", entity, "capture")).status).toBe(200);
    const row = await prisma.donation.findUniqueOrThrow({ where: { id: state.donationId! } });
    expect(row).toMatchObject({ status: "CAPTURED", providerPaymentId: ids.payment });
    expect(row.receiptNumber).toBeTruthy();
    expect(await prisma.paymentEvent.count({ where: { donationId: state.donationId!, eventType: "payment.captured" } })).toBe(1);
  });

  it("shows the sponsorship on the private acknowledgement at the stored rate", async () => {
    const response = await ask();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.donation).toMatchObject({ amount: 6000, refundedAmount: 0, sponsorship: { programme: "Qaida", units: 2, months: 3, monthlyRate: 1000 } });
    expect(JSON.stringify(body)).not.toContain("approved-2026-11");
  });

  it("records a partial refund once and keeps the sponsorship on the acknowledgement", async () => {
    const refund = { id: ids.refund, payment_id: ids.payment, amount: 100_000, currency: "INR", status: "processed" };
    expect((await sendWebhook("refund.processed", refund, "refund")).status).toBe(200);
    expect((await sendWebhook("refund.processed", refund, "refund")).status).toBe(200);
    const row = await prisma.donation.findUniqueOrThrow({ where: { id: state.donationId! } });
    expect(row.refundedAmount.toNumber()).toBe(1000);
    expect(await prisma.refundLedger.count({ where: { donationId: state.donationId! } })).toBe(1);
    const body = await (await ask()).json();
    expect(body.donation).toMatchObject({ refundedAmount: 1000, sponsorship: { programme: "Qaida", units: 2, months: 3, monthlyRate: 1000 } });
  });

  describe("direct transfer sponsorship claims", () => {
    const makeClaim = (reference: string, overrides: Record<string, string> = {}) => {
      const form = new FormData();
      for (const [key, value] of Object.entries({
        fundSlug: "taleem", donorName: "Synthetic transfer donor", donorEmail: email,
        amount: "6000", givingIntent: "SADAQAH", domesticConfirmed: "true",
        sponsorshipProgramme: "qaida", sponsorshipUnits: "2", sponsorshipMonths: "3",
        paymentMethod: "DIRECT_UPI", transferReference: reference,
        transferredAt: new Date(Date.now() - 60_000).toISOString(), ...overrides,
      })) form.set(key, value);
      return directTransfer(new Request(`${ORIGIN}/api/donations/direct-transfer`, {
        method: "POST", headers: { origin: ORIGIN }, body: form,
      }));
    };

    it.each([
      ["true", "false"], ["false", "true"], ["false", "false"],
    ])("rejects a transfer without creating a claim when fund=%s and Taleem=%s", async (fund, taleem) => {
      vi.stubEnv("FUND_GIVING_ENABLED", fund);
      vi.stubEnv("TALEEM_SPONSORSHIP_ENABLED", taleem);
      const count = await rowsFor();
      const result = await makeClaim(`${prefix}-DISABLED-${fund}-${taleem}`);
      expect(result.status).toBe(409);
      expect(await rowsFor()).toBe(count);
    });

    it("rejects a tampered transfer amount without reserving its reference", async () => {
      vi.stubEnv("FUND_GIVING_ENABLED", "true");
      vi.stubEnv("TALEEM_SPONSORSHIP_ENABLED", "true");
      const reference = `${prefix}-BAD-AMOUNT`;
      const count = await rowsFor();
      const response = await makeClaim(reference, { amount: "5999" });
      expect(response.status).toBe(409);
      expect(await rowsFor()).toBe(count);
      expect(await prisma.donation.findFirst({ where: { transferReference: reference.toUpperCase() } })).toBeNull();
    });

    it.each(["DIRECT_UPI", "BANK_TRANSFER"] as const)("stores a %s claim as pending, preserves its quote and refuses duplicate references", async paymentMethod => {
      vi.stubEnv("FUND_GIVING_ENABLED", "true");
      vi.stubEnv("TALEEM_SPONSORSHIP_ENABLED", "true");
      const reference = `${prefix}-${paymentMethod}`;
      const count = await rowsFor();
      const calls = provider.createOrder.mock.calls.length;
      const response = await makeClaim(reference, { paymentMethod });
      expect(response.status).toBe(202);
      const payload = await response.json();
      expect(payload).toMatchObject({ status: "PENDING_VERIFICATION" });
      const row = await prisma.donation.findUniqueOrThrow({ where: { referenceNumber: payload.referenceNumber } });
      expect(row).toMatchObject({
        status: "PENDING_VERIFICATION", paymentMethod, providerOrderId: null, providerPaymentId: null,
        receiptNumber: null, capturedAt: null, sponsorshipProgramme: "qaida",
        sponsorshipUnits: 2, sponsorshipMonths: 3, sponsorshipRateVersion: "approved-2026-11",
      });
      expect(row.amount.toNumber()).toBe(6000);
      expect(row.sponsorshipMonthlyRate?.toNumber()).toBe(1000);
      expect(await rowsFor()).toBe(count + 1);
      expect(provider.createOrder.mock.calls.length).toBe(calls);

      const pending = await acknowledgement(json("/api/donations/acknowledgement", {
        reference: payload.referenceNumber, token: payload.receiptToken,
      }));
      expect(pending.status).toBe(200);
      expect(await pending.json()).toMatchObject({
        found: true, presentation: { tone: "pending", statusLabel: "Verification pending" },
        donation: { receiptNumber: null, sponsorship: { programme: "Qaida", units: 2, months: 3, monthlyRate: 1000 } },
      });
      const denied = await acknowledgement(json("/api/donations/acknowledgement", {
        reference: payload.referenceNumber, token: randomUUID(),
      }));
      expect(denied.status).toBe(404);
      expect(await denied.json()).toEqual({ found: false });

      const duplicate = await makeClaim(reference, { paymentMethod });
      expect(duplicate.status).toBe(409);
      expect(await rowsFor()).toBe(count + 1);
      expect(provider.createOrder.mock.calls.length).toBe(calls);
    });
  });
});
