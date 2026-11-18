import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { donation: { findUnique: mocks.findUnique } } }));
vi.mock("@/lib/request-security", () => ({ isSameOrigin: () => true, enforceAcknowledgementRateLimit: async () => true }));

import { hashReceiptToken } from "@/lib/donations";
import { isAcknowledgementResponse } from "@/lib/private-record-response";
import { POST } from "./route";

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
