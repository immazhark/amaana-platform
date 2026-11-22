// Approving an assistance request (assistance queue brief, sections 7, 8 and 9). Pure rules: no database, no clock.
//
// There are three ways to approve, and what each one needs is stated here once. The same rules decide whether an approval
// is accepted and what the reviewer is told before they submit, so there is no second checklist to drift. The public route's
// requirements are held to the publication gate's own wording by a test that compares them.

export type ApprovalRoute = "APPROVED_PRIVATE" | "APPROVED_PARTIAL" | "APPROVED_PUBLIC";

export const APPROVAL_ROUTES: readonly { value: ApprovalRoute; label: string; meaning: string }[] = [
  {
    value: "APPROVED_PRIVATE", label: "Private assistance",
    meaning: "Assistance is arranged privately. No public appeal is created, and no public title, story, media or archive permission is needed.",
  },
  {
    value: "APPROVED_PARTIAL", label: "Partial support",
    meaning: "Amaana covers part of the need. Partial funding and public visibility are different things: this does not create a public appeal, and none of the public content is needed.",
  },
  {
    value: "APPROVED_PUBLIC", label: "Public fundraising",
    meaning: "A public appeal is prepared for donors after this approval. Approval never publishes it: the appeal still needs its own review and a separate publication decision.",
  },
];

export function parseApprovalRoute(value: unknown): ApprovalRoute | null {
  return APPROVAL_ROUTES.find(route => route.value === value)?.value ?? null;
}

/** What approval is judged on. Consent values are the stored decision names; UNCONFIRMED means the question is unfinished. */
export type ApprovalFields = {
  needConfirmed: boolean;
  evidenceReviewed: boolean;
  otherFundingChecked: boolean;
  verifiedNeedAmount: number | null;
  approvedPublicTarget: number | null;
  paymentDestination: string;
  verificationSummary: string;
  zakatStatus: string;
  publicNameConsent: string;
  photoConsent: string;
  medicalDetailsConsent: string;
  institutionNameConsent: string;
  archiveConsent: string;
};

export type ApprovalFieldName =
  | "needConfirmed" | "evidenceReviewed" | "verifiedNeedAmount" | "paymentDestination" | "otherFundingChecked" | "verificationSummary" | "zakatStatus"
  | "approvedPublicTarget" | "publicNameConsent" | "photoConsent" | "medicalDetailsConsent" | "institutionNameConsent" | "archiveConsent";
export type ApprovalFieldErrors = Partial<Record<ApprovalFieldName | "confirmation", string>>;

const CORE: Record<"needConfirmed" | "evidenceReviewed" | "verifiedNeedAmount" | "paymentDestination" | "otherFundingChecked" | "verificationSummary" | "zakatStatus", string> = {
  needConfirmed: "Need must be confirmed.",
  evidenceReviewed: "Supporting evidence must be reviewed.",
  verifiedNeedAmount: "Verified need amount must be recorded.",
  paymentDestination: "Payment destination must be confirmed.",
  otherFundingChecked: "Other funding or duplicate fundraising must be checked.",
  verificationSummary: "Verification summary is required.",
  zakatStatus: "Zakat review must be recorded as eligible, not eligible, or not applicable.",
};

const CONSENT: Record<"publicNameConsent" | "photoConsent" | "medicalDetailsConsent" | "institutionNameConsent" | "archiveConsent", string> = {
  publicNameConsent: "Public-name consent must be resolved.",
  photoConsent: "Photo/media consent must be resolved, including not applicable when no beneficiary image will be used.",
  medicalDetailsConsent: "Medical-detail disclosure consent must be resolved, including not applicable where irrelevant.",
  institutionNameConsent: "Institution/hospital naming consent must be resolved, including not applicable where irrelevant.",
  archiveConsent: "Public archive consent must be resolved.",
};

/**
 * What stops this approval, by field. An empty result means it may proceed. Every problem is reported together so the
 * reviewer can fix them in one pass. Hiding a field never answers it: an unresolved permission is unfinished, not consent.
 */
export function approvalIssues(route: ApprovalRoute, fields: ApprovalFields, options: { confirmed: boolean }): ApprovalFieldErrors {
  const errors: ApprovalFieldErrors = {};
  if (!fields.needConfirmed) errors.needConfirmed = CORE.needConfirmed;
  if (!fields.evidenceReviewed) errors.evidenceReviewed = CORE.evidenceReviewed;
  if (!fields.verifiedNeedAmount || !Number.isFinite(fields.verifiedNeedAmount) || fields.verifiedNeedAmount <= 0) errors.verifiedNeedAmount = CORE.verifiedNeedAmount;
  if (!fields.paymentDestination.trim()) errors.paymentDestination = CORE.paymentDestination;
  if (!fields.otherFundingChecked) errors.otherFundingChecked = CORE.otherFundingChecked;
  if (!fields.verificationSummary.trim()) errors.verificationSummary = CORE.verificationSummary;
  if (fields.zakatStatus === "UNREVIEWED") errors.zakatStatus = CORE.zakatStatus;

  if (route === "APPROVED_PUBLIC") {
    const target = fields.approvedPublicTarget;
    if (!target || !Number.isFinite(target) || target <= 0) errors.approvedPublicTarget = "Approved public target must be recorded.";
    else if (fields.verifiedNeedAmount && target > fields.verifiedNeedAmount) errors.approvedPublicTarget = "Approved public target cannot exceed the verified need amount.";
    for (const key of Object.keys(CONSENT) as (keyof typeof CONSENT)[]) {
      if (fields[key] === "UNCONFIRMED") errors[key] = CONSENT[key];
    }
  } else if (fields.approvedPublicTarget) {
    errors.approvedPublicTarget = "A public fundraising target can only be stored for an approved public appeal";
  }

  if (!options.confirmed) errors.confirmation = "Confirm the approval to continue.";
  return errors;
}

export type RequirementField = ApprovalFieldName | "otherFundingNotes" | "assignment" | "internalNotes" | "publicTitle" | "publicSummary" | "publicStory" | "coverImage";
export type RequirementLabel = "Required to approve" | "Required to publish" | "Optional" | "Not needed for this action";

const CORE_FIELDS = new Set<RequirementField>(Object.keys(CORE) as RequirementField[]);
const PUBLIC_ONLY = new Set<RequirementField>(["approvedPublicTarget", ...(Object.keys(CONSENT) as RequirementField[])]);
const PUBLICATION_COPY = new Set<RequirementField>(["publicTitle", "publicSummary", "publicStory"]);
const ALWAYS_OPTIONAL = new Set<RequirementField>(["otherFundingNotes", "assignment", "internalNotes"]);

/**
 * The words shown beside a field before submission: what is needed for this action. Never conveyed by colour alone and
 * never an unexplained asterisk. Rejection needs none of the approval fields.
 */
export function approvalRequirement(field: RequirementField, action: "reject" | ApprovalRoute): RequirementLabel {
  if (ALWAYS_OPTIONAL.has(field)) return "Optional";
  if (action === "reject") return "Not needed for this action";
  if (CORE_FIELDS.has(field)) return "Required to approve";
  if (PUBLIC_ONLY.has(field)) return action === "APPROVED_PUBLIC" ? "Required to approve" : "Not needed for this action";
  if (PUBLICATION_COPY.has(field)) return action === "APPROVED_PUBLIC" ? "Required to publish" : "Not needed for this action";
  return action === "APPROVED_PUBLIC" ? "Optional" : "Not needed for this action";
}
