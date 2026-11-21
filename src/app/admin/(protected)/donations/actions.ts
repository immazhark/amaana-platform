"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { reconcileDirectDonation } from "@/lib/direct-donation-reconciliation";
import { reissueReceiptLink, ReceiptLinkError } from "@/lib/receipt-link-reissue";
import { logServerError } from "@/lib/server-log";

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

export type ReissueLinkState = { ok: true; reference: string; link: string } | { ok: false; error: string } | null;

/** Staff reissue of a donor's private acknowledgement link. The previous link stops working immediately. */
export async function reissueReceiptLinkAction(_previous: ReissueLinkState, formData: FormData): Promise<ReissueLinkState> {
  const user = await requirePermission("donation.reconcile");
  try {
    const donationId = String(singleTextField(formData, "donationId") ?? "").trim();
    const reason = String(singleTextField(formData, "reason") ?? "");
    const { referenceNumber, path } = await reissueReceiptLink({ donationId, actorId: user.id, reason });
    const origin = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") ?? "";
    revalidatePath(`/admin/donations/${donationId}`);
    return { ok: true, reference: referenceNumber, link: `${origin}${path}` };
  } catch (error) {
    if (error instanceof ReceiptLinkError) return { ok: false, error: error.message };
    logServerError("receipt_link_reissue_failed", { errorName: error instanceof Error ? error.name : "unknown" });
    return { ok: false, error: "The link could not be reissued. Nothing was changed; try again." };
  }
}
