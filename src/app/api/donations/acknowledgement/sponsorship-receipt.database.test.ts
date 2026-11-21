import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Only the per-client rate limiter is replaced, so this suite does not depend on client-hash configuration. Origin checking,
// token hashing, the real Prisma client and the real response shaping all run.
vi.mock("@/lib/request-security", async importOriginal => ({
  ...(await importOriginal<typeof import("@/lib/request-security")>()),
  enforceAcknowledgementRateLimit: async () => true,
}));

import { createReceiptToken, hashReceiptToken } from "@/lib/donations";
import { prisma } from "@/lib/prisma";
import { POST } from "./route";

const ORIGIN = "http://localhost:3000";

// Opt-in and loopback-only, like the other database suites: never a hosted, staging or live database. Rows are synthetic,
// committed (the route uses its own client) and removed in afterAll.
describe.skipIf(process.env.AMAANA_DATABASE_TESTS !== "true")("private acknowledgement shows the stored Taleem sponsorship (PostgreSQL)", () => {
  const prefix = randomUUID().replaceAll("-", "").slice(0, 16);
  const created: { donationIds: string[]; fundId?: string } = { donationIds: [] };
  const tokens = { sponsorship: createReceiptToken(), ordinary: createReceiptToken() };
  const reference = { sponsorship: `AFD-${prefix}-S`, ordinary: `AFD-${prefix}-O` };

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/amaana") {
      throw new Error("Acknowledgement DB tests require the isolated loopback amaana database");
    }
    vi.stubEnv("NEXT_PUBLIC_APP_URL", ORIGIN);
    const fund = await prisma.fund.create({ data: { slug: `t-${prefix}`, name: "Synthetic Taleem fund", summary: "Synthetic fund for tests only.", status: "ACTIVE" } });
    created.fundId = fund.id;
    const base = {
      fundId: fund.id, donorName: "Synthetic donor", donorEmail: "donor@example.test", provider: "razorpay",
      domesticConfirmedAt: new Date(), status: "CAPTURED" as const, capturedAt: new Date(),
    };
    // 2 units x 3 months x Rs 900 = Rs 5,400. Rs 900 is deliberately not the current Qaida rate (Rs 1,000) and the version
    // is not the current one: the receipt must show what this donor was quoted, not what the catalogue says today.
    const sponsorship = await prisma.donation.create({ data: {
      ...base, referenceNumber: reference.sponsorship, providerOrderId: `order_${prefix}S`, amount: 5_400,
      receiptTokenHash: hashReceiptToken(tokens.sponsorship),
      sponsorshipProgramme: "qaida", sponsorshipUnits: 2, sponsorshipMonths: 3, sponsorshipMonthlyRate: 900, sponsorshipRateVersion: "older-rate-version",
    } });
    const ordinary = await prisma.donation.create({ data: {
      ...base, referenceNumber: reference.ordinary, providerOrderId: `order_${prefix}O`, amount: 500, receiptTokenHash: hashReceiptToken(tokens.ordinary),
    } });
    created.donationIds.push(sponsorship.id, ordinary.id);
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    if (created.donationIds.length) await prisma.donation.deleteMany({ where: { id: { in: created.donationIds } } });
    if (created.fundId) await prisma.fund.delete({ where: { id: created.fundId } });
    await prisma.$disconnect();
  });

  const ask = (ref: string, token: string) => POST(new Request(`${ORIGIN}/api/donations/acknowledgement`, {
    method: "POST", headers: { origin: ORIGIN, "content-type": "application/json" }, body: JSON.stringify({ reference: ref, token }),
  }));

  it("returns the programme, units, months and the rate recorded on the donation, not the live catalogue rate", async () => {
    const response = await ask(reference.sponsorship, tokens.sponsorship);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    const text = await response.text();
    const body = JSON.parse(text);
    expect(body.donation.sponsorship).toEqual({ programme: "Qaida", units: 2, months: 3, monthlyRate: 900 });
    expect(body.donation.amount).toBe(5_400);
    // The internal rate version is never part of the private response.
    expect(text).not.toContain("older-rate-version");
    expect(text).not.toContain("rateVersion");
  });

  it("returns no sponsorship for an ordinary gift", async () => {
    const response = await ask(reference.ordinary, tokens.ordinary);
    expect(response.status).toBe(200);
    expect((await response.json()).donation.sponsorship).toBeNull();
  });

  it("refuses a wrong token and a token that belongs to a different donation, with no sponsorship detail", async () => {
    for (const [ref, token] of [[reference.sponsorship, createReceiptToken()], [reference.sponsorship, tokens.ordinary]] as const) {
      const response = await ask(ref, token);
      expect(response.status).toBe(404);
      const text = await response.text();
      expect(JSON.parse(text)).toEqual({ found: false });
      expect(text).not.toContain("Qaida");
    }
  });
});
