import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Only the per-client rate limiter is replaced; origin checking, token hashing, the real Prisma client, the real
// transaction helper and the real response shaping all run.
vi.mock("@/lib/request-security", async importOriginal => ({
  ...(await importOriginal<typeof import("@/lib/request-security")>()),
  enforceAcknowledgementRateLimit: async () => true,
}));

import { createReceiptToken, hashReceiptToken } from "@/lib/donations";
import { parsePrivateDonationAcknowledgementLocation } from "@/lib/private-donation-ack-location";
import { prisma } from "@/lib/prisma";
import { reissueReceiptLink } from "@/lib/receipt-link-reissue";
import { POST } from "./route";

const ORIGIN = "http://localhost:3000";

// Opt-in and loopback-only, like the other database suites: never a hosted, staging or live database. Rows are synthetic,
// committed (the route uses its own client) and removed in afterAll.
describe.skipIf(process.env.AMAANA_DATABASE_TESTS !== "true")("staff reissue of a private acknowledgement link (PostgreSQL)", () => {
  const prefix = randomUUID().replaceAll("-", "").slice(0, 16);
  const ids: { userId?: string; fundId?: string; donationId?: string } = {};
  const extraDonationIds: string[] = [];
  let isolatedTargetAccepted = false;
  const originalToken = createReceiptToken();
  const reference = `AFD-${prefix}-R`;

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/amaana") {
      throw new Error("Receipt reissue DB tests require the isolated loopback amaana database");
    }
    isolatedTargetAccepted = true;
    vi.stubEnv("NEXT_PUBLIC_APP_URL", ORIGIN);
    const user = await prisma.user.create({ data: { name: "Synthetic operator", email: `${prefix}@example.test` } });
    ids.userId = user.id;
    const fund = await prisma.fund.create({ data: { slug: `t-${prefix}`, name: "Synthetic fund", summary: "Synthetic fund for tests only.", status: "ACTIVE" } });
    ids.fundId = fund.id;
    const donation = await prisma.donation.create({ data: {
      fundId: fund.id, referenceNumber: reference, donorName: "Synthetic donor", donorEmail: "donor@example.test", provider: "razorpay",
      providerOrderId: `order_${prefix}R`, domesticConfirmedAt: new Date(), status: "CAPTURED", capturedAt: new Date(), amount: 500,
      receiptTokenHash: hashReceiptToken(originalToken),
    } });
    ids.donationId = donation.id;
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    if (!isolatedTargetAccepted) return;
    const donationIds = [...extraDonationIds, ...(ids.donationId ? [ids.donationId] : [])];
    if (donationIds.length) {
      await prisma.auditEvent.deleteMany({ where: { entityType: "Donation", entityId: { in: donationIds } } });
      await prisma.donation.deleteMany({ where: { id: { in: donationIds } } });
    }
    if (ids.fundId) await prisma.fund.delete({ where: { id: ids.fundId } });
    if (ids.userId) await prisma.user.delete({ where: { id: ids.userId } });
    await prisma.$disconnect();
  });

  const ask = (token: string) => POST(new Request(`${ORIGIN}/api/donations/acknowledgement`, {
    method: "POST", headers: { origin: ORIGIN, "content-type": "application/json" }, body: JSON.stringify({ reference, token }),
  }));

  it("revokes the old link and serves the new one, and audits the reissue without the token", async () => {
    expect((await ask(originalToken)).status).toBe(200);

    const { path } = await reissueReceiptLink({ donationId: ids.donationId!, actorId: ids.userId!, reason: "Synthetic: donor lost the link" });
    const newToken = parsePrivateDonationAcknowledgementLocation("", path.slice(path.indexOf("#")))!;
    expect(newToken).not.toBe(originalToken);

    const old = await ask(originalToken);
    expect(old.status).toBe(404);
    expect(await old.json()).toEqual({ found: false });
    const fresh = await ask(newToken);
    expect(fresh.status).toBe(200);
    expect((await fresh.json()).donation.referenceNumber).toBe(reference);

    const events = await prisma.auditEvent.findMany({ where: { entityType: "Donation", entityId: ids.donationId!, action: "donation.receipt_link.reissue" } });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ actorId: ids.userId, metadata: { reason: "Synthetic: donor lost the link" } });
    const stored = JSON.stringify(events[0]);
    expect(stored).not.toContain(newToken);
    expect(stored).not.toContain(hashReceiptToken(newToken));
  });

  it("rotates a Taleem acknowledgement without changing the historical quote, financial status or receipt identity", async () => {
    const oldToken = createReceiptToken();
    const sponsorshipReference = `AFD-${prefix}-T`;
    const donation = await prisma.donation.create({ data: {
      fundId: ids.fundId!, referenceNumber: sponsorshipReference,
      donorName: "Synthetic sponsorship donor", donorEmail: "sponsor@example.test",
      provider: "razorpay", providerOrderId: `order_${prefix}T`,
      domesticConfirmedAt: new Date(), status: "CAPTURED", capturedAt: new Date(),
      amount: 5400, receiptNumber: `ACK-${sponsorshipReference}`,
      receiptTokenHash: hashReceiptToken(oldToken),
      sponsorshipProgramme: "qaida", sponsorshipUnits: 2, sponsorshipMonths: 3,
      sponsorshipMonthlyRate: 900, sponsorshipRateVersion: "older-rate-version",
    } });
    extraDonationIds.push(donation.id);
    const askSponsorship = (token: string) => POST(new Request(`${ORIGIN}/api/donations/acknowledgement`, {
      method: "POST", headers: { origin: ORIGIN, "content-type": "application/json" },
      body: JSON.stringify({ reference: sponsorshipReference, token }),
    }));
    const before = await askSponsorship(oldToken);
    expect(before.status).toBe(200);
    const original = await before.json();
    expect(original.donation).toMatchObject({
      referenceNumber: sponsorshipReference, receiptNumber: donation.receiptNumber, amount: 5400,
      sponsorship: { programme: "Qaida", units: 2, months: 3, monthlyRate: 900 },
    });
    const reason = "Synthetic: restore sponsorship acknowledgement";
    const { path } = await reissueReceiptLink({ donationId: donation.id, actorId: ids.userId!, reason });
    const freshToken = parsePrivateDonationAcknowledgementLocation("", path.slice(path.indexOf("#")))!;
    expect(freshToken).not.toBe(oldToken);
    const revoked = await askSponsorship(oldToken);
    expect(revoked.status).toBe(404);
    expect(await revoked.json()).toEqual({ found: false });
    const fresh = await askSponsorship(freshToken);
    expect(fresh.status).toBe(200);
    expect(fresh.headers.get("cache-control")).toContain("no-store");
    const text = await fresh.text();
    expect(JSON.parse(text)).toEqual(original);
    expect(text).not.toContain("older-rate-version");
    const stored = await prisma.donation.findUniqueOrThrow({ where: { id: donation.id } });
    expect(stored).toMatchObject({
      status: donation.status, capturedAt: donation.capturedAt, receiptNumber: donation.receiptNumber,
      providerOrderId: donation.providerOrderId, amount: donation.amount,
      sponsorshipProgramme: donation.sponsorshipProgramme, sponsorshipUnits: donation.sponsorshipUnits,
      sponsorshipMonths: donation.sponsorshipMonths, sponsorshipMonthlyRate: donation.sponsorshipMonthlyRate,
      sponsorshipRateVersion: donation.sponsorshipRateVersion, receiptTokenHash: hashReceiptToken(freshToken),
    });
    expect(await prisma.notification.count({ where: { donationId: donation.id } })).toBe(0);
    const events = await prisma.auditEvent.findMany({ where: { entityType: "Donation", entityId: donation.id } });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ action: "donation.receipt_link.reissue", actorId: ids.userId, metadata: { reason } });
    expect(JSON.stringify(events)).not.toContain(freshToken);
    expect(JSON.stringify(events)).not.toContain(hashReceiptToken(freshToken));
  });

  it("refuses an unknown donation and leaves the audit trail unchanged", async () => {
    const before = await prisma.auditEvent.count({ where: { action: "donation.receipt_link.reissue" } });
    await expect(reissueReceiptLink({ donationId: `missing-${prefix}`, actorId: ids.userId!, reason: "Synthetic: unknown donation" })).rejects.toThrow("Donation not found.");
    expect(await prisma.auditEvent.count({ where: { action: "donation.receipt_link.reissue" } })).toBe(before);
  });
});
