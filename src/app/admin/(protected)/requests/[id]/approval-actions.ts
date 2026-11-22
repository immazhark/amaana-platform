"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasPermission, requirePermission } from "@/lib/auth";
import { parsePositiveRupeeAmount } from "@/lib/amount-entry";
import {
  ASSISTANCE_CONFIDENTIALITY_LEVELS, ASSISTANCE_CONSENT_DECISIONS, ASSISTANCE_OTHER_FUNDING_NOTES_MAX_LENGTH, ASSISTANCE_PAYMENT_DESTINATION_MAX_LENGTH,
  ASSISTANCE_VERIFICATION_SUMMARY_MAX_LENGTH, ASSISTANCE_ZAKAT_STATUSES,
} from "@/lib/assistance";
import {
  approvalAmountDraft, approvalDraftCookieName, approvalIssues, approvalProblemsFrom, approvalRedirect, parseApprovalRoute,
  type ApprovalNotice, type ApprovalProblem,
} from "@/lib/assistance-approval";
import { AssistanceApprovalError, approveAssistanceRequest, saveApprovalDraft, type ApprovalInput } from "@/lib/assistance-approval-service";

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

/** A rupee amount, or null when empty, or "invalid" when it is text that is not a valid amount. */
function amount(raw: string, label: string): number | null | "invalid" {
  try { return parsePositiveRupeeAmount(raw, label, { optional: true }); } catch { return "invalid"; }
}

const oneOf = (value: string | null, allowed: readonly string[]): string | null => (value !== null && allowed.includes(value) ? value : null);
const on = (value: string | null) => value === "on";

/**
 * Approves an assistance request from the review form. One intentional confirmation completes the verification and approves
 * the request in a single transaction. It is plain server-rendered HTML posting here, so it adds no client JavaScript, and
 * every outcome is a redirect back with a notice naming the outcome and the fields in error, never the private text.
 *
 * When an approval is not ready, whatever was entered is first saved as review progress (which decides nothing), so a
 * reviewer never loses work to an error; the only thing held in a short cookie is an amount field that was not a valid amount.
 */
