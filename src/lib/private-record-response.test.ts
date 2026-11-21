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

describe("AF-N23 private acknowledgement shape provenance", () => {
  it("rejects inherited found flags, donation properties and appeal labels", () => {
    expect(isAcknowledgementResponse(Object.create({ found: false }), reference)).toBe(false);
    expect(isAcknowledgementResponse(Object.create(valid), reference)).toBe(false);
    expect(isAcknowledgementResponse({
      ...valid, donation: Object.create(valid.donation),
    }, reference)).toBe(false);
    expect(isAcknowledgementResponse({
      ...valid, donation: {
        ...valid.donation, appeal: Object.create(valid.donation.appeal),
      },
    }, reference)).toBe(false);
  });

  it("rejects private data attached to a not-found response", () => {
    expect(isAcknowledgementResponse({
      found: false, donation: valid.donation,
    }, reference)).toBe(false);
    expect(isAcknowledgementResponse({ found: false, presentation: valid.presentation }, reference)).toBe(false);
    expect(isAcknowledgementResponse({ found: false }, reference)).toBe(true);
  });

  // Policy: unknown own keys are tolerated but never read by the client, which renders
  // only the validated fields. Required fields stay strictly checked alongside them.
  it("tolerates unknown own keys without weakening required-field validation", () => {
    const extra = { ...valid, internalNote: "never rendered", donation: { ...valid.donation, extra: 1 } };
    expect(isAcknowledgementResponse(extra, reference)).toBe(true);
    expect(isAcknowledgementResponse({ ...extra, donation: { ...extra.donation, amount: "500" } }, reference)).toBe(false);
    expect(isAcknowledgementResponse({ ...extra, presentation: { ...valid.presentation, tone: "unknown" } }, reference)).toBe(false);
    expect(isAcknowledgementResponse({ found: false, internalNote: "x" }, reference)).toBe(false);
  });
});

describe("acknowledgement destination: exactly one of an appeal or a fund", () => {
  const withDestination = (appeal: unknown, fund?: unknown) => ({
    ...valid, donation: { ...valid.donation, appeal, ...(fund === undefined ? {} : { fund }) },
  });
  it("accepts a fund donation that has no appeal", () => {
    expect(isAcknowledgementResponse(withDestination(null, { name: "Orphan Fund", slug: "orphan" }), reference)).toBe(true);
  });
  it("still accepts an appeal donation, with or without an explicit null fund", () => {
    expect(isAcknowledgementResponse(withDestination({ title: "Verified need", slug: "verified-need" }), reference)).toBe(true);
    expect(isAcknowledgementResponse(withDestination({ title: "Verified need", slug: "verified-need" }, null), reference)).toBe(true);
  });
  it.each([
    ["both an appeal and a fund", { title: "A", slug: "a" }, { name: "F", slug: "f" }],
    ["neither", null, null],
    ["no appeal and no fund key", null, undefined],
    ["a fund with a malformed slug", null, { name: "F", slug: "Not A Slug" }],
    ["a fund with a blank name", null, { name: " ", slug: "f" }],
    ["a fund missing its slug", null, { name: "F" }],
    ["a non-object fund", null, "orphan"],
    ["an appeal with a malformed slug", { title: "A", slug: "../x" }, null],
  ])("rejects %s", (_name, appeal, fund) => {
    expect(isAcknowledgementResponse(withDestination(appeal, fund), reference)).toBe(false);
  });
  it("accepts a fully refunded fee-covered gift once the refund is reported as the donation's own share", () => {
    expect(isAcknowledgementResponse({
      ...valid, presentation: { ...valid.presentation, tone: "refunded" },
      donation: { ...valid.donation, refundedAmount: 500, feeContributionAmount: 12.09, appeal: null, fund: { name: "Orphan Fund", slug: "orphan" } },
    }, reference)).toBe(true);
  });
});

describe("acknowledgement covered fee and seasonal-initiative line", () => {
  const withDonation = (extra: Record<string, unknown>) => ({ ...valid, donation: { ...valid.donation, appeal: null, fund: { name: "Orphan Fund", slug: "orphan" }, ...extra } });
  const campaign = { title: "Eid kits", units: 3, unitLabel: "kits", unitPrice: 1500 };

  it("accepts a covered fee and a well-formed campaign, and still accepts both being absent or null", () => {
    expect(isAcknowledgementResponse(withDonation({ feeContributionAmount: 12.09, campaign }), reference)).toBe(true);
    expect(isAcknowledgementResponse(withDonation({ feeContributionAmount: 0, campaign: null }), reference)).toBe(true);
    expect(isAcknowledgementResponse(withDonation({}), reference)).toBe(true);
  });
  it.each([
    ["a negative fee", { feeContributionAmount: -1 }],
    ["a non-finite fee", { feeContributionAmount: Number.POSITIVE_INFINITY }],
    ["a fee with fractional paise", { feeContributionAmount: 1.005 }],
    ["a string fee", { feeContributionAmount: "12.09" }],
    ["a campaign with zero units", { campaign: { ...campaign, units: 0 } }],
    ["a campaign with fractional units", { campaign: { ...campaign, units: 1.5 } }],
    ["a campaign with a blank title", { campaign: { ...campaign, title: " " } }],
    ["a campaign missing its unit price", { campaign: { title: "Eid kits", units: 3, unitLabel: "kits" } }],
    ["a campaign with a non-positive unit price", { campaign: { ...campaign, unitPrice: 0 } }],
    ["a non-object campaign", { campaign: "eid-kits" }],
  ])("rejects %s", (_name, extra) => {
    expect(isAcknowledgementResponse(withDonation(extra), reference)).toBe(false);
  });
});
