import { describe, expect, it } from "vitest";
import { AssistanceDeliveryKind, AssistanceDeliveryReviewState } from "@prisma/client";
import {
  canReportPrivateDelivery, parseDeliveryCreation, parseDeliveryReview,
} from "./assistance-delivery";

const today = "2026-10-16";
const submissionId = "ac637580-d949-4c62-9d98-d97c4768425e";
const fields = (patch: Record<string, string> = {}) => {
  const f = new FormData();
  Object.entries({
    id: "case-synthetic", submissionId, kind: "FINANCIAL",
    summary: "Financial support reportedly paid toward an approved need.",
    occurredOn: "2026-10-15", amountInr: "2500.5",
    evidenceDocumentId: "document-synthetic",
    expectedUpdatedAt: "2026-10-16T08:00:00.000Z",
    ...patch,
  }).forEach(([k, v]) => f.set(k, v));
  return f;
};
describe("bounded private support-delivery reporting", () => {
  it("parses actual INR amounts as exact decimal strings and a date-only record", () => {
    expect(parseDeliveryCreation(fields(), today)).toEqual({
      id: "case-synthetic", submissionId,
      kind: AssistanceDeliveryKind.FINANCIAL,
      summary: "Financial support reportedly paid toward an approved need.",
      occurredOn: new Date("2026-10-15T00:00:00.000Z"),
      amountInr: "2500.50", evidenceDocumentId: "document-synthetic",
      expectedUpdatedAt: new Date("2026-10-16T08:00:00.000Z"),
    });
  });
  it("never fabricates a cash amount for delivered goods or services", () => {
    expect(parseDeliveryCreation(fields({ kind: "IN_KIND", amountInr: "" }), today).amountInr).toBeNull();
    expect(() => parseDeliveryCreation(fields({ kind: "IN_KIND", amountInr: "10.00" }), today))
      .toThrow("invented cash value");
  });
  it.each<Record<string, string>>([
    { kind: "REFERRAL" }, { summary: "short" }, { occurredOn: "2026-10-17" },
    { occurredOn: "2026-02-30" }, { occurredOn: "2020-01-01" },
    { amountInr: "" }, { amountInr: "0.00" }, { amountInr: "-5" },
    { amountInr: "5.999" }, { amountInr: "1e6" }, { amountInr: "99999999999" },
    { submissionId: "invalid" }, { expectedUpdatedAt: "yesterday" },
    { evidenceDocumentId: "../another-case" },
    { summary: "Private text\u0000unsafe" },
  ])("rejects invalid or ungrounded delivery fields (%j)", change => {
    expect(() => parseDeliveryCreation(fields(change), today)).toThrow();
  });
  it("does not allow a file masquerading as submitted summary", () => {
    const f = fields(); f.set("summary", new File(["private"], "document.pdf"));
    expect(() => parseDeliveryCreation(f, today)).toThrow();
  });
  it("restricts private review actions to confirmation or voiding", () => {
    const f = fields({ recordId: "delivery-synthetic", state: "CONFIRMED", evidenceAttested: "yes",
      expectedRecordUpdatedAt: "2026-10-16T08:00:00.000Z" });
    expect(parseDeliveryReview(f)).toEqual({
      id: "case-synthetic", recordId: "delivery-synthetic", state: AssistanceDeliveryReviewState.CONFIRMED,
      expectedUpdatedAt: new Date("2026-10-16T08:00:00.000Z"),
    });
    f.set("evidenceAttested", "");
    expect(() => parseDeliveryReview(f)).toThrow("personally reviewed");
    f.set("state", "VOIDED");
    expect(parseDeliveryReview(f).state).toBe(AssistanceDeliveryReviewState.VOIDED);
    f.set("state", "PUBLISHED");
    expect(() => parseDeliveryReview(f)).toThrow();
  });
  it("requires completed approval and blocks rejected or converted cases", () => {
    const approved = { decision: "APPROVED_PRIVATE" as const, completedAt: new Date() };
    expect(canReportPrivateDelivery("APPROVED", null, approved)).toBe(true);
    expect(canReportPrivateDelivery("CLOSED", null, approved)).toBe(true);
    expect(canReportPrivateDelivery("APPROVED", "appeal-linked", approved)).toBe(false);
    expect(canReportPrivateDelivery("APPROVED", null, { ...approved, completedAt: null })).toBe(false);
    expect(canReportPrivateDelivery("REJECTED", null, approved)).toBe(false);
    expect(canReportPrivateDelivery("APPROVED", null, { ...approved, decision: "DECLINED" })).toBe(false);
  });
});
