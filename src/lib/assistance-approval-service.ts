import {
  AssistanceStatus, NotificationChannel,
  type AssistanceVerificationDecision, type ConfidentialityLevel, type ConsentDecision, type ZakatReviewStatus,
} from "@prisma/client";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";
import { capacityUsed } from "@/lib/assistance-capacity";
import { INDIVIDUAL_CASE_ANNUAL_CAPACITY } from "@/lib/assistance-policy";
import { approvalIssues, type ApprovalFieldErrors, type ApprovalFields, type ApprovalRoute } from "@/lib/assistance-approval";

export type AssistanceApprovalErrorCode =
  | "not_found" | "linked_appeal" | "rejected" | "closed" | "not_eligible" | "stale_request" | "stale_verification" | "reopen_forbidden" | "incomplete" | "capacity_full";

/** A refusal whose message is safe to show the reviewer. Anything else stays server-side. */
export class AssistanceApprovalError extends Error {
  constructor(readonly code: AssistanceApprovalErrorCode, message: string, readonly fieldErrors?: ApprovalFieldErrors) {
    super(message);
  }
}

export const APPROVAL_MESSAGES: Record<Exclude<AssistanceApprovalErrorCode, "incomplete">, string> = {
  not_found: "That request could not be found.",
  linked_appeal: "This request has a linked appeal. Open the appeal to manage its status.",
  rejected: "This request was rejected. Move it back into review under Review before approving it.",
  closed: "This request is closed. Reopen the review under Review first if it needs to be approved.",
  not_eligible: "This request cannot be approved from its current state.",
  stale_request: "This request changed while you were reviewing it. Refresh the page and check it before approving.",
  stale_verification: "The review changed while you were reviewing it. Refresh the page and check it before approving.",
  reopen_forbidden: "Approval permission is required to reopen a completed verification.",
  capacity_full: `This year's planning limit of ${INDIVIDUAL_CASE_ANNUAL_CAPACITY} individual cases has been reached. To accept this case anyway, tick the capacity exception and give the reason.`,
};

export type ApprovalInput = {
  requestId: string;
  route: ApprovalRoute;
  fields: ApprovalFields & { otherFundingNotes: string; confidentialityLevel: string };
  /** The versions the reviewer's page was showing. A change since then is a conflict, never silently overwritten. */
  expectedRequestUpdatedAt: Date;
  expectedVerificationUpdatedAt: Date | null;
  actorId: string;
  /** The reason an authorised approver is accepting this case beyond the annual capacity. Empty or absent means no exception. */
  capacityExceptionNote?: string | null;
};

export type ApprovalResult = {
  outcome: "approved" | "already_approved";
  status: "APPROVED";
  route: ApprovalRoute | null;
  approvedAt: Date | null;
  reviewerName: string | null;
};

const ROUTES = ["APPROVED_PRIVATE", "APPROVED_PARTIAL", "APPROVED_PUBLIC"];

/**
 * Approves an assistance request in one serializable transaction: the completed verification (with the chosen route and
 * the reviewer), the APPROVED status, the audit event and the single status email either all commit or none do. The
 * rules are re-applied here, so a manipulated request cannot approve an incomplete case.
 *
 * It never creates an appeal and never publishes anything: a public route only makes the case ready for appeal
 * preparation, which keeps its own review and its separate publication decision. Approval is not disbursement.
 * A repeat for an already approved request returns the original decision and writes nothing.
 */
