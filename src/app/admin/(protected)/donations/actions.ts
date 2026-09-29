"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { reconcileDirectDonation } from "@/lib/direct-donation-reconciliation";

export async function reconcileDonationAction(formData: FormData) {
  const user = await requirePermission("donation.reconcile");
  const donationId = String(formData.get("donationId") ?? "").trim();
  const decision = String(formData.get("decision") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!donationId || !["VERIFY", "REJECT"].includes(decision)) throw new Error("Invalid reconciliation request");
  await reconcileDirectDonation({ donationId, actorId: user.id, decision: decision as "VERIFY" | "REJECT", notes });
  revalidatePath("/admin/donations");
  revalidatePath(`/admin/donations/${donationId}`);
}
