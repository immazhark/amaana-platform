"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import {
  createAllocationProposal, reviewAllocationProposal, reverseAllocationProposal, allocationPlanningEnabled,
} from "@/lib/allocation-proposal-operations";
import { AllocationError } from "@/lib/allocation-proposals";

export type AllocationActionResult = { state: "idle" | "success" | "error"; message: string };
function messageFor(error: unknown) {
  return error instanceof AllocationError ? error.message
    : "Unable to save the allocation proposal safely. Refresh and retry.";
}

/** Database operations already committed, including their audit event. Cache
 * failure cannot turn success into a retryable finance write failure. */
function refreshAllocationViewsAfterCommit(): string {
  let failed = false;
  for (const path of ["/admin/allocations", "/admin/giving-funds", "/admin/donations/[id]"]) {
    try {
      if (path.includes("[id]")) revalidatePath(path, "page");
      else revalidatePath(path);
    } catch { failed = true; }
  }
  return failed ? " The saved change is recorded, but a view refresh failed. Reload before another review." : "";
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
    const refreshNotice = refreshAllocationViewsAfterCommit();
    return { state: "success", message: `Proposal ${id} recorded for independent review. No money was transferred.${refreshNotice}` };
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
    const refreshNotice = refreshAllocationViewsAfterCommit();
    return { state: "success", message: `Proposal ${outcome.toLowerCase()}. This does not initiate a payment or confirm disbursement.${refreshNotice}` };
  } catch (error) {
    return { state: "error", message: messageFor(error) };
  }
}

/** No disbursement happens; reversal is an append-only planning correction. */
export async function reverseAllocationAction(
  _previous: AllocationActionResult, form: FormData,
): Promise<AllocationActionResult> {
  const reviewer = await requirePermission("fund.approve");
  if (!allocationPlanningEnabled()) return { state: "error", message: "Allocation planning is disabled." };
  try {
    const reversalId = await reverseAllocationProposal({
      proposalId: String(form.get("proposalId") ?? ""),
      reason: String(form.get("reason") ?? ""),
      actorId: reviewer.id,
    });
    const refreshNotice = refreshAllocationViewsAfterCommit();
    return { state: "success", message: `A separate, immutable reversal ${reversalId} was recorded. No payment or bank transfer was changed.${refreshNotice}` };
  } catch (error) { return { state: "error", message: messageFor(error) }; }
}
