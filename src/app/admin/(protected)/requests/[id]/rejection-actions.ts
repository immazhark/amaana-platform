"use server";

import { revalidatePath } from "next/cache";
import { hasPermission, requirePermission } from "@/lib/auth";
import { parseRejectionInput, type RejectionFieldErrors } from "@/lib/assistance-rejection";
import { AssistanceRejectionError, rejectAssistanceRequest, type AssistanceRejectionErrorCode } from "@/lib/assistance-rejection-service";

/** What the rejection form shows. Plain data: the reviewer's text comes back on every error so nothing has to be retyped. */
export type RejectionFormState = {
  kind: "idle" | "error" | "success";
  message: string;
  fieldErrors?: RejectionFieldErrors;
  values?: { reason: string };
  /** Set when the service refused the decision (linked appeal, conflict, closed...). */
  code?: AssistanceRejectionErrorCode;
  result?: { outcome: "rejected" | "already_rejected"; rejectedAt: string | null; reviewerName: string | null };
};

// One value per field; a repeated or non-text field is an invalid submission, not a guess.
function single(formData: FormData, name: string): string | null {
  const values = formData.getAll(name);
  if (values.length > 1) return null;
  const value = values[0];
  return value === undefined ? "" : typeof value === "string" ? value : null;
}

function version(value: string | null, optional: boolean): Date | null | "invalid" {
  if (value === null) return "invalid";
  if (value === "") return optional ? null : "invalid";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "invalid" : date;
}

/**
 * Rejects an assistance request from its dedicated form. The only reviewer-entered values are the reason and an explicit
 * confirmation; nothing from the approval fields is read, so invalid or unresolved approval inputs cannot block it.
 */
export async function rejectRequestAction(_previous: RejectionFormState, formData: FormData): Promise<RejectionFormState> {
  // Authenticate first. Rejection keeps the existing approval boundary: a reviewer who can edit but not approve may not decline.
  const user = await requirePermission("assistance.update");
  if (!hasPermission(user, "assistance.approve")) {
    return { kind: "error", message: "Approval permission is required to reject a request." };
  }

  const id = single(formData, "id");
  const reasonField = single(formData, "reason");
  const confirmation = single(formData, "confirmRejection");
  const requestVersion = version(single(formData, "expectedRequestUpdatedAt"), false);
  const verificationVersion = version(single(formData, "expectedVerificationUpdatedAt"), true);
  const typed = { reason: reasonField ?? "" };

  if (!id || reasonField === null || confirmation === null) {
    return { kind: "error", message: "The form was not submitted correctly. Refresh the page and try again.", values: typed };
  }

  // Both the reason and the confirmation are checked together, so every actionable error is shown in one pass.
  const parsed = parseRejectionInput({ reason: reasonField, confirmRejection: confirmation === "" ? undefined : confirmation });
  if (!parsed.ok) {
    return { kind: "error", message: "Fix the highlighted fields to reject this request.", fieldErrors: parsed.errors, values: typed };
  }

  if (requestVersion === "invalid" || requestVersion === null || verificationVersion === "invalid") {
    return { kind: "error", message: "The version of this request is missing or invalid. Refresh the page before rejecting.", values: typed };
  }

  try {
    const result = await rejectAssistanceRequest({
      requestId: id, reason: parsed.reason, actorId: user.id,
      expectedRequestUpdatedAt: requestVersion, expectedVerificationUpdatedAt: verificationVersion,
    });
    revalidatePath(`/admin/requests/${id}`);
    revalidatePath("/admin");
    return {
      kind: "success",
      message: result.outcome === "rejected" ? "The request has been rejected." : "This request was already rejected.",
      result: { outcome: result.outcome, rejectedAt: result.rejectedAt?.toISOString() ?? null, reviewerName: result.reviewerName },
    };
  } catch (error) {
    // Only this module's own refusals have messages written for reviewers. Anything else stays server-side.
    if (error instanceof AssistanceRejectionError) return { kind: "error", message: error.message, values: typed, code: error.code };
    throw error;
  }
}
