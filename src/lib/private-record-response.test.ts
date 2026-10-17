import { describe, expect, it } from "vitest";
import { isAcknowledgementResponse } from "./private-record-response";
import { isTrackingResponse } from "./private-tracking-response";

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
  it("does not accept a missing appeal link with an unredacted beneficiary title", () => {
    expect(isAcknowledgementResponse({
      ...acknowledgement,
      donation: { ...acknowledgement.donation, appeal: { title: "Unredacted beneficiary name", slug: null } },
    }, reference)).toBe(false);
  });
  it("accepts a fund receipt with original approved giving intention and no appeal link", () => {
    expect(isAcknowledgementResponse({
      ...acknowledgement,
      donation: {
        ...acknowledgement.donation,
        designationKind: "FUND",
        appeal: { title: "Approved giving programme", slug: null },
      },
    }, reference)).toBe(true);
  });
  it("rejects unsupported religious intent on fund receipts", () => {
    expect(isAcknowledgementResponse({
      ...acknowledgement,
      donation: {
        ...acknowledgement.donation, designationKind: "FUND", givingIntent: "ZAKAT",
        appeal: { title: "Unreviewed programme", slug: null },
      },
    }, reference)).toBe(false);
  });
  it("rejects a misleading public appeal link on fund receipts", () => {
    expect(isAcknowledgementResponse({
      ...acknowledgement,
      donation: {
        ...acknowledgement.donation, designationKind: "FUND",
        appeal: { title: "Approved programme", slug: "some-beneficiary" },
      },
    }, reference)).toBe(false);
  });
  it("accepts a confidential receipt whose appeal has no public link", () => {
    expect(isAcknowledgementResponse({
      ...acknowledgement,
      donation: { ...acknowledgement.donation, appeal: { title: "Confidential assistance appeal", slug: null } },
    }, reference)).toBe(true);
  });
  it("accepts existing verified, pending, failed and refunded records", () => {
    for (const tone of ["captured", "pending", "failed", "refunded"]) {
      expect(isAcknowledgementResponse({ ...acknowledgement, presentation: { ...acknowledgement.presentation, tone }, donation: { ...acknowledgement.donation, refundedAmount: tone === "refunded" ? 100 : 0 } }, reference)).toBe(true);
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
  it.each([
    { amount: 100.001 }, { amount: Number.MAX_SAFE_INTEGER },
    { refundedAmount: 0.001 },
  ])("rejects unrepresentable private monetary data %o", patch => {
    expect(isAcknowledgementResponse({ ...acknowledgement, donation: { ...acknowledgement.donation, ...patch } }, reference)).toBe(false);
  });
  it("rejects a claimed full refund with only partial refund totals", () => {
    expect(isAcknowledgementResponse({ ...acknowledgement,
      presentation: { ...acknowledgement.presentation, tone: "refunded" },
      donation: { ...acknowledgement.donation, refundedAmount: 25 },
    }, reference)).toBe(false);
  });
  it("accepts exact paise such as 0.29 without floating-point rejection", () => {
    expect(isAcknowledgementResponse({ ...acknowledgement, donation: { ...acknowledgement.donation, amount: 0.29 } }, reference)).toBe(true);
  });

  it("does not coerce malformed presentation values", () => {
    for (const tone of [{ toString: {} }, [], "unknown", null]) {
      expect(isAcknowledgementResponse({ ...acknowledgement, presentation: { ...acknowledgement.presentation, tone }, donation: { ...acknowledgement.donation, refundedAmount: tone === "refunded" ? 100 : 0 } }, reference)).toBe(false);
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
