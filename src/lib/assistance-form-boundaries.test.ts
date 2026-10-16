import { singleFormValue } from "./single-form-value";
import { describe, expect, it } from "vitest";
import { parseFollowUpCreation, parseFollowUpResolution, parseFollowUpReschedule, parseFollowUpAssignment } from "./assistance-follow-up";
import { parseDeliveryCreation, parseDeliveryReview } from "./assistance-delivery";
import { parseFinancialCorroboration, parseFinancialCorroborationReview } from "./assistance-financial-reconciliation";
import { parseOutcomeReport, parseOutcomeReview } from "./assistance-outcome";
import { parseDisclosureProposal, parseDisclosurePublication, parseDisclosureDecision } from "./assistance-outcome-disclosure";
import { parsePrivateMilestoneInput, parsePrivateMilestoneRedaction } from "./assistance-private-milestone";

const version = "2026-10-17T08:00:00.000Z";
const submissionId = "ac637580-d949-4c62-9d98-d97c4768425e";
const today = "2026-10-17";
type Scenario = { name: string; fields: Record<string, string>; parse: (form: FormData) => unknown };
const scenarios: Scenario[] = [
  { name: "follow-up creation", parse: data => parseFollowUpCreation(data, today), fields: { id: "case-private", submissionId, assignedToId: "staff-private", summary: "Contact the institution for a private update.", dueOn: today, expectedUpdatedAt: version } },
  { name: "follow-up completion", parse: parseFollowUpResolution, fields: { id: "case-private", taskId: "task-private", state: "COMPLETED", expectedTaskUpdatedAt: version } },
  { name: "follow-up reschedule", parse: data => parseFollowUpReschedule(data, today), fields: { id: "case-private", taskId: "task-private", dueOn: today, expectedTaskUpdatedAt: version } },
  { name: "follow-up reassignment", parse: parseFollowUpAssignment, fields: { id: "case-private", taskId: "task-private", assignedToId: "staff-private", expectedTaskUpdatedAt: version } },
  { name: "private milestone", parse: parsePrivateMilestoneInput, fields: { id: "case-private", kind: "REVIEW_HANDOFF", summary: "Review the private supporting document.", submissionId, expectedUpdatedAt: version } },
  { name: "milestone redaction", parse: parsePrivateMilestoneRedaction, fields: { id: "case-private", targetId: "milestone-private", reason: "SENSITIVE_DETAIL" } },
  { name: "delivery report", parse: data => parseDeliveryCreation(data, today), fields: { id: "case-private", submissionId, kind: "FINANCIAL", summary: "Specific educational support was reportedly provided.", occurredOn: "2026-10-16", amountInr: "1250.50", evidenceDocumentId: "proof-private", expectedUpdatedAt: version } },
  { name: "delivery confirmation", parse: parseDeliveryReview, fields: { id: "case-private", recordId: "delivery-private", state: "CONFIRMED", evidenceAttested: "yes", expectedRecordUpdatedAt: version } },
  { name: "bank proof", parse: parseFinancialCorroboration, fields: { id: "case-private", deliveryRecordId: "delivery-private", bankProofDocumentId: "proof-private", transactionReference: "ABCD1234/009", amountInr: "1250.50", bankEvidenceAttested: "yes", expectedDeliveryUpdatedAt: version } },
  { name: "bank proof review", parse: parseFinancialCorroborationReview, fields: { id: "case-private", reconciliationId: "reconciliation-private", state: "EVIDENCE_REVIEWED", bankEvidenceAttested: "yes", expectedUpdatedAt: version } },
  { name: "outcome report", parse: parseOutcomeReport, fields: { id: "case-private", deliveryRecordId: "delivery-private", submissionId, kind: "PARTIAL_SUPPORT", summary: "The specific support met part of the educational need.", limitedScopeAttested: "yes", expectedDeliveryUpdatedAt: version } },
  { name: "outcome review", parse: parseOutcomeReview, fields: { id: "case-private", observationId: "observation-private", state: "REVIEWED", evidenceAttested: "yes", expectedUpdatedAt: version } },
  { name: "anonymous copy proposal", parse: parseDisclosureProposal, fields: { id: "case-private", observationId: "observation-private", consentDocumentId: "consent-private", exactCopyConsentAttested: "yes", expectedObservationUpdatedAt: version } },
  { name: "anonymous copy approval", parse: parseDisclosureDecision, fields: { id: "case-private", disclosureId: "disclosure-private", decision: "APPROVED_COPY", consentReviewAttested: "yes", expectedUpdatedAt: version } },
  { name: "anonymous copy withdrawal", parse: parseDisclosureDecision, fields: { id: "case-private", disclosureId: "disclosure-private", decision: "WITHDRAWN", withdrawalReason: "CONSENT_WITHDRAWN", expectedUpdatedAt: version } },
  { name: "anonymous copy publication", parse: parseDisclosurePublication, fields: { id: "case-private", disclosureId: "disclosure-private", publicationAttested: "yes", expectedUpdatedAt: version } },
];
function form(fields: Record<string, string>) {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
}

describe.each(scenarios)("unambiguous $name fields", scenario => {
  it("preserves a valid single-value submission", () => expect(() => scenario.parse(form(scenario.fields))).not.toThrow());
  it.each(Object.keys(scenario.fields))("rejects repeated %s before an action can process it", key => {
    for (const second of [scenario.fields[key]!, "DIFFERENT_PRIVATE_VALUE", new File(["private"], "proof.pdf")]) {
      const data = form(scenario.fields); data.append(key, second);
      expect(() => scenario.parse(data)).toThrow();
    }
  });
});

it("allows voiding private evidence without a fresh positive attestation", () => {
  for (const scenario of scenarios.filter(item => ["delivery confirmation", "bank proof review", "outcome review"].includes(item.name))) {
    const data = form(scenario.fields); data.set("state", "VOIDED");
    data.delete("evidenceAttested"); data.delete("bankEvidenceAttested");
    expect(() => scenario.parse(data)).not.toThrow();
  }
});
it("retains blank evidence and amount semantics for a non-cash delivery", () => {
  const scenario = scenarios.find(item => item.name === "delivery report")!;
  const data = form(scenario.fields); data.set("kind", "IN_KIND"); data.set("amountInr", ""); data.set("evidenceDocumentId", "");
  expect(scenario.parse(data)).toMatchObject({ amountInr: null, evidenceDocumentId: null });
});

it("preserves missing, blank and file values for domain validation rather than coercing them", () => {
  const data = new FormData();
  expect(singleFormValue(data, "optional")).toBeNull();
  data.set("optional", ""); expect(singleFormValue(data, "optional")).toBe("");
  const file = new File(["private"], "proof.pdf"); data.set("optional", file);
  expect(singleFormValue(data, "optional")).toBe(file);
});