export async function approveAssistanceRequest(input: ApprovalInput): Promise<ApprovalResult> {
  const problems = approvalIssues(input.route, input.fields, { confirmed: true });
  if (Object.keys(problems).length) {
    throw new AssistanceApprovalError("incomplete", "Complete the checks listed before approving this request.", problems);
  }

  return withSerializableTransactionRetry(async tx => {
    const current = await tx.assistanceRequest.findUnique({
      where: { id: input.requestId },
      select: {
        id: true, status: true, appealId: true, email: true, referenceNumber: true, updatedAt: true,
        verification: { select: { id: true, updatedAt: true, decision: true, completedAt: true, reviewedBy: { select: { name: true } } } },
      },
    });
    if (!current) throw new AssistanceApprovalError("not_found", APPROVAL_MESSAGES.not_found);
    if (current.appealId || current.status === AssistanceStatus.CONVERTED_TO_APPEAL) throw new AssistanceApprovalError("linked_appeal", APPROVAL_MESSAGES.linked_appeal);

    if (current.status === AssistanceStatus.APPROVED) {
      // A repeat click, a retry or a second reviewer: one coherent outcome, and no second event or email.
      const decision = current.verification?.decision;
      return {
        outcome: "already_approved", status: "APPROVED",
        route: decision && ROUTES.includes(decision) ? (decision as ApprovalRoute) : null,
        approvedAt: current.verification?.completedAt ?? null, reviewerName: current.verification?.reviewedBy?.name ?? null,
      };
    }
    if (current.status === AssistanceStatus.REJECTED) throw new AssistanceApprovalError("rejected", APPROVAL_MESSAGES.rejected);
    if (current.status === AssistanceStatus.CLOSED) throw new AssistanceApprovalError("closed", APPROVAL_MESSAGES.closed);
    if (![AssistanceStatus.SUBMITTED, AssistanceStatus.DOCUMENTS_REQUESTED, AssistanceStatus.UNDER_VERIFICATION].includes(current.status as never)) {
      throw new AssistanceApprovalError("not_eligible", APPROVAL_MESSAGES.not_eligible);
    }

    if (current.updatedAt.getTime() !== input.expectedRequestUpdatedAt.getTime()) throw new AssistanceApprovalError("stale_request", APPROVAL_MESSAGES.stale_request);
    const verificationVersion = current.verification?.updatedAt ?? null;
    if (
      (verificationVersion === null) !== (input.expectedVerificationUpdatedAt === null) ||
      (verificationVersion && input.expectedVerificationUpdatedAt && verificationVersion.getTime() !== input.expectedVerificationUpdatedAt.getTime())
    ) {
      throw new AssistanceApprovalError("stale_verification", APPROVAL_MESSAGES.stale_verification);
    }

    // Capacity is counted when a case is accepted. The serializable transaction makes two concurrent acceptances conflict and
    // retry, so the second sees the first and cannot take the last place as well.
    const exception = input.capacityExceptionNote?.trim() || null;
    const used = await capacityUsed(tx);
    const overCapacity = used >= INDIVIDUAL_CASE_ANNUAL_CAPACITY;
    if (overCapacity && !exception) throw new AssistanceApprovalError("capacity_full", APPROVAL_MESSAGES.capacity_full);

    // The guard repeats the state the decision was made against, so a rejection, a conversion or an edit that commits
    // between the read above and this write cannot be overwritten.
    const claimed = await tx.assistanceRequest.updateMany({
      where: { id: current.id, status: current.status, appealId: null, updatedAt: current.updatedAt },
      data: { status: AssistanceStatus.APPROVED, acceptedAt: new Date(), capacityExceptionNote: overCapacity ? exception : null },
    });
    if (claimed.count !== 1) throw new AssistanceApprovalError("stale_request", APPROVAL_MESSAGES.stale_request);

    const f = input.fields;
    const approvedAt = new Date();
    const data = {
      needConfirmed: f.needConfirmed, evidenceReviewed: f.evidenceReviewed, otherFundingChecked: f.otherFundingChecked,
      verifiedNeedAmount: f.verifiedNeedAmount, approvedPublicTarget: input.route === "APPROVED_PUBLIC" ? f.approvedPublicTarget : null,
      paymentDestination: f.paymentDestination.trim() || null, otherFundingNotes: f.otherFundingNotes.trim() || null,
      verificationSummary: f.verificationSummary.trim() || null, decision: input.route as AssistanceVerificationDecision,
      confidentialityLevel: f.confidentialityLevel as ConfidentialityLevel, zakatStatus: f.zakatStatus as ZakatReviewStatus,
      publicNameConsent: f.publicNameConsent as ConsentDecision, photoConsent: f.photoConsent as ConsentDecision,
      medicalDetailsConsent: f.medicalDetailsConsent as ConsentDecision, institutionNameConsent: f.institutionNameConsent as ConsentDecision,
      archiveConsent: f.archiveConsent as ConsentDecision, completedAt: approvedAt, reviewedById: input.actorId,
    };
    const reviewer = await tx.user.findUnique({ where: { id: input.actorId }, select: { name: true } });
    await tx.assistanceVerification.upsert({ where: { assistanceRequestId: current.id }, create: { assistanceRequestId: current.id, ...data }, update: data });

    await tx.auditEvent.create({
      data: {
        actorId: input.actorId, action: "assistance.approved", entityType: "AssistanceRequest", entityId: current.id,
        // What happened, never the private summary or notes.
        metadata: { route: input.route, previousStatus: current.status, previousDecision: current.verification?.decision ?? null, confidentialityLevel: f.confidentialityLevel, zakatStatus: f.zakatStatus, countedBefore: used, capacityException: overCapacity },
      },
    });

    if (current.email) {
      // The existing status-update message: reference and status only. Queued is not delivered.
      await tx.notification.create({
        data: {
          channel: NotificationChannel.EMAIL, recipient: current.email, templateKey: "assistance-status-updated",
          subject: "Your Amaana request status was updated",
          payload: { referenceNumber: current.referenceNumber, status: AssistanceStatus.APPROVED }, assistanceRequestId: current.id,
        },
      });
    }

    return { outcome: "approved", status: "APPROVED", route: input.route, approvedAt, reviewerName: reviewer?.name ?? null };
  });
}

