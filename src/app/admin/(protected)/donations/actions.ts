"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { reconcileDirectDonation } from "@/lib/direct-donation-reconciliation";

export async function reconcileDonationAction(formData: FormData) {
  const user = await requirePermission("donation.reconcile");
  const donationId = String(formData.get("donationId") ?? "").trim();
  const decision = String(formData.get("decision") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!donationId || !["VERIFY", "REJECT"].includes(decision)) throw new Error("Invalid reconciliation request");
  const result = await reconcileDirectDonation({ donationId, actorId: user.id, decision: decision as "VERIFY" | "REJECT", notes });
  if (result.status === "CAPTURED") {
    updateTag("appeals");
    revalidatePath("/appeals");
    revalidatePath("/");
  }
  revalidatePath("/admin/giving-funds");
  revalidatePath("/admin/donations");
  revalidatePath(`/admin/donations/${donationId}`);
}
