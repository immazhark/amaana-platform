"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assistanceActionReturnHref } from "@/lib/assistance-queue-navigation";
import { hasPermission, requirePermission } from "@/lib/auth";
import {
  parseRejectionInput, rejectionDraftCookieName, rejectionDraftCookieValue, rejectionProblems, rejectionRedirect,
  type RejectionNotice,
} from "@/lib/assistance-rejection";
import { ASSISTANCE_DECLINE_REASONS, composeDeclineReason } from "@/lib/assistance-policy";
import { AssistanceRejectionError, rejectAssistanceRequest } from "@/lib/assistance-rejection-service";

const DRAFT_PATH = "/admin/requests";
const DRAFT_SECONDS = 300;

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

/** Holds what the reviewer typed so a recoverable error does not make them retype it. It is private text, so it never goes
 * in the address: it lives for a few minutes in an httpOnly, same-site cookie scoped to the admin request pages. */
async function keepDraft(requestId: string, reason: string) {
  const name = rejectionDraftCookieName(requestId);
  const value = rejectionDraftCookieValue(reason);
  if (!name || value === null) return;
  (await cookies()).set(name, value, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: DRAFT_PATH, maxAge: DRAFT_SECONDS });
}

/**
 * Rejects an assistance request from its dedicated form. The only reviewer-entered values are the reason and an explicit
 * confirmation; nothing from the approval fields is read, so invalid or unresolved approval inputs cannot block it. The
 * form is plain server-rendered HTML posting here, so it needs no client JavaScript; every outcome is a redirect back to the
 * request carrying a notice that names the outcome and the fields in error, never the reason.
 */
export async function rejectRequestAction(formData: FormData): Promise<never> {
  // Authenticate first. Rejection keeps the existing approval boundary: a reviewer who can edit but not approve may not decline.
  const user = await requirePermission("assistance.update");

  const id = single(formData, "id");
  if (!id) redirect("/admin");
  const back = (notice: RejectionNotice): never => redirect(assistanceActionReturnHref(rejectionRedirect(id, notice), formData));

  if (!hasPermission(user, "assistance.approve")) back({ kind: "error", problems: [], code: "forbidden" });

  const noteField = single(formData, "reason");
  const codeField = single(formData, "reasonCode");
  // A chosen category and the optional note become one recorded reason; with no category the typed reason is used as before.
  const reasonField = noteField === null || codeField === null ? null : composeDeclineReason(codeField, noteField);
  const confirmation = single(formData, "confirmRejection");
  const requestVersion = version(single(formData, "expectedRequestUpdatedAt"), false);
  const verificationVersion = version(single(formData, "expectedVerificationUpdatedAt"), true);
  if (reasonField === null || confirmation === null) back({ kind: "error", problems: [], code: "form" });

  // Both the reason and the confirmation are checked together, so every actionable error is shown in one pass.
  const fields = { reason: reasonField, confirmRejection: confirmation === "" ? undefined : confirmation };
  const problems = rejectionProblems(fields);
  if (problems.length) {
    await keepDraft(id, noteField ?? "");
    back({ kind: "error", problems, code: null });
  }
  const parsed = parseRejectionInput(fields);
  if (!parsed.ok) back({ kind: "error", problems, code: null });

  if (requestVersion === "invalid" || requestVersion === null || verificationVersion === "invalid") {
    await keepDraft(id, noteField ?? "");
    back({ kind: "error", problems: [], code: "version" });
  }

  let outcome: "rejected" | "already_rejected";
  try {
    const result = await rejectAssistanceRequest({
      requestId: id, reason: (parsed as { ok: true; reason: string }).reason, reasonCode: ASSISTANCE_DECLINE_REASONS.some(reason => reason.code === codeField) ? codeField : null, actorId: user.id,
      expectedRequestUpdatedAt: requestVersion as Date, expectedVerificationUpdatedAt: verificationVersion as Date | null,
    });
    outcome = result.outcome;
  } catch (error) {
    // Only this module's own refusals have messages written for reviewers. Anything else stays server-side.
    if (error instanceof AssistanceRejectionError) {
      await keepDraft(id, noteField ?? "");
      back({ kind: "error", problems: [], code: error.code });
    }
    throw error;
  }

  const draftName = rejectionDraftCookieName(id);
  if (draftName) (await cookies()).delete({ name: draftName, path: DRAFT_PATH });
  revalidatePath(`/admin/requests/${id}`);
  revalidatePath("/admin");
  return back({ kind: "done", outcome });
}