export type ApprovalDraftInput = Omit<ApprovalInput, "route"> & {
  /** A route the reviewer is leaning towards, or null while undecided. Saved as progress; it decides nothing. */
  route: ApprovalRoute | null;
  draftDecision?: "PENDING" | "REFERRED";
  /** Server-derived permission. Missing authority fails closed for previously completed reviews. */
  canReopenCompletedVerification?: boolean;
};

/**
 * Saves review progress without deciding anything. Whatever the reviewer has entered is kept as it is, however incomplete:
 * no approval check is applied, no approval is recorded, the request status does not change, no reviewer or completion is
 * stamped, and no email or audit decision event is written. Used when an approval is not ready (so nothing typed is lost) and
 * available on its own as "Save review progress". It does nothing for a request that is not open to review (already
 * approved, rejected, closed or linked to an appeal), and it refuses a stale version rather than overwrite another reviewer.
 */
export async function saveApprovalDraft(input: ApprovalDraftInput): Promise<"saved" | "skipped"> {
  return withSerializableTransactionRetry(async tx => {
    const current = await tx.assistanceRequest.findUnique({
      where: { id: input.requestId },
      select: { id: true, status: true, appealId: true, updatedAt: true, verification: { select: { updatedAt: true, decision: true, completedAt: true } } },
    });
    if (!current) throw new AssistanceApprovalError("not_found", APPROVAL_MESSAGES.not_found);
    const open = [AssistanceStatus.SUBMITTED, AssistanceStatus.DOCUMENTS_REQUESTED, AssistanceStatus.UNDER_VERIFICATION] as string[];
    if (current.appealId || !open.includes(current.status)) return "skipped";

    if (current.updatedAt.getTime() !== input.expectedRequestUpdatedAt.getTime()) throw new AssistanceApprovalError("stale_request", APPROVAL_MESSAGES.stale_request);
    const version = current.verification?.updatedAt ?? null;
    if (
      (version === null) !== (input.expectedVerificationUpdatedAt === null) ||
      (version && input.expectedVerificationUpdatedAt && version.getTime() !== input.expectedVerificationUpdatedAt.getTime())
    ) {
      throw new AssistanceApprovalError("stale_verification", APPROVAL_MESSAGES.stale_verification);
    }

    if (current.verification?.completedAt && input.canReopenCompletedVerification !== true) {
      throw new AssistanceApprovalError("reopen_forbidden", APPROVAL_MESSAGES.reopen_forbidden);
    }

    const f = input.fields;
    const data = {
      needConfirmed: f.needConfirmed, evidenceReviewed: f.evidenceReviewed, otherFundingChecked: f.otherFundingChecked,
      verifiedNeedAmount: f.verifiedNeedAmount, approvedPublicTarget: input.route === "APPROVED_PUBLIC" ? f.approvedPublicTarget : null,
      paymentDestination: f.paymentDestination.trim() || null, otherFundingNotes: f.otherFundingNotes.trim() || null,
      verificationSummary: f.verificationSummary.trim() || null,
      decision: (input.draftDecision ?? input.route ?? current.verification?.decision ?? "PENDING") as AssistanceVerificationDecision,
      confidentialityLevel: f.confidentialityLevel as ConfidentialityLevel, zakatStatus: f.zakatStatus as ZakatReviewStatus,
      publicNameConsent: f.publicNameConsent as ConsentDecision, photoConsent: f.photoConsent as ConsentDecision,
      medicalDetailsConsent: f.medicalDetailsConsent as ConsentDecision, institutionNameConsent: f.institutionNameConsent as ConsentDecision,
      archiveConsent: f.archiveConsent as ConsentDecision,
      // Progress is never a completed decision: any earlier completion is cleared so the case reads as in review again.
      completedAt: null, reviewedById: null,
    };
    await tx.assistanceVerification.upsert({ where: { assistanceRequestId: current.id }, create: { assistanceRequestId: current.id, ...data }, update: data });
    return "saved";
  });
}
