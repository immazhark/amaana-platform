"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import {
  createAllocationProposal, reviewAllocationProposal, allocationPlanningEnabled,
} from "@/lib/allocation-proposal-operations";
import { AllocationError } from "@/lib/allocation-proposals";

export type AllocationActionResult = { state: "idle" | "success" | "error"; message: string };
function messageFor(error: unknown) {
  return error instanceof AllocationError ? error.message
    : "Unable to save the allocation proposal safely. Refresh and retry.";
}

export async function createAllocationAction(
  _previous: AllocationActionResult, form: FormData,
): Promise<AllocationActionResult> {
  const maker = await requirePermission("fund.manage");
  if (!allocationPlanningEnabled()) return { state: "error", message: "Allocation planning is disabled." };
  try {
    const id = await createAllocationProposal({
      donationId: String(form.get("donationId") ?? ""),
      amount: String(form.get("amount") ?? ""),
      purposeNote: String(form.get("purposeNote") ?? ""),
      actorId: maker.id,
    });
    revalidatePath("/admin/allocations");
    return { state: "success", message: `Proposal ${id} recorded for independent review. No money was transferred.` };
  } catch (error) {
    return { state: "error", message: messageFor(error) };
  }
}
export async function reviewAllocationAction(
  _previous: AllocationActionResult, form: FormData,
): Promise<AllocationActionResult> {
  const checker = await requirePermission("fund.approve");
  if (!allocationPlanningEnabled()) return { state: "error", message: "Allocation planning is disabled." };
  const decision = form.get("decision");
  if (decision !== "APPROVE" && decision !== "REJECT") {
    return { state: "error", message: "An explicit review decision is required." };
  }
  try {
    const outcome = await reviewAllocationProposal({
      proposalId: String(form.get("proposalId") ?? ""),
      decision, actorId: checker.id,
    });
    revalidatePath("/admin/allocations");
    return { state: "success", message: `Proposal ${outcome.toLowerCase()}. This does not initiate a payment or confirm disbursement.` };
  } catch (error) {
    return { state: "error", message: messageFor(error) };
  }
}
