import { describe, expect, it } from "vitest";
import { classifyDirectTransferResponse, directTransferFieldErrors } from "./direct-transfer-feedback";

const receipt = { referenceNumber: "AFD-2026-12345678", receiptToken: "a".repeat(32), status: "PENDING_VERIFICATION" };

describe("direct transfer submission outcomes", () => {
  it("accepts only a pending receipt with usable private tracking credentials", () => {
    expect(classifyDirectTransferResponse(202, receipt)).toEqual({ kind: "accepted", referenceNumber: receipt.referenceNumber, receiptToken: receipt.receiptToken });
  });

  it.each([
    null, {}, { ...receipt, receiptToken: undefined }, { ...receipt, receiptToken: "short" },
    { ...receipt, referenceNumber: "../../admin" }, { ...receipt, status: "CAPTURED" },
  ])("treats malformed successful receipt %j as uncertain", body => {
    expect(classifyDirectTransferResponse(202, body)).toEqual({ kind: "uncertain" });
  });

  it.each([500, 502, 503])("never recommends retry after HTTP %s, even with a structured error", status => {
    expect(classifyDirectTransferResponse(status, { error: "Please try again", fieldErrors: { amount: ["Ignored"] } })).toEqual({ kind: "uncertain" });
  });

  it("keeps an already-submitted reference locked for reconciliation", () => {
    expect(classifyDirectTransferResponse(409, { error: "Already submitted", submissionUncertain: true })).toEqual({ kind: "uncertain" });
  });

  it("allows correction after an explicit field rejection", () => {
    expect(classifyDirectTransferResponse(400, { error: "Check the reference", fieldErrors: { transferReference: ["Use the bank reference"] } }))
      .toEqual({ kind: "rejected", message: "Check the reference", fieldErrors: { transferReference: ["Use the bank reference"] } });
  });

  it("does not trust an error-shaped successful response as proof that no write occurred", () => {
    expect(classifyDirectTransferResponse(200, { error: "Try again" })).toEqual({ kind: "uncertain" });
  });

  it("drops hidden/unknown fields and malformed messages and bounds displayed feedback", () => {
    expect(directTransferFieldErrors({
      donorEmail: [null, "", "Enter an email"],
      appealId: ["Hidden internal identifier"],
      receiptToken: ["Private credential"],
      amount: ["a".repeat(1000)],
      donorName: "Invalid array",
    })).toEqual({ donorEmail: ["Enter an email"], amount: ["a".repeat(300)] });
    expect(directTransferFieldErrors(null)).toEqual({});
    expect(directTransferFieldErrors([])).toEqual({});
  });
});
