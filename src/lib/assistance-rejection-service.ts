import { AssistanceStatus, AssistanceVerificationDecision, NotificationChannel } from "@prisma/client";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";
import { REJECTION_ERROR_MESSAGES, rejectionEligibility } from "@/lib/assistance-rejection";

export type AssistanceRejectionErrorCode = "not_found" | "linked_appeal" | "closed" | "not_eligible" | "stale_request" | "stale_verification";

/** A refusal whose message is safe to show the reviewer. Anything else stays server-side. */
export class AssistanceRejectionError extends Error {
  constructor(readonly code: AssistanceRejectionErrorCode, message: string) {
    super(message);
  }
}

export const REJECTION_MESSAGES = REJECTION_ERROR_MESSAGES;

export type RejectionInput = {
  requestId: string;
  /** Already validated and trimmed by parseRejectionInput. */
  reason: string;
  reasonCode?: string | null;
  /** The versions the reviewer's page was showing. A change since then is a conflict, never silently overwritten. */
  expectedRequestUpdatedAt: Date;
  expectedVerificationUpdatedAt: Date | null;
  actorId: string;
};

export type RejectionResult = {
  outcome: "rejected" | "already_rejected";
  status: "REJECTED";
  /** When the decision was recorded; null for a legacy rejection that has no recorded decision. Never invented. */
  rejectedAt: Date | null;
  reviewerName: string | null;
};

/**
 * Rejects an assistance request in one serializable transaction: the status change, the private reason record, the
 * coherent declined decision on any existing verification, the audit event and the single applicant status email either
 * all commit or none do.
 *
 * What it does NOT do: it reads no approval field, fills in no check the reviewer has not made (need, evidence, funding,
 * amounts, destination, disclosure permissions and Zakat review are left exactly as they were), never touches the notes or
 * documents, never puts the reason in the audit event or the email, and never rejects a request that has a linked appeal.
 * A repeat or concurrent submission for an already rejected request returns the original decision and writes nothing.
 */
export async function rejectAssistanceRequest(input: RejectionInput): Promise<RejectionResult> {
  return withSerializableTransactionRetry(async tx => {
    const current = await tx.assistanceRequest.findUnique({
      where: { id: input.requestId },
      select: {
        id: true, status: true, appealId: true, email: true, referenceNumber: true, updatedAt: true,
        verification: { select: { updatedAt: true, decision: true } },
      },
    });
    if (!current) throw new AssistanceRejectionError("not_found", REJECTION_MESSAGES.not_found);

    const eligibility = rejectionEligibility(current.status, Boolean(current.appealId));
    if (eligibility === "linked_appeal") throw new AssistanceRejectionError("linked_appeal", REJECTION_MESSAGES.linked_appeal);

    if (eligibility === "already_rejected") {
      // A repeat click, a retry or a second reviewer: one coherent outcome and no second event or email.
      const recorded = await tx.assistanceRejection.findFirst({
        where: { assistanceRequestId: current.id },
        orderBy: [{ rejectedAt: "desc" }, { id: "desc" }],
        select: { rejectedAt: true, rejectedBy: { select: { name: true } } },
      });
      return { outcome: "already_rejected", status: "REJECTED", rejectedAt: recorded?.rejectedAt ?? null, reviewerName: recorded?.rejectedBy.name ?? null };
    }

    if (eligibility === "closed") throw new AssistanceRejectionError("closed", REJECTION_MESSAGES.closed);
    if (eligibility !== "eligible") throw new AssistanceRejectionError("not_eligible", REJECTION_MESSAGES.not_eligible);

    if (current.updatedAt.getTime() !== input.expectedRequestUpdatedAt.getTime()) {
      throw new AssistanceRejectionError("stale_request", REJECTION_MESSAGES.stale_request);
    }
    const verificationVersion = current.verification?.updatedAt ?? null;
    if (
      (verificationVersion === null) !== (input.expectedVerificationUpdatedAt === null) ||
      (verificationVersion && input.expectedVerificationUpdatedAt && verificationVersion.getTime() !== input.expectedVerificationUpdatedAt.getTime())
    ) {
      throw new AssistanceRejectionError("stale_verification", REJECTION_MESSAGES.stale_verification);
    }

    // The guard repeats the state the decision was made against, so a conversion or an edit that commits between the
    // read above and this write cannot be overwritten.
    const changed = await tx.assistanceRequest.updateMany({
      where: { id: current.id, status: current.status, appealId: null, updatedAt: current.updatedAt },
      data: { status: AssistanceStatus.REJECTED },
    });
    if (changed.count !== 1) throw new AssistanceRejectionError("stale_request", REJECTION_MESSAGES.stale_request);

    const decision = await tx.assistanceRejection.create({
      data: { assistanceRequestId: current.id, reason: input.reason, reasonCode: input.reasonCode ?? null, rejectedById: input.actorId, previousStatus: current.status },
      select: { rejectedAt: true, rejectedBy: { select: { name: true } } },
    });

    // Only the decision, its completion and its reviewer change. Evidence, amounts, consents and notes stay as the
    // reviewer left them: a declined decision does not certify any positive check. No verification record is created
    // for a request that never had one.
    if (current.verification) {
      await tx.assistanceVerification.update({
        where: { assistanceRequestId: current.id },
        data: { decision: AssistanceVerificationDecision.DECLINED, completedAt: decision.rejectedAt, reviewedById: input.actorId },
      });
    }

    await tx.auditEvent.create({
      data: {
        actorId: input.actorId, action: "assistance.rejected", entityType: "AssistanceRequest", entityId: current.id,
        // What happened, never why: the reason lives only in the private rejection record.
        metadata: { previousStatus: current.status, previousDecision: current.verification?.decision ?? null, hadVerification: Boolean(current.verification) },
      },
    });

    if (current.email) {
      // The existing status-update message. It carries the reference and the new status only, never the reason.
      await tx.notification.create({
        data: {
          channel: NotificationChannel.EMAIL, recipient: current.email, templateKey: "assistance-status-updated",
          subject: "Your Amaana request status was updated",
          payload: { referenceNumber: current.referenceNumber, status: AssistanceStatus.REJECTED }, assistanceRequestId: current.id,
        },
      });
    }

    return { outcome: "rejected", status: "REJECTED", rejectedAt: decision.rejectedAt, reviewerName: decision.rejectedBy.name };
  });
}
