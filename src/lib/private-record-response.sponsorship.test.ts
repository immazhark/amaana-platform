import { describe, expect, it } from "vitest";
import { isAcknowledgementResponse } from "./private-record-response";

const reference = "AFD-2026-SPONSOR1";
const response = (sponsorship: unknown) => ({
  found: true,
  presentation: { tone: "captured", heading: "Donation received", summary: "Recorded.", statusLabel: "Payment verified" },
  donation: {
    referenceNumber: reference, receiptNumber: "ACK-1", donorName: "Synthetic Donor", givingIntent: "SADAQAH", amount: 3000, refundedAmount: 0,
    recordDate: "2026-11-18T10:00:00.000Z", providerPaymentId: "pay_x", appeal: null, fund: { name: "Taleem Fund", slug: "taleem" },
    ...(sponsorship === undefined ? {} : { sponsorship }),
  },
});
const valid = { programme: "Qaida", units: 2, months: 6, monthlyRate: 1000 };

describe("acknowledgement sponsorship validation", () => {
  it("accepts a complete sponsorship, a null one, and a response without the field", () => {
    expect(isAcknowledgementResponse(response(valid), reference)).toBe(true);
    expect(isAcknowledgementResponse(response(null), reference)).toBe(true);
    expect(isAcknowledgementResponse(response(undefined), reference)).toBe(true);
  });

  it("tolerates an unknown extra field like the rest of the response, and the client never renders it", () => {
    expect(isAcknowledgementResponse(response({ ...valid, internalNote: "never rendered" }), reference)).toBe(true);
  });

  it.each([
    ["zero units", { ...valid, units: 0 }],
    ["more than 50 units", { ...valid, units: 51 }],
    ["a fractional unit count", { ...valid, units: 1.5 }],
    ["a duration that is not offered", { ...valid, months: 2 }],
    ["a zero rate", { ...valid, monthlyRate: 0 }],
    ["a negative rate", { ...valid, monthlyRate: -1000 }],
    ["a rate with sub-paise precision", { ...valid, monthlyRate: 1000.001 }],
    ["a blank programme", { ...valid, programme: "  " }],
    ["a non-text programme", { ...valid, programme: 7 }],
    ["a missing field", { programme: "Qaida", units: 1, months: 3 }],
    ["a non-object", "Qaida"],
  ])("rejects %s", (_name, sponsorship) => {
    expect(isAcknowledgementResponse(response(sponsorship), reference)).toBe(false);
  });
});
