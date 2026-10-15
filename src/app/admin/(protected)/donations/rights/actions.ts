"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { donorRightsEnabled } from "@/lib/donor-rights-repository";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";
import { isDonorRightsReviewOutcome } from "@/lib/donor-rights";

export type RightsReviewState = { state: "idle" | "success" | "error"; message: string };

/** Staff queue triage changes only request status. It never sends personal
 * data, deletes statutory payment history, alters balances or issues receipts. */
export async function reviewDonorRightsAction(
  _previous: RightsReviewState, form: FormData,
): Promise<RightsReviewState> {
  const actor = await requirePermission("donation.reconcile");
  if (!donorRightsEnabled()) return { state: "error", message: "Donor data-rights requests are disabled." };
  const id = form.get("requestId");
  const decision = form.get("decision");
  const attested = form.get("reviewConfirmed") === "true";
  const resolution = form.get("resolution");
  const reviewOutcome = isDonorRightsReviewOutcome(resolution) ? resolution : null;
  if (typeof id !== "string" || id.length < 8 || id.length > 100 ||
      (decision !== "START_REVIEW" && decision !== "CLOSE_REVIEW") ||
      (decision === "CLOSE_REVIEW" && (!attested || !reviewOutcome))) {
    return { state: "error", message: "A valid review decision and completion attestation are required." };
  }
  const source = decision === "START_REVIEW" ? "OPEN" : "IN_REVIEW";
  const next = decision === "START_REVIEW" ? "IN_REVIEW" : "CLOSED";
  try {
    const changed = await withSerializableTransactionRetry(async tx => {
      const updated = await tx.donorRightsRequest.updateMany({
        where: { id, status: source },
        data: { status: next, reviewedById: actor.id,
          ...(decision === "CLOSE_REVIEW" ? { reviewedAt: new Date() } : {}) },
      });
      if (updated.count !== 1) return false;
      await tx.auditEvent.create({
        data: {
          actorId: actor.id, entityType: "DonorRightsRequest", entityId: id,
          action: decision === "START_REVIEW" ? "DONOR_RIGHTS_REVIEW_STARTED" : "DONOR_RIGHTS_REVIEW_CLOSED",
          metadata: { resultingStatus: next, ...(decision === "CLOSE_REVIEW" ? { reviewOutcome } : {}) },
        },
      });
      return true;
    });
    if (!changed) return { state: "error", message: "The request has changed. Refresh before taking action." };
    revalidatePath("/admin/donations/rights");
    return { state: "success", message: next === "IN_REVIEW"
      ? "Request marked for review. Follow up securely with the donor."
      : "Review closed after staff attestation. No payment or donor data was deleted by this action." };
  } catch {
    return { state: "error", message: "Unable to update the request safely." };
  }
}
