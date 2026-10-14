"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { reconcileDirectDonation } from "@/lib/direct-donation-reconciliation";

export type DonationReconciliationState = {
  status: "idle" | "success" | "error";
  message: string;
};

// The action returns only curated staff-facing errors. Authorization failures
// are still thrown by requirePermission, not turned into UI disclosures.
const STAFF_RECONCILIATION_ERRORS = [
  /^Reconciliation notes must be/,
  /^A bank-statement match confirmation is required$/,
  /^Bank statement reference must match/,
  /^Bank statement amount does not match/,
  /^This bank transaction reference was already reconciled/,
  /^This transfer exceeds the appeal's remaining verified need/,
  /^Original approved fund designation requires reconciliation$/,
  /^Donation is no longer pending verification$/,
] as const;

export async function reconcileDonationAction(
  _previous: DonationReconciliationState, formData: FormData,
): Promise<DonationReconciliationState> {
  const user = await requirePermission("donation.reconcile");
  const donationId = String(formData.get("donationId") ?? "").trim();
  const decision = String(formData.get("decision") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const statementReference = String(formData.get("statementReference") ?? "").trim();
  const statementAmount = String(formData.get("statementAmount") ?? "").trim();
  const statementConfirmed = formData.get("statementConfirmed") === "true";
  if (!donationId || !["VERIFY", "REJECT"].includes(decision)) {
    return { status: "error", message: "Invalid reconciliation request. Refresh and try again." };
  }

  let result;
  try {
    result = await reconcileDirectDonation({
      donationId, actorId: user.id, decision: decision as "VERIFY" | "REJECT",
      notes, statementReference, statementAmount, statementConfirmed,
    });
  } catch (error) {
    const message = error instanceof Error && STAFF_RECONCILIATION_ERRORS.some(pattern => pattern.test(error.message))
      ? error.message
      : "Unable to reconcile this record. Check the bank statement and refresh before retrying.";
    return { status: "error", message };
  }

  if (result.status === "CAPTURED") {
    updateTag("appeals");
    revalidatePath("/appeals");
    revalidatePath("/");
  }
  revalidatePath("/admin/giving-funds");
  revalidatePath("/admin/donations");
  revalidatePath(`/admin/donations/${donationId}`);
  return {
    status: "success",
    message: result.status === "CAPTURED"
      ? "Bank transfer marked received after the statement attestation."
      : "Unverified transfer claim rejected. No donation amount was credited.",
  };
}
