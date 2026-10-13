import { describe, expect, it } from "vitest";
import { isAcknowledgementResponse, isTrackingResponse } from "./private-record-response";

const reference = "AMAANA-RECORD-TEST";
const acknowledgement = {
  found: true,
  presentation: { tone: "captured", heading: "Payment verified", summary: "Private record", statusLabel: "Verified" },
  donation: {
    referenceNumber: reference, receiptNumber: null, donorName: "Synthetic donor", givingIntent: "GENERAL",
    amount: 100, refundedAmount: 0, recordDate: "2026-10-13T00:00:00.000Z", providerPaymentId: null,
    appeal: { title: "Synthetic appeal", slug: "synthetic-appeal" },
  },
};

describe("private read response contracts", () => {
  it("accepts existing verified, pending, failed and refunded records", () => {
    for (const tone of ["captured", "pending", "failed", "refunded"]) {
      expect(isAcknowledgementResponse({ ...acknowledgement, presentation: { ...acknowledgement.presentation, tone } }, reference)).toBe(true);
    }
    expect(isAcknowledgementResponse({ found: false }, reference)).toBe(true);
    expect(isTrackingResponse({ found: false })).toBe(true);
  });
  for (const value of [null, [], true, 123, "found", {}, { found: "true" }, { found: true }]) {
    it(`rejects malformed envelope ${JSON.stringify(value)}`, () => {
      expect(isAcknowledgementResponse(value, reference)).toBe(false);
      expect(isTrackingResponse(value)).toBe(false);
    });
  }
  for (const [field, value] of [
    ["referenceNumber", "OTHER-REFERENCE"], ["donorName", {}], ["receiptNumber", 42],
    ["givingIntent", "toString"], ["amount", "100"], ["amount", -1], ["amount", Infinity],
    ["refundedAmount", 101], ["recordDate", "invalid"], ["providerPaymentId", []],
    ["appeal", null], ["appeal", { title: "Unsafe path", slug: "../admin" }],
  ] as const) {
    it(`rejects invalid donation ${field}: ${JSON.stringify(value)}`, () => {
      expect(isAcknowledgementResponse({ ...acknowledgement, donation: { ...acknowledgement.donation, [field]: value } }, reference)).toBe(false);
    });
  }
  it("does not coerce malformed presentation values", () => {
    for (const tone of [{ toString: {} }, [], "unknown", null]) {
      expect(isAcknowledgementResponse({ ...acknowledgement, presentation: { ...acknowledgement.presentation, tone } }, reference)).toBe(false);
    }
    expect(isAcknowledgementResponse({ ...acknowledgement, presentation: { ...acknowledgement.presentation, heading: {} } }, reference)).toBe(false);
  });
  it("accepts valid tracking timestamps and safe future status text", () => {
    for (const status of ["SUBMITTED", "toString"]) {
      expect(isTrackingResponse({ found: true, status, createdAt: "2026-10-13T00:00:00Z", updatedAt: "2026-10-14T00:00:00Z" })).toBe(true);
    }
  });
  it("rejects invalid tracking status and timestamps", () => {
    for (const patch of [{ status: {} }, { createdAt: "bad" }, { updatedAt: null }, { status: " " }]) {
      expect(isTrackingResponse({ found: true, status: "SUBMITTED", createdAt: "2026-10-13T00:00:00Z", updatedAt: "2026-10-14T00:00:00Z", ...patch })).toBe(false);
    }
  });
});
