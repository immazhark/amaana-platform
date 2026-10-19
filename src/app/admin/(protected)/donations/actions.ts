"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { reconcileDirectDonation } from "@/lib/direct-donation-reconciliation";

function singleTextField(formData: FormData, name: string): string | null {
  const values = formData.getAll(name);
  if (values.length > 1) throw new Error(`Repeated ${name} fields are not accepted.`);
  const value = values[0];
  if (value !== undefined && typeof value !== "string") {
    throw new Error(`Use a single text ${name} field.`);
  }
  return value ?? null;
}

export async function reconcileDonationAction(formData: FormData) {
  const user = await requirePermission("donation.reconcile");
  const donationId = String(singleTextField(formData, "donationId") ?? "").trim();
  const decision = String(singleTextField(formData, "decision") ?? "");
  const notes = String(singleTextField(formData, "notes") ?? "").trim();
  if (!donationId || !["VERIFY", "REJECT"].includes(decision)) throw new Error("Invalid reconciliation request");
  if (notes.length < 3 || notes.length > 1000) throw new Error("Reconciliation notes must be between 3 and 1000 characters");
  await reconcileDirectDonation({ donationId, actorId: user.id, decision: decision as "VERIFY" | "REJECT", notes });
  revalidatePath("/admin/donations");
  revalidatePath(`/admin/donations/${donationId}`);
}
