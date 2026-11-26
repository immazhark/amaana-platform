import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { donation: { findUnique: mocks.findUnique } } }));
vi.mock("@/lib/request-security", () => ({ isSameOrigin: () => true, enforceAcknowledgementRateLimit: async () => true }));

import { hashReceiptToken } from "@/lib/donations";
import { isAcknowledgementResponse } from "@/lib/private-record-response";
import { POST } from "./route";
import { POST as PDF } from "./pdf/route";

const token = "receipt-token-at-least-twenty-characters";
const dec = (n: number) => ({ toNumber: () => n });
const row = (over: Record<string, unknown> = {}) => ({
  receiptTokenHash: hashReceiptToken(token), status: "CAPTURED", amount: dec(5000), refundedAmount: dec(0), feeContributionAmount: dec(0),
  receiptNumber: "ACK-AFD-2026-FUND", referenceNumber: "AFD-2026-FUND0001", donorName: "Test Donor", givingIntent: "ZAKAT",
  capturedAt: new Date("2026-11-18T10:00:00Z"), refundedAt: null, createdAt: new Date("2026-11-18T09:59:00Z"), providerPaymentId: "pay_x",
  appeal: null, fund: { name: "Orphan Fund", slug: "orphan" }, ...over,
});
const ask = () => POST(new Request("https://amaana.example/api/donations/acknowledgement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference: "AFD-2026-FUND0001", token }) }));

describe("receipts for designated-fund donations", () => {
  beforeEach(() => vi.clearAllMocks());
  it("returns the fund, no appeal, and a response the client accepts", async () => {
    mocks.findUnique.mockResolvedValue(row());
    const body = await (await ask()).json();
    expect(body.donation.fund).toEqual({ name: "Orphan Fund", slug: "orphan" });
    expect(body.donation.appeal).toBeNull();
    expect(isAcknowledgementResponse(body, "AFD-2026-FUND0001")).toBe(true);
  });
  it("reports a full refund of a fee-covered gift as the donation's own share, so the client accepts it", async () => {
    mocks.findUnique.mockResolvedValue(row({ status: "REFUNDED", amount: dec(5000), refundedAmount: dec(5120.86), feeContributionAmount: dec(120.86), refundedAt: new Date("2026-11-19T10:00:00Z") }));
    const body = await (await ask()).json();
    expect(body.donation.refundedAmount).toBe(5000);
    expect(body.donation.feeContributionAmount).toBe(120.86);
    expect(body.presentation.tone).toBe("refunded");
    expect(isAcknowledgementResponse(body, "AFD-2026-FUND0001")).toBe(true);
  });
  it("treats a refund of only the covered fee as a fully paid gift, not a refunded one", async () => {
    mocks.findUnique.mockResolvedValue(row({ refundedAmount: dec(120.86), feeContributionAmount: dec(120.86) }));
    const body = await (await ask()).json();
    expect(body.donation.refundedAmount).toBe(0);
    expect(body.presentation.tone).toBe("captured");
  });
  it("never reveals a record for a wrong token", async () => {
    mocks.findUnique.mockResolvedValue(row({ receiptTokenHash: hashReceiptToken("a-completely-different-token-value") }));
    const response = await ask();
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ found: false });
  });
});

describe("receipts for seasonal-campaign donations", () => {
  beforeEach(() => vi.clearAllMocks());
  const campaignRow = (over: Record<string, unknown> = {}) => row({
    units: 3, unitPrice: dec(1500), amount: dec(4500),
    campaign: { title: "Eid gift kits", unitLabel: "kit", unitLabelPlural: "kits" }, ...over,
  });
  it("returns the units and unit price recorded on the donation, with the plural label, and the client accepts it", async () => {
    mocks.findUnique.mockResolvedValue(campaignRow());
    const body = await (await ask()).json();
    expect(body.donation.campaign).toEqual({ title: "Eid gift kits", units: 3, unitLabel: "kits", unitPrice: 1500 });
    expect(isAcknowledgementResponse(body, "AFD-2026-FUND0001")).toBe(true);
  });
  it("uses the singular label for one unit", async () => {
    mocks.findUnique.mockResolvedValue(campaignRow({ units: 1, unitPrice: dec(1500), amount: dec(1500) }));
    expect((await (await ask()).json()).donation.campaign.unitLabel).toBe("kit");
  });
  it("reports no campaign for an ordinary fund gift", async () => {
    mocks.findUnique.mockResolvedValue(row());
    expect((await (await ask()).json()).donation.campaign).toBeNull();
  });
  it("reports no campaign line when the donation recorded no units, rather than inventing one", async () => {
    mocks.findUnique.mockResolvedValue(campaignRow({ units: null, unitPrice: null }));
    expect((await (await ask()).json()).donation.campaign).toBeNull();
  });
});

describe("on-screen and downloadable acknowledgement record-date parity", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    { name: "partial principal refund across IST midnight", refundedAmount: 129.5, fee: 29.5, capturedAt: new Date("2026-11-21T18:29:59Z"), refundedAt: new Date("2026-11-21T18:30:00Z"), expected: "22 November 2026", iso: "2026-11-21T18:30:00.000Z" },
    { name: "fee-only refund", refundedAmount: 29.5, fee: 29.5, capturedAt: new Date("2026-11-21T18:29:59Z"), refundedAt: new Date("2026-11-23T18:30:00Z"), expected: "24 November 2026", iso: "2026-11-23T18:30:00.000Z" },
    { name: "verified capture", refundedAmount: 0, fee: 0, capturedAt: new Date("2026-11-21T18:29:59Z"), refundedAt: null, expected: "21 November 2026", iso: "2026-11-21T18:29:59.000Z" },
    { name: "legacy verified record without a capture timestamp", refundedAmount: 0, fee: 0, capturedAt: null, refundedAt: null, expected: "21 November 2026", iso: "2026-11-20T18:30:00.000Z" },
  ])("uses the same recorded date for $name", async scenario => {
    const record = row({ refundedAmount: dec(scenario.refundedAmount), feeContributionAmount: dec(scenario.fee), capturedAt: scenario.capturedAt, refundedAt: scenario.refundedAt, createdAt: new Date("2026-11-20T18:30:00Z") });
    mocks.findUnique.mockResolvedValue(record);
    const screen = await ask();
    expect(screen.status).toBe(200);
    const body = await screen.json();
    expect(body.donation.recordDate).toBe(scenario.iso);
    const response = await PDF(new Request("https://amaana.example/api/donations/acknowledgement/pdf", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ reference: record.referenceNumber as string, token }) }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store, private");
    const pdf = Buffer.from(await response.arrayBuffer()).toString("latin1");
    expect(pdf).toContain("Date recorded: " + scenario.expected);
    expect(pdf).not.toContain(token);
    expect(mocks.findUnique).toHaveBeenCalledTimes(2);
    for (const [query] of mocks.findUnique.mock.calls) {
      expect(query.select).toMatchObject({ createdAt: true, capturedAt: true, refundedAt: true });
    }
  });
});
