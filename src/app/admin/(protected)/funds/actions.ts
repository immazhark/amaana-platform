"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { parseDisbursementInput } from "@/lib/fund-disbursement";
import { DisbursementError, publishDisbursement, recordDisbursement, voidDisbursement } from "@/lib/fund-disbursement-service";

const SPENDING_PATH = "/admin/funds/spending";

// Reads one value per field; repeated or non-text fields are rejected rather than guessed at.
function field(formData: FormData, name: string): string | undefined {
  const values = formData.getAll(name);
  if (values.length > 1) throw new Error(`Repeated ${name} fields are not accepted.`);
  const value = values[0];
  if (value !== undefined && typeof value !== "string") throw new Error(`Use a single text ${name} field.`);
  return value;
}

function finish(message: string): never {
  revalidatePath(SPENDING_PATH);
  revalidatePath("/admin/funds");
  redirect(`${SPENDING_PATH}?notice=${encodeURIComponent(message)}`);
}

async function guarded(work: () => Promise<string>): Promise<never> {
  let message: string;
  try {
    message = await work();
  } catch (error) {
    if (!(error instanceof DisbursementError)) throw error;
    message = error.message;
  }
  return finish(message);
}

export async function recordDisbursementAction(formData: FormData) {
  const user = await requirePermission("donation.reconcile");
  const parsed = parseDisbursementInput({
    fundId: field(formData, "fundId"),
    pool: field(formData, "pool"),
    amount: field(formData, "amount"),
    spentOn: field(formData, "spentOn"),
    title: field(formData, "title"),
    publicSummary: field(formData, "publicSummary"),
    zakatEligibilityBasis: field(formData, "zakatEligibilityBasis"),
    zakatEligibilityConfirmed: field(formData, "zakatEligibilityConfirmed") === "yes",
  });
  await guarded(async () => {
    if (!parsed.ok) throw new DisbursementError(parsed.error);
    await recordDisbursement(parsed.value, user.id);
    return "Saved as a draft. Publish it when the public summary is ready.";
  });
}

export async function publishDisbursementAction(formData: FormData) {
  const user = await requirePermission("donation.reconcile");
  const id = String(field(formData, "id") ?? "");
  await guarded(async () => {
    if (!/^[A-Za-z0-9_-]{3,64}$/.test(id)) throw new DisbursementError("Invalid entry.");
    await publishDisbursement(id, user.id);
    return "Published.";
  });
}

export async function voidDisbursementAction(formData: FormData) {
  const user = await requirePermission("donation.reconcile");
  const id = String(field(formData, "id") ?? "");
  const reason = field(formData, "reason");
  await guarded(async () => {
    if (!/^[A-Za-z0-9_-]{3,64}$/.test(id)) throw new DisbursementError("Invalid entry.");
    await voidDisbursement(id, reason, user.id);
    return "Entry voided. The record and its history are kept.";
  });
}
