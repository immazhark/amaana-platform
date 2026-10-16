import {
  AssistanceOutcomeDisclosureState, AssistanceOutcomeKind,
  AssistanceOutcomeReviewState, ConfidentialityLevel, type Prisma,
} from "@prisma/client";
import { hasCurrentPrivateOutcomeEvidence } from "./assistance-outcome";

const validId = /^[A-Za-z0-9_-]{3,128}$/;
const strictIso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
function getText(form: FormData, name: string, max: number) {
  const value = form.get(name);
  if (typeof value !== "string" || value.length > max) throw new Error(`Invalid ${name}.`);
  return value.trim();
}
function getId(form: FormData, name: string) {
  const id = getText(form, name, 128);
  if (!validId.test(id)) throw new Error(`Invalid ${name}.`);
  return id;
}
function getVersion(form: FormData, name: string) {
  const input = getText(form, name, 32);
  if (!strictIso.test(input) || Number.isNaN(Date.parse(input)) ||
      new Date(input).toISOString() !== input) {
    throw new Error("The outcome or disclosure changed. Reload the case.");
  }
  return new Date(input);
}

/** Hard-coded anonymous, non-clinical wording. Never interpolate any applicant,
 * institution, address, condition, donation, date, amount or free-form note. */
export const ANONYMOUS_OUTCOME_COPY = {
  [AssistanceOutcomeKind.PARTIAL_SUPPORT]:
    "Amaana Foundation recorded partial support for a verified assistance case. Additional needs may remain.",
  [AssistanceOutcomeKind.SPECIFIC_SUPPORT_COMPLETED]:
    "Amaana Foundation recorded completion of one reviewed support action for an assistance case.",
  [AssistanceOutcomeKind.FURTHER_ACTION_REQUIRED]:
    "Amaana Foundation documented a support delivery and identified the need for further follow-up.",
} as const;

export const DISCLOSURE_STATUS_LABELS = {
  [AssistanceOutcomeDisclosureState.DRAFT]: "Proposed anonymous copy · consent review pending",
  [AssistanceOutcomeDisclosureState.APPROVED_COPY]:
    "Anonymous copy approved internally · NOT published",
  [AssistanceOutcomeDisclosureState.PUBLISHED]: "Anonymous copy published · subject to immediate withdrawal",
  [AssistanceOutcomeDisclosureState.WITHDRAWN]:
    "Copy approval withdrawn · NOT published",
} as const;

export function parseDisclosureProposal(form: FormData) {
  const caseId = getId(form, "id");
  const observationId = getId(form, "observationId");
  const consentDocumentId = getId(form, "consentDocumentId");
  if (getText(form, "exactCopyConsentAttested", 3) !== "yes") {
    throw new Error("Confirm that the consent document explicitly permits this exact anonymous copy.");
  }
  return {
    caseId, observationId, consentDocumentId,
    expectedObservationUpdatedAt: getVersion(form, "expectedObservationUpdatedAt"),
  };
}

export function parseDisclosurePublication(form: FormData) {
  const caseId = getId(form, "id");
  const disclosureId = getId(form, "disclosureId");
  if (getText(form, "publicationAttested", 3) !== "yes") {
    throw new Error("Explicitly confirm the precise anonymous wording and active consent before publication.");
  }
  return {
    caseId, disclosureId,
    expectedUpdatedAt: getVersion(form, "expectedUpdatedAt"),
  };
}

export const ANONYMOUS_COPY_WITHDRAWAL_REASONS = {
  CONSENT_WITHDRAWN: "The applicant or authorized representative withdrew consent",
  SOURCE_INVALIDATED: "Supporting case, delivery or outcome evidence changed",
  EDITORIAL_CORRECTION: "The anonymous wording needs correction",
} as const;

