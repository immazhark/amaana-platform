import { describe, expect, it } from "vitest";
import {
  maskFinancialReference, parseFinancialCorroboration,
  parseFinancialCorroborationReview,
} from "./assistance-financial-reconciliation";

const updatedAt = "2026-10-16T08:00:00.000Z";
function form(changes: Record<string, string> = {}) {
  const data = new FormData();
  for (const [name, value] of Object.entries({
    id: "case-synthetic", deliveryRecordId: "delivery-synthetic",
    bankProofDocumentId: "bank-proof-synthetic",
    transactionReference: " abcd1234/009 ",
    amountInr: "1250.5", bankEvidenceAttested: "yes",
    expectedDeliveryUpdatedAt: updatedAt,
    reconciliationId: "reconciliation-synthetic",
    expectedUpdatedAt: updatedAt, state: "EVIDENCE_REVIEWED",
    ...changes,
  })) data.set(name, value);
  return data;
}
describe("private financial evidence corroboration", () => {
  it("normalizes an external reference and exact INR amount without duplicating a ledger", () => {
    expect(parseFinancialCorroboration(form())).toEqual({
      assistanceRequestId: "case-synthetic",
      deliveryRecordId: "delivery-synthetic",
      bankProofDocumentId: "bank-proof-synthetic",
      transactionReference: "ABCD1234/009",
      matchedAmountInr: "1250.50",
      expectedDeliveryUpdatedAt: new Date(updatedAt),
    });
  });
  it.each<Record<string, string>>([
    { transactionReference: "short" }, { transactionReference: "ABC 1234" },
    { transactionReference: "aaaaaaaaaa\u0000" },
    { amountInr: "" }, { amountInr: "0.00" }, { amountInr: "-5" },
    { amountInr: "5.999" }, { amountInr: "2e4" },
    { amountInr: "99999999999" }, { bankEvidenceAttested: "" },
    { bankProofDocumentId: "../another-case" },
    { expectedDeliveryUpdatedAt: "yesterday" },
  ])("rejects malformed or ungrounded financial corroboration (%j)", changes => {
    expect(() => parseFinancialCorroboration(form(changes))).toThrow();
  });
  it("never permits purported bank proof as a File where a reference ID is required", () => {
    const data = form();
    data.set("bankProofDocumentId", new File(["private"], "bank.pdf"));
    expect(() => parseFinancialCorroboration(data)).toThrow();
  });
  it("requires reviewer attestation for evidence review, but not for voiding", () => {
    expect(parseFinancialCorroborationReview(form())).toEqual({
      assistanceRequestId: "case-synthetic",
      reconciliationId: "reconciliation-synthetic",
      state: "EVIDENCE_REVIEWED",
      expectedUpdatedAt: new Date(updatedAt),
    });
    expect(() => parseFinancialCorroborationReview(form({ bankEvidenceAttested: "" })))
      .toThrow("Review the bank proof");
    expect(parseFinancialCorroborationReview(form({ state: "VOIDED", bankEvidenceAttested: "" })).state)
      .toBe("VOIDED");
    expect(() => parseFinancialCorroborationReview(form({ state: "BANK_CLEARED" }))).toThrow();
  });
  it("masks external references outside finance-review access", () => {
    expect(maskFinancialReference("ABCD1234/009")).toBe("••••/009");
    expect(maskFinancialReference("BAD")).toBe("••••");
  });
});
