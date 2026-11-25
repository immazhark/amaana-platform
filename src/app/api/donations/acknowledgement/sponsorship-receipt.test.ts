import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { donation: { findUnique: mocks.findUnique } } }));
vi.mock("@/lib/request-security", () => ({ isSameOrigin: () => true, enforceAcknowledgementRateLimit: async () => true }));

import { hashReceiptToken } from "@/lib/donations";
import { isAcknowledgementResponse } from "@/lib/private-record-response";
import { POST } from "./route";

const token = "receipt-token-at-least-twenty-characters";
const reference = "AFD-2026-TALEEM01";
const dec = (n: number) => ({ toNumber: () => n });
const row = (over: Record<string, unknown> = {}) => ({
  receiptTokenHash: hashReceiptToken(token), status: "CAPTURED", amount: dec(3000), refundedAmount: dec(0), feeContributionAmount: dec(0),
  receiptNumber: "ACK-AFD-2026-TALEEM01", referenceNumber: reference, donorName: "Test Donor", givingIntent: "SADAQAH",
  capturedAt: new Date("2026-11-18T10:00:00Z"), refundedAt: null, createdAt: new Date("2026-11-18T09:59:00Z"), providerPaymentId: "pay_x",
  appeal: null, fund: { name: "Taleem Fund", slug: "taleem" }, units: null, unitPrice: null, campaign: null,
  sponsorshipProgramme: "qaida", sponsorshipUnits: 1, sponsorshipMonths: 3, sponsorshipMonthlyRate: dec(1000), sponsorshipRateVersion: "approved-2026-11", ...over,
});
const ask = () => POST(new Request("https://amaana.example/api/donations/acknowledgement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference, token }) }));

describe("receipts for Taleem programme sponsorships", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the programme name, units, months and rate, in a response the client accepts", async () => {
    mocks.findUnique.mockResolvedValue(row());
    const body = await (await ask()).json();
    expect(body.donation.sponsorship).toEqual({ programme: "Qaida", units: 1, months: 3, monthlyRate: 1000 });
    expect(isAcknowledgementResponse(body, reference)).toBe(true);
  });

  it.each(["CAPTURED", "PENDING_VERIFICATION"])("uses destination-neutral acknowledgement copy for %s Taleem gifts", async status => {
    mocks.findUnique.mockResolvedValue(row({ status, ...(status === "PENDING_VERIFICATION" ? { receiptNumber: null, capturedAt: null, providerPaymentId: null } : {}) }));
    const response = await ask();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(isAcknowledgementResponse(body, reference)).toBe(true);
    expect(body.donation.fund).toEqual({ name: "Taleem Fund", slug: "taleem" });
    expect(body.donation.appeal).toBeNull();
    expect(body.presentation.summary).not.toMatch(/\bappeal\b/i);
    expect(body.presentation.statusLabel).toBe(status === "CAPTURED" ? "Payment verified" : "Verification pending");
    if (status === "PENDING_VERIFICATION") {
      expect(body.presentation.summary).toContain("UTR/reference");
      expect(body.presentation.summary).toContain("do not submit the same transfer again");
    }
  });

  it("shows the rate recorded on the donation, never the live catalogue rate", async () => {
    // Qaida is Rs 1,000 in the live catalogue; this donor was quoted Rs 900 under an earlier version.
    mocks.findUnique.mockResolvedValue(row({ sponsorshipMonthlyRate: dec(900), amount: dec(2700), sponsorshipRateVersion: "baseline-2026-09" }));
    const body = await (await ask()).json();
    expect(body.donation.sponsorship.monthlyRate).toBe(900);
    expect(body.donation.amount).toBe(2700);
  });

  it("never exposes the rate version or any internal sponsorship column", async () => {
    mocks.findUnique.mockResolvedValue(row());
    const body = await (await ask()).json();
    expect(JSON.stringify(body)).not.toMatch(/approved-2026-11|sponsorshipRateVersion|sponsorshipProgramme/);
  });

  it("falls back to the stored programme id if the programme later leaves the catalogue", async () => {
    mocks.findUnique.mockResolvedValue(row({ sponsorshipProgramme: "retired-programme" }));
    const body = await (await ask()).json();
    expect(body.donation.sponsorship.programme).toBe("retired-programme");
    expect(isAcknowledgementResponse(body, reference)).toBe(true);
  });

  it("returns no sponsorship for an ordinary fund gift", async () => {
    mocks.findUnique.mockResolvedValue(row({ sponsorshipProgramme: null, sponsorshipUnits: null, sponsorshipMonths: null, sponsorshipMonthlyRate: null, sponsorshipRateVersion: null }));
    const body = await (await ask()).json();
    expect(body.donation.sponsorship).toBeNull();
    expect(isAcknowledgementResponse(body, reference)).toBe(true);
  });
});
