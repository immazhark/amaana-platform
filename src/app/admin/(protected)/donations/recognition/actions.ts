"use server";
import { refreshShukrViewsAfterConsent } from "@/lib/shukr-cache-refresh";
import { requirePermission } from "@/lib/auth";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";
import { donorRecognitionEnabled } from "@/lib/donor-recognition-repository";
import { parseDonorRecognitionName } from "@/lib/donor-recognition";

export type RecognitionReviewState = { status: "idle" | "success" | "error"; message: string };
export async function reviewDonorRecognitionAction(
  _previous: RecognitionReviewState, form: FormData,
): Promise<RecognitionReviewState> {
  const actor = await requirePermission("donation.reconcile");
  if (!donorRecognitionEnabled()) return { status: "error", message: "Recognition workflow is not enabled." };
  if (["donationId", "requestedAt", "name", "decision"].some(key => form.getAll(key).length !== 1)) {
    return { status: "error", message: "Invalid consent review request." };
  }
  const donationId = form.get("donationId");
  const requestStamp = form.get("requestedAt");
  const name = form.get("name");
  const decision = form.get("decision");
  if (typeof donationId !== "string" || donationId.length < 8 || donationId.length > 100 ||
      typeof requestStamp !== "string" || requestStamp.length > 48 ||
      typeof name !== "string" || parseDonorRecognitionName(name) !== name ||
      (decision !== "APPROVE" && decision !== "REJECT")) {
    return { status: "error", message: "Invalid consent review request." };
  }
  const requestedAt = new Date(requestStamp);
  if (!Number.isFinite(requestedAt.getTime())) return { status: "error", message: "Invalid request timestamp." };
  try {
    const result = await withSerializableTransactionRetry(async tx => {
      const updated = await tx.donation.updateMany({
        where: {
          id: donationId, status: "CAPTURED", isAnonymous: false,
          refundedAmount: 0, recognitionRequestedAt: requestedAt,
          recognitionApprovedAt: null, recognitionRevokedAt: null,
          recognitionDisplayName: name,
        },
        data: decision === "APPROVE"
          ? { recognitionApprovedAt: new Date() }
          : { recognitionRequestedAt: null, recognitionApprovedAt: null,
              recognitionDisplayName: null, recognitionRevokedAt: new Date() },
      });
      if (updated.count !== 1) return false;
      await tx.auditEvent.create({
        data: {
          actorId: actor.id,
          action: decision === "APPROVE" ? "DONOR_RECOGNITION_APPROVED" : "DONOR_RECOGNITION_REJECTED",
          entityType: "Donation", entityId: donationId,
          metadata: { requestedAt: requestStamp },
        },
      });
      return true;
    });
    if (!result) return { status: "error", message: "The request has changed or was withdrawn. Refresh before reviewing." };
    refreshShukrViewsAfterConsent();
    return { status: "success", message: decision === "APPROVE"
      ? "Recognition approved. Only the reviewed display name may appear publicly."
      : "Request rejected. No donor details will be published." };
  } catch {
    return { status: "error", message: "Unable to complete review safely. Refresh and retry." };
  }
}
