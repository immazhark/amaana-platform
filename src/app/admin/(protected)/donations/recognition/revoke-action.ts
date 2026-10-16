"use server";

import { refreshShukrViewsAfterConsent } from "@/lib/shukr-cache-refresh";
import { requirePermission } from "@/lib/auth";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";
import { donorRecognitionEnabled } from "@/lib/donor-recognition-repository";
import { parseDonorRecognitionName } from "@/lib/donor-recognition";
import type { RecognitionReviewState } from "./actions";

/** Independent staff takedown: a mistaken publication can be removed even if
 * the donor lost their private receipt token or has since been refunded. */
export async function unpublishDonorRecognitionAction(
  _previous: RecognitionReviewState, form: FormData,
): Promise<RecognitionReviewState> {
  const actor = await requirePermission("donation.reconcile");
  if (!donorRecognitionEnabled()) return { status: "error", message: "Recognition workflow is disabled." };
  if (["donationId", "name", "approvedAt", "requestedAt"].some(key => form.getAll(key).length !== 1)) {
    return { status: "error", message: "Invalid unpublication request." };
  }
  const id = form.get("donationId");
  const name = form.get("name");
  const approved = form.get("approvedAt");
  const requested = form.get("requestedAt");
  if (typeof id !== "string" || id.length < 8 || id.length > 100 ||
      typeof name !== "string" || parseDonorRecognitionName(name) !== name ||
      typeof approved !== "string" || approved.length > 48 ||
      typeof requested !== "string" || requested.length > 48) {
    return { status: "error", message: "Invalid unpublication request." };
  }
  // The same CAS takedown works for a publicly approved name and for a
  // pending request that became ineligible (refunded/anonymous/failed).
  // The empty string means never approved; it is not parsed as a date.
  const wasApproved = approved.length > 0;
  const approvedAt = wasApproved ? new Date(approved) : null;
  const requestedAt = new Date(requested);
  if ((wasApproved && !Number.isFinite(approvedAt!.getTime())) ||
      !Number.isFinite(requestedAt.getTime())) {
    return { status: "error", message: "Invalid approval details." };
  }
  try {
    const removed = await withSerializableTransactionRetry(async tx => {
      const updated = await tx.donation.updateMany({
        where: { id, recognitionApprovedAt: approvedAt, recognitionRequestedAt: requestedAt,
          recognitionDisplayName: name, recognitionRevokedAt: null,
          // A pending cleanup cannot be used as an alternative rejection
          // path once this donation is again eligible. Use moderation instead.
          ...(!wasApproved ? { OR: [
            { status: { not: "CAPTURED" as const } },
            { isAnonymous: true },
            { refundedAmount: { gt: 0 } },
          ] } : {}),
        },
        data: { recognitionApprovedAt: null, recognitionRequestedAt: null,
          recognitionDisplayName: null, recognitionRevokedAt: new Date() },
      });
      if (updated.count !== 1) return false;
      await tx.auditEvent.create({
        data: { actorId: actor.id, entityType: "Donation", entityId: id,
          action: wasApproved ? "DONOR_RECOGNITION_UNPUBLISHED" : "DONOR_RECOGNITION_REQUEST_REMOVED",
          metadata: { priorApprovalAt: approved, priorRequestAt: requested } },
      });
      return true;
    });
    if (!removed) return { status: "error", message: "The record changed or was already removed. Refresh to see the current state." };
    refreshShukrViewsAfterConsent();
    return { status: "success", message: wasApproved
      ? "The reviewed donor name has been unpublished."
      : "The ineligible pending name request has been removed." };
  } catch {
    return { status: "error", message: "Unable to unpublish safely. Retry or disable the recognition feature gate." };
  }
}