export function parseDisclosureDecision(form: FormData) {
  const caseId = getId(form, "id");
  const disclosureId = getId(form, "disclosureId");
  const decision = getText(form, "decision", 15);
  if (decision !== AssistanceOutcomeDisclosureState.APPROVED_COPY &&
      decision !== AssistanceOutcomeDisclosureState.WITHDRAWN) {
    throw new Error("Invalid anonymous-copy review decision.");
  }
  if (decision === AssistanceOutcomeDisclosureState.APPROVED_COPY &&
      getText(form, "consentReviewAttested", 3) !== "yes") {
    throw new Error("The approver must review the actual consent document and exact copy.");
  }
  const reason = decision === AssistanceOutcomeDisclosureState.WITHDRAWN
    ? getText(form, "withdrawalReason", 30) : "";
  if (decision === AssistanceOutcomeDisclosureState.WITHDRAWN &&
      !Object.prototype.hasOwnProperty.call(ANONYMOUS_COPY_WITHDRAWAL_REASONS, reason)) {
    throw new Error("Choose why the anonymous-copy proposal is being withdrawn.");
  }
  return {
    caseId, disclosureId, decision: decision as "APPROVED_COPY" | "WITHDRAWN",
    withdrawalReason: reason as keyof typeof ANONYMOUS_COPY_WITHDRAWAL_REASONS | "",
    expectedUpdatedAt: getVersion(form, "expectedUpdatedAt"),
  };
}

export const disclosureSourceSelect = {
  id: true,
  assistanceRequestId: true,
  state: true,
  kind: true,
  updatedAt: true,
  reportedById: true,
  reviewedById: true,
  deliveryRecord: {
    select: {
      kind: true, state: true, evidenceDocumentId: true,
      financialReconciliation: { select: { status: true, bankProofDocumentId: true } },
      assistanceRequest: {
        select: {
          id: true, status: true, appealId: true,
          verification: {
            select: { decision: true, completedAt: true, confidentialityLevel: true },
          },
        },
      },
    },
  },
} satisfies Prisma.AssistanceOutcomeObservationSelect;

type Source = Prisma.AssistanceOutcomeObservationGetPayload<{ select: typeof disclosureSourceSelect }>;

/** A fresh approval requires STANDARD confidentiality and a reviewed delivery.
 * The existence of private evidence does not itself provide publication consent. */
export function eligibleForAnonymousCopy(source: Source): boolean {
  return source.state === AssistanceOutcomeReviewState.REVIEWED &&
    source.deliveryRecord.assistanceRequest.verification?.confidentialityLevel === ConfidentialityLevel.STANDARD &&
    hasCurrentPrivateOutcomeEvidence(source.deliveryRecord);
}

/** Document presence is checked in the same transaction in the caller.
 * Keeping this separate makes consent withdrawal and retention fail closed. */
export function requiredDisclosureEvidenceIds(source: Source, consentDocumentId: string): string[] {
  const bank = source.deliveryRecord.kind === "FINANCIAL"
    ? source.deliveryRecord.financialReconciliation?.bankProofDocumentId : null;
  return [source.deliveryRecord.evidenceDocumentId, bank, consentDocumentId]
    .filter((id): id is string => typeof id === "string");
}

/**
 * Single source of truth for whether an anonymous disclosure has a complete,
 * separate, current evidence chain. The caller must still verify that every
 * returned document exists and belongs to this same assistance request.
 *
 * null means DO NOT approve, publish, or render on the public website.
 */
export function validatedAnonymousDisclosureEvidenceIds(
  source: Source,
  copyText: string,
  consentDocumentId: string | null,
): string[] | null {
  if (!consentDocumentId ||
      !eligibleForAnonymousCopy(source) ||
      copyText !== ANONYMOUS_OUTCOME_COPY[source.kind]) return null;

  const ids = requiredDisclosureEvidenceIds(source, consentDocumentId);
  const requiredCount = source.deliveryRecord.kind === "FINANCIAL" ? 3 : 2;
  if (ids.length !== requiredCount || new Set(ids).size !== ids.length) return null;
  return ids;
}
