import { describe, expect, it } from "vitest";
import { formatAcknowledgementINR, isAcknowledgementResponse } from "./private-record-response";

const reference = "AFD-2026-PRIVATE";
const valid = {
  found: true,
  presentation: {
    tone: "captured", heading: "Donation received", summary: "Your contribution was recorded.",
    statusLabel: "Payment verified",
  },
  donation: {
    referenceNumber: reference, receiptNumber: "ACK-AFD-2026-PRIVATE",
    donorName: "Synthetic donor", givingIntent: "GENERAL", amount: 500,
    refundedAmount: 0, recordDate: "2026-09-22T10:00:00.000Z",
    providerPaymentId: "pay_synthetic", appeal: { title: "Verified need", slug: "verified-need" },
  },
};

describe("private donation acknowledgement read boundary", () => {
  it("accepts a complete verified, pending or refunded response and not-found", () => {
    expect(isAcknowledgementResponse(valid, reference)).toBe(true);
    expect(isAcknowledgementResponse({ found: false }, reference)).toBe(true);
    expect(isAcknowledgementResponse({
      ...valid, presentation: { ...valid.presentation, tone: "captured" },
      donation: { ...valid.donation, amount: 500.25, refundedAmount: 10.5, givingIntent: "SADAQAH" },
    }, reference)).toBe(true);
    expect(isAcknowledgementResponse({
      ...valid, presentation: { ...valid.presentation, tone: "refunded" },
      donation: { ...valid.donation, refundedAmount: 500, givingIntent: "ZAKAT" },
    }, reference)).toBe(true);
  });

  it.each([null, [], {}, { found: true }, { found: "true" }, 1])(
    "rejects malformed envelopes %j", input => {
      expect(isAcknowledgementResponse(input, reference)).toBe(false);
    },
  );

  it("rejects a mismatched reference, unknown giving intention and forged presentation tone", () => {
    expect(isAcknowledgementResponse(valid, "AFD-DIFFERENT")).toBe(false);
    expect(isAcknowledgementResponse({ ...valid, donation: { ...valid.donation, givingIntent: "OTHER" } }, reference)).toBe(false);
    expect(isAcknowledgementResponse({ ...valid, presentation: { ...valid.presentation, tone: "verified" } }, reference)).toBe(false);
    expect(isAcknowledgementResponse({ ...valid, donation: { ...valid.donation, appeal: null } }, reference)).toBe(false);
  });

  it("rejects non-finite, negative, excessive-refund or fractional-paise amounts", () => {
    for (const amount of [NaN, Infinity, -1, 0, 0.015, 100000000000000]) {
      expect(isAcknowledgementResponse({ ...valid, donation: { ...valid.donation, amount } }, reference)).toBe(false);
    }
    for (const refundedAmount of [NaN, Infinity, -1, 500.01, 0.015]) {
      expect(isAcknowledgementResponse({ ...valid, donation: { ...valid.donation, refundedAmount } }, reference)).toBe(false);
    }
  });

  it("rejects refund-state contradictions and noncanonical dates", () => {
    expect(isAcknowledgementResponse({ ...valid, presentation: { ...valid.presentation, tone: "refunded" } }, reference)).toBe(false);
    expect(isAcknowledgementResponse({ ...valid, presentation: { ...valid.presentation, tone: "pending" }, donation: { ...valid.donation, refundedAmount: 10 } }, reference)).toBe(false);
    for (const recordDate of ["Invalid Date", "2026-02-30T00:00:00.000Z", "2026-09-22", 123, null]) {
      expect(isAcknowledgementResponse({ ...valid, donation: { ...valid.donation, recordDate } }, reference)).toBe(false);
    }
  });
});

describe("private acknowledgement exact monetary display", () => {
  it("keeps paise for partial refunds without adding cents to whole-rupee amounts", () => {
    expect(formatAcknowledgementINR(500)).toContain("500");
    expect(formatAcknowledgementINR(500)).not.toMatch(/500[.,]00/);
    expect(formatAcknowledgementINR(10.5)).toMatch(/10[.]50/);
    expect(formatAcknowledgementINR(100.05)).toMatch(/100[.]05/);
    expect(formatAcknowledgementINR(399.71)).toMatch(/399[.]71/);
  });
});
