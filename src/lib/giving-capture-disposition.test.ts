import { describe, expect, it } from "vitest";
import { classifyCaptureDisposition, captureBusinessIdentity } from "./giving-capture-disposition";

const attempt = {
  provider: "RAZORPAY",
  merchantAccountId: "amaana-domestic",
  environment: "TEST",
  orderId: "order_synthetic_001",
  expectedAmountPaise: 10500,
  currency: "INR",
};
const verified = {
  source: "SERVER_VERIFIED",
  provider: "RAZORPAY",
  merchantAccountId: "amaana-domestic",
  environment: "TEST",
  orderId: "order_synthetic_001",
  paymentId: "pay_synthetic_001",
  amountPaise: 10500,
  currency: "INR",
};
const validInput = { attempt, receipt: verified, priorCapturedReceipts: [], intendedUnitFulfilled: false };

describe("giving capture identity is scoped to provider, merchant and environment", () => {
  it("derives a stable business identity independently of webhook event id", () => {
    const a = captureBusinessIdentity(verified);
    expect(a).toBeTruthy();
    expect(a).toBe(captureBusinessIdentity({ ...verified, providerEventId: "event_synthetic_999" }));
    expect(a).not.toBe(captureBusinessIdentity({ ...verified, paymentId: "pay_synthetic_002" }));
    expect(a).not.toBe(captureBusinessIdentity({ ...verified, merchantAccountId: "another-merchant" }));
    expect(a).not.toBe(captureBusinessIdentity({ ...verified, environment: "LIVE" }));
    expect(a).not.toBe(captureBusinessIdentity({ ...verified, provider: "CASHFREE" }));
  });

  it("rejects invalid and missing identity segments", () => {
    expect(captureBusinessIdentity({ ...verified, paymentId: "" })).toBeNull();
    expect(captureBusinessIdentity({ ...verified, provider: "UNKNOWN" })).toBeNull();
    expect(captureBusinessIdentity({ ...verified, merchantAccountId: " a " })).toBeNull();
    expect(captureBusinessIdentity({ ...verified, environment: "PRODUCTION" })).toBeNull();
    expect(captureBusinessIdentity(null)).toBeNull();
  });
});

describe("offline capture disposition: no money is posted by this helper", () => {
  it("marks a first matched, server-verified capture only eligible for separate posting", () => {
    expect(classifyCaptureDisposition(validInput)).toBe("ELIGIBLE_FOR_POSTING");
  });

  it("fails closed for unsigned/browser-only or structurally invalid evidence", () => {
    expect(classifyCaptureDisposition({ ...validInput, receipt: { ...verified, source: "BROWSER_CALLBACK" } })).toBe("REJECT");
    expect(classifyCaptureDisposition({ ...validInput, receipt: null })).toBe("REJECT");
    expect(classifyCaptureDisposition({ ...validInput, receipt: { ...verified, amountPaise: 10.5 } })).toBe("REJECT");
    expect(classifyCaptureDisposition({ ...validInput, receipt: { ...verified, currency: "USD" } })).toBe("CORRELATION_EXCEPTION");
    expect(classifyCaptureDisposition({ ...validInput, attempt: { ...attempt, expectedAmountPaise: -1 } })).toBe("REJECT");
    expect(classifyCaptureDisposition({ ...validInput, priorCapturedReceipts: null })).toBe("REJECT");
    expect(classifyCaptureDisposition(null)).toBe("REJECT");
  });

  it.each([
    ["provider", { ...verified, provider: "CASHFREE" }],
    ["merchant", { ...verified, merchantAccountId: "other" }],
    ["environment", { ...verified, environment: "LIVE" }],
    ["order", { ...verified, orderId: "other-order" }],
    ["amount", { ...verified, amountPaise: 10501 }],
  ])("flags mismatched %s for reconciliation, never normal capture", (_, receipt) => {
    expect(classifyCaptureDisposition({ ...validInput, receipt })).toBe("CORRELATION_EXCEPTION");
  });

  it("does not book money again on a duplicate capture notification with a different event id", () => {
    expect(classifyCaptureDisposition({
      ...validInput,
      receipt: { ...verified, providerEventId: "event_002" },
      priorCapturedReceipts: [{ ...verified, providerEventId: "event_001" }],
    })).toBe("DUPLICATE_CAPTURE");
  });

  it("escalates contradictory evidence for the same payment business identity", () => {
    for (const conflictingHistory of [
      { ...verified, orderId: "order_synthetic_conflict" },
      { ...verified, amountPaise: 15000 },
      { ...verified, currency: "USD" },
    ]) {
      expect(classifyCaptureDisposition({
        ...validInput,
        priorCapturedReceipts: [conflictingHistory],
      })).toBe("CORRELATION_EXCEPTION");
    }
  });

  it("preserves a second distinct verified capture as an excess exception after fulfilment", () => {
    expect(classifyCaptureDisposition({
      ...validInput,
      receipt: { ...verified, paymentId: "pay_synthetic_002" },
      priorCapturedReceipts: [verified],
      intendedUnitFulfilled: true,
    })).toBe("EXCESS_CAPTURE_EXCEPTION");
  });

  it("does not infer successful fulfilment merely from prior receipts", () => {
    expect(classifyCaptureDisposition({
      ...validInput,
      receipt: { ...verified, paymentId: "pay_synthetic_002" },
      priorCapturedReceipts: [verified],
      intendedUnitFulfilled: false,
    })).toBe("ELIGIBLE_FOR_POSTING");
  });

  it("never treats a payment seen in another account as a duplicate local capture", () => {
    expect(classifyCaptureDisposition({
      ...validInput,
      priorCapturedReceipts: [{ ...verified, merchantAccountId: "another-merchant" }],
    })).toBe("ELIGIBLE_FOR_POSTING");
  });

  it("refuses to proceed when the historical capture collection is malformed", () => {
    expect(classifyCaptureDisposition({
      ...validInput, priorCapturedReceipts: [{ ...verified, paymentId: "" }],
    })).toBe("REJECT");
    expect(classifyCaptureDisposition({
      ...validInput, intendedUnitFulfilled: "false",
    })).toBe("REJECT");
  });
});


describe("capture enum fields require primitive strings", () => {
  it.each([
    ["provider", ["RAZORPAY"]],
    ["environment", ["TEST"]],
    ["provider", { toString: () => "RAZORPAY" }],
    ["environment", { toString: () => "TEST" }],
  ])("rejects coerced %s in every identity boundary", (field, value) => {
    expect(captureBusinessIdentity({ ...verified, [field]: value })).toBeNull();
    expect(classifyCaptureDisposition({
      ...validInput, attempt: { ...attempt, [field]: value },
    })).toBe("REJECT");
    expect(classifyCaptureDisposition({
      ...validInput, receipt: { ...verified, [field]: value },
    })).toBe("REJECT");
    expect(classifyCaptureDisposition({
      ...validInput, priorCapturedReceipts: [{ ...verified, [field]: value }],
    })).toBe("REJECT");
  });
});