export async function approveRequestAction(formData: FormData): Promise<never> {
  const user = await requirePermission("assistance.update");

  const id = single(formData, "id");
  if (!id) redirect("/admin");
  const back = (notice: ApprovalNotice): never => redirect(approvalRedirect(id, notice));

  if (!hasPermission(user, "assistance.approve")) back({ kind: "error", problems: [], code: "forbidden" });

  const raw = Object.fromEntries(
    ["decision", "needConfirmed", "evidenceReviewed", "otherFundingChecked", "verifiedNeedAmount", "approvedPublicTarget", "paymentDestination", "otherFundingNotes",
      "verificationSummary", "confidentialityLevel", "publicNameConsent", "photoConsent", "medicalDetailsConsent", "institutionNameConsent", "archiveConsent",
      "zakatStatus", "confirmApproval"].map(name => [name, single(formData, name)]),
  ) as Record<string, string | null>;
  const consent = (name: string) => oneOf(raw[name]!, ASSISTANCE_CONSENT_DECISIONS);
  const confidentiality = oneOf(raw.confidentialityLevel!, ASSISTANCE_CONFIDENTIALITY_LEVELS);
  const zakat = oneOf(raw.zakatStatus!, ASSISTANCE_ZAKAT_STATUSES);
  const consents = ["publicNameConsent", "photoConsent", "medicalDetailsConsent", "institutionNameConsent", "archiveConsent"].map(consent);
  // A repeated field, or a value outside what the form offers, is a malformed submission: nothing is saved from it.
  if (Object.values(raw).some(value => value === null) || !confidentiality || !zakat || consents.some(value => value === null)) back({ kind: "error", problems: [], code: "form" });

  const requestVersion = version(single(formData, "expectedRequestUpdatedAt"), false);
  const verificationVersion = version(single(formData, "expectedVerificationUpdatedAt"), true);
  if (requestVersion === "invalid" || requestVersion === null || verificationVersion === "invalid") back({ kind: "error", problems: [], code: "version" });

  const route = parseApprovalRoute(raw.decision);
  const verifiedNeed = amount(raw.verifiedNeedAmount!, "Verified need amount");
  const target = amount(raw.approvedPublicTarget!, "Approved public target");
  const destination = raw.paymentDestination!.trim();
  const summary = raw.verificationSummary!.trim();
  const notes = raw.otherFundingNotes!.trim();

  const problems: ApprovalProblem[] = [];
  if (!route) problems.push("route");
  if (verifiedNeed === "invalid") problems.push("verifiedNeedAmount_format");
  if (target === "invalid") problems.push("approvedPublicTarget_format");
  if (destination.length > ASSISTANCE_PAYMENT_DESTINATION_MAX_LENGTH) problems.push("paymentDestination_long");
  if (summary.length > ASSISTANCE_VERIFICATION_SUMMARY_MAX_LENGTH) problems.push("verificationSummary_long");
  if (notes.length > ASSISTANCE_OTHER_FUNDING_NOTES_MAX_LENGTH) problems.push("otherFundingNotes_long");

  const fields = {
    needConfirmed: on(raw.needConfirmed!), evidenceReviewed: on(raw.evidenceReviewed!), otherFundingChecked: on(raw.otherFundingChecked!),
    verifiedNeedAmount: verifiedNeed === "invalid" ? null : verifiedNeed, approvedPublicTarget: target === "invalid" ? null : target,
    paymentDestination: destination.slice(0, ASSISTANCE_PAYMENT_DESTINATION_MAX_LENGTH), otherFundingNotes: notes.slice(0, ASSISTANCE_OTHER_FUNDING_NOTES_MAX_LENGTH),
    verificationSummary: summary.slice(0, ASSISTANCE_VERIFICATION_SUMMARY_MAX_LENGTH), confidentialityLevel: confidentiality!, zakatStatus: zakat!,
    publicNameConsent: consents[0]!, photoConsent: consents[1]!, medicalDetailsConsent: consents[2]!, institutionNameConsent: consents[3]!, archiveConsent: consents[4]!,
  } satisfies ApprovalInput["fields"];

  problems.push(...approvalProblemsFrom(approvalIssues(route ?? "APPROVED_PRIVATE", fields, { confirmed: on(raw.confirmApproval!) })));

  if (problems.length) {
    // Not ready: keep what was entered as review progress so nothing is lost. This is best effort and never stops the redirect.
    try {
      await saveApprovalDraft({ requestId: id, route, fields, expectedRequestUpdatedAt: requestVersion as Date, expectedVerificationUpdatedAt: verificationVersion as Date | null, actorId: user.id });
    } catch { /* a conflict or an outage must not hide the errors the reviewer needs to see */ }
    const name = approvalDraftCookieName(id);
    if (name && (verifiedNeed === "invalid" || target === "invalid")) {
      (await cookies()).set(name, approvalAmountDraft(raw.verifiedNeedAmount!, raw.approvedPublicTarget!) ?? "", {
        httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: DRAFT_PATH, maxAge: DRAFT_SECONDS,
      });
    }
    back({ kind: "error", problems, code: null });
  }

  let outcome: "approved" | "already_approved";
  let approvedRoute = route;
  try {
    const result = await approveAssistanceRequest({
      requestId: id, route: route!, fields, actorId: user.id,
      expectedRequestUpdatedAt: requestVersion as Date, expectedVerificationUpdatedAt: verificationVersion as Date | null,
    });
    outcome = result.outcome;
    approvedRoute = result.route;
  } catch (error) {
    if (error instanceof AssistanceApprovalError) {
      if (error.code === "incomplete") back({ kind: "error", problems: approvalProblemsFrom(error.fieldErrors ?? {}), code: null });
      back({ kind: "error", problems: [], code: error.code });
    }
    throw error;
  }

  const name = approvalDraftCookieName(id);
  if (name) (await cookies()).delete({ name, path: DRAFT_PATH });
  revalidatePath(`/admin/requests/${id}`);
  revalidatePath("/admin");
  return back({ kind: "done", outcome, route: approvedRoute });
}
