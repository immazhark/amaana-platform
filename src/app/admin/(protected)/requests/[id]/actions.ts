"use server";

import { singleFormValue } from "@/lib/single-form-value";
import {
  AppealCategory,
  AssistanceStatus,
  AssistanceVerificationDecision,
  ConfidentialityLevel,
  ConsentDecision,
  NotificationChannel,
  ZakatReviewStatus,
} from "@prisma/client";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  ASSISTANCE_CONFIDENTIALITY_LEVELS,
  ASSISTANCE_CONSENT_DECISIONS,
  ASSISTANCE_INTERNAL_NOTES_MAX_LENGTH,
  ASSISTANCE_OTHER_FUNDING_NOTES_MAX_LENGTH,
  ASSISTANCE_PAYMENT_DESTINATION_MAX_LENGTH,
  ASSISTANCE_VERIFICATION_DECISIONS,
  ASSISTANCE_VERIFICATION_SUMMARY_MAX_LENGTH,
  ASSISTANCE_ZAKAT_STATUSES,
  canApproveAssistanceRequest,
  getPublicAppealVerificationIssues,
  isManualAssistanceStatusAllowed,
} from "@/lib/assistance";
import { hasPermission, requirePermission } from "@/lib/auth";
import { parsePositiveRupeeAmount } from "@/lib/amount-entry";
import { prisma } from "@/lib/prisma";
import { cancelOpenFollowUpsOnCaseExit } from "@/lib/assistance-follow-up";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";
import { withdrawStaleAnonymousOutcomeCopies } from "@/lib/assistance-outcome-invalidation";

/** Call only after the transaction resolves. Cache failures cannot undo a
 * committed review/assignment or justify replaying it. Try both views, then
 * navigate to the dynamic detail page for a fresh database read if needed. */
function refreshCommittedRequest(id: string) {
  let refreshed = true;
  for (const path of [`/admin/requests/${id}`, "/admin", "/impact"]) {
    try { revalidatePath(path); }
    catch { refreshed = false; }
  }
  return refreshed;
}

const statuses = new Set(Object.values(AssistanceStatus));
const verificationDecisions = new Set<string>(ASSISTANCE_VERIFICATION_DECISIONS);
const consentDecisions = new Set<string>(ASSISTANCE_CONSENT_DECISIONS);
const zakatStatuses = new Set<string>(ASSISTANCE_ZAKAT_STATUSES);
const confidentialityLevels = new Set<string>(ASSISTANCE_CONFIDENTIALITY_LEVELS);

function optionalPositiveAmount(value: FormDataEntryValue | null, field: string) {
  return parsePositiveRupeeAmount(String(value ?? ""), field, { optional: true });
}

function requiredEnum<T extends string>(value: FormDataEntryValue | null, allowed: Set<string>, field: string) {
  const candidate = String(value ?? "");
  if (!allowed.has(candidate)) throw new Error(`Invalid ${field}`);
  return candidate as T;
}

function getGeneralVerificationIssues(input: {
  needConfirmed: boolean;
  evidenceReviewed: boolean;
  verifiedNeedAmount: number | null;
  paymentDestination: string;
  otherFundingChecked: boolean;
  verificationSummary: string;
  decision: AssistanceVerificationDecision;
  zakatStatus: ZakatReviewStatus;
}) {
  const issues: string[] = [];
  if (!input.needConfirmed) issues.push("Need must be confirmed.");
  if (!input.evidenceReviewed) issues.push("Supporting evidence must be reviewed.");
  if (!input.verifiedNeedAmount) issues.push("Verified need amount must be recorded.");
  if (!input.paymentDestination) issues.push("Payment destination must be confirmed.");
  if (!input.otherFundingChecked) issues.push("Other funding or duplicate fundraising must be checked.");
  if (!input.verificationSummary) issues.push("Verification summary is required.");
  if (input.decision === AssistanceVerificationDecision.PENDING) issues.push("A verification decision is required.");
  if (input.zakatStatus === ZakatReviewStatus.UNREVIEWED) issues.push("Zakat review must be recorded as eligible, not eligible, or not applicable.");
  return issues;
}

export async function saveVerification(formData: FormData) {
  const user = await requirePermission("assistance.update");
  const id = String(singleFormValue(formData, "id") ?? "");
  const expectedRequestUpdatedAtRaw = String(singleFormValue(formData, "expectedRequestUpdatedAt") ?? "");
  const expectedRequestUpdatedAt = new Date(expectedRequestUpdatedAtRaw);
  if (!expectedRequestUpdatedAtRaw || Number.isNaN(expectedRequestUpdatedAt.getTime())) throw new Error("Request edit version is missing or invalid. Refresh before saving verification.");
  const expectedVerificationUpdatedAtRaw = String(singleFormValue(formData, "expectedVerificationUpdatedAt") ?? "");
  const expectedVerificationUpdatedAt = expectedVerificationUpdatedAtRaw ? new Date(expectedVerificationUpdatedAtRaw) : null;
  if (expectedVerificationUpdatedAtRaw && Number.isNaN(expectedVerificationUpdatedAt!.getTime())) throw new Error("Verification edit version is invalid. Refresh before saving.");
  const request = await prisma.assistanceRequest.findUniqueOrThrow({
    where: { id },
    select: { id: true, appealId: true, status: true, verification: true },
  });
  if (request.appealId || request.status === AssistanceStatus.CONVERTED_TO_APPEAL) throw new Error("Verification is locked after conversion to an appeal");

  const needConfirmed = singleFormValue(formData, "needConfirmed") === "on";
  const evidenceReviewed = singleFormValue(formData, "evidenceReviewed") === "on";
  const otherFundingChecked = singleFormValue(formData, "otherFundingChecked") === "on";
  const verifiedNeedAmount = optionalPositiveAmount(singleFormValue(formData, "verifiedNeedAmount"), "Verified need amount");
  const approvedPublicTarget = optionalPositiveAmount(singleFormValue(formData, "approvedPublicTarget"), "Approved public target");
  const paymentDestination = String(singleFormValue(formData, "paymentDestination") ?? "").trim();
  const otherFundingNotes = String(singleFormValue(formData, "otherFundingNotes") ?? "").trim();
  const verificationSummary = String(singleFormValue(formData, "verificationSummary") ?? "").trim();
  const decision = requiredEnum<AssistanceVerificationDecision>(singleFormValue(formData, "decision"), verificationDecisions, "verification decision");
  const confidentialityLevel = requiredEnum<ConfidentialityLevel>(singleFormValue(formData, "confidentialityLevel"), confidentialityLevels, "confidentiality level");
  const publicNameConsent = requiredEnum<ConsentDecision>(singleFormValue(formData, "publicNameConsent"), consentDecisions, "public-name consent");
  const photoConsent = requiredEnum<ConsentDecision>(singleFormValue(formData, "photoConsent"), consentDecisions, "photo consent");
  const medicalDetailsConsent = requiredEnum<ConsentDecision>(singleFormValue(formData, "medicalDetailsConsent"), consentDecisions, "medical-details consent");
  const institutionNameConsent = requiredEnum<ConsentDecision>(singleFormValue(formData, "institutionNameConsent"), consentDecisions, "institution-name consent");
  const archiveConsent = requiredEnum<ConsentDecision>(singleFormValue(formData, "archiveConsent"), consentDecisions, "archive consent");
  const zakatStatus = requiredEnum<ZakatReviewStatus>(singleFormValue(formData, "zakatStatus"), zakatStatuses, "Zakat review status");
  const markComplete = singleFormValue(formData, "markComplete") === "on";

  if (paymentDestination.length > ASSISTANCE_PAYMENT_DESTINATION_MAX_LENGTH) throw new Error("Payment destination is too long");
  if (otherFundingNotes.length > ASSISTANCE_OTHER_FUNDING_NOTES_MAX_LENGTH) throw new Error("Other-funding notes are too long");
  if (verificationSummary.length > ASSISTANCE_VERIFICATION_SUMMARY_MAX_LENGTH) throw new Error("Verification summary is too long");
  if (approvedPublicTarget && verifiedNeedAmount && approvedPublicTarget > verifiedNeedAmount) throw new Error("Approved public target cannot exceed the verified need amount");
  if (decision !== AssistanceVerificationDecision.APPROVED_PUBLIC && approvedPublicTarget) throw new Error("A public fundraising target can only be stored for an approved public appeal");

  if (markComplete) {
    if (!hasPermission(user, "assistance.approve")) throw new Error("Approval permission is required to complete verification");
    const generalIssues = getGeneralVerificationIssues({ needConfirmed, evidenceReviewed, verifiedNeedAmount, paymentDestination, otherFundingChecked, verificationSummary, decision, zakatStatus });
    if (generalIssues.length) throw new Error(generalIssues.join(" "));
    if (decision === AssistanceVerificationDecision.APPROVED_PUBLIC) {
      const publicIssues = getPublicAppealVerificationIssues({
        needConfirmed,
        evidenceReviewed,
        verifiedNeedAmount,
        approvedPublicTarget,
        paymentDestination,
        otherFundingChecked,
        verificationSummary,
        decision,
        publicNameConsent,
        photoConsent,
        medicalDetailsConsent,
        institutionNameConsent,
        archiveConsent,
        zakatStatus,
        completedAt: new Date(),
      });
      if (publicIssues.length) throw new Error(publicIssues.join(" "));
    }
  } else if (request.verification?.completedAt && !hasPermission(user, "assistance.approve")) {
    throw new Error("Approval permission is required to reopen a completed verification");
  }

  const completedAt = markComplete ? (request.verification?.completedAt ?? new Date()) : null;
  const reviewedById = markComplete ? user.id : null;
  await withSerializableTransactionRetry(async tx => {
    const stillEditable = await tx.assistanceRequest.findFirst({
      where: { id, appealId: null, status: { not: AssistanceStatus.CONVERTED_TO_APPEAL } },
      select: { id: true, updatedAt: true, verification: { select: { updatedAt: true } } },
    });
    if (!stillEditable) {
      throw new Error("Verification was locked because this request was converted while you were reviewing it. Refresh before saving.");
    }
    if (stillEditable.updatedAt.getTime() !== expectedRequestUpdatedAt.getTime()) {
      throw new Error("This request changed while you were reviewing it. Refresh before saving verification.");
    }
    const currentVerificationUpdatedAt = stillEditable.verification?.updatedAt ?? null;
    if (
      (currentVerificationUpdatedAt === null) !== (expectedVerificationUpdatedAt === null) ||
      (currentVerificationUpdatedAt && expectedVerificationUpdatedAt &&
        currentVerificationUpdatedAt.getTime() !== expectedVerificationUpdatedAt.getTime())
    ) {
      throw new Error("Verification changed while you were reviewing it. Refresh before saving.");
    }
    await tx.assistanceVerification.upsert({
      where: { assistanceRequestId: id },
      create: {
        assistanceRequestId: id,
        needConfirmed,
        evidenceReviewed,
        verifiedNeedAmount,
        approvedPublicTarget,
        paymentDestination: paymentDestination || null,
        otherFundingChecked,
        otherFundingNotes: otherFundingNotes || null,
        verificationSummary: verificationSummary || null,
        decision,
        confidentialityLevel,
        publicNameConsent,
        photoConsent,
        medicalDetailsConsent,
        institutionNameConsent,
        archiveConsent,
        zakatStatus,
        completedAt,
        reviewedById,
      },
      update: {
        needConfirmed,
        evidenceReviewed,
        verifiedNeedAmount,
        approvedPublicTarget,
        paymentDestination: paymentDestination || null,
        otherFundingChecked,
        otherFundingNotes: otherFundingNotes || null,
        verificationSummary: verificationSummary || null,
        decision,
        confidentialityLevel,
        publicNameConsent,
        photoConsent,
        medicalDetailsConsent,
        institutionNameConsent,
        archiveConsent,
        zakatStatus,
        completedAt,
        reviewedById,
      },
    });
    await withdrawStaleAnonymousOutcomeCopies(tx, id, user.id, "VERIFICATION_CHANGED");
    await tx.auditEvent.create({
      data: {
        actorId: user.id,
        action: markComplete ? "assistance.verification_completed" : "assistance.verification_saved",
        entityType: "AssistanceRequest",
        entityId: id,
        metadata: { decision, completed: markComplete, confidentialityLevel, zakatStatus },
      },
    });
  });
  if (!refreshCommittedRequest(id)) redirect(`/admin/requests/${id}`);
}

export async function updateRequest(formData: FormData) {
  const user = await requirePermission("assistance.update");
  const id = String(singleFormValue(formData, "id"));
  const expectedUpdatedAtRaw = String(singleFormValue(formData, "expectedUpdatedAt") ?? "");
  const expectedUpdatedAt = new Date(expectedUpdatedAtRaw);
  if (!expectedUpdatedAtRaw || Number.isNaN(expectedUpdatedAt.getTime())) throw new Error("Request edit version is missing or invalid. Refresh before saving.");
  const status = String(singleFormValue(formData, "status")) as AssistanceStatus;
  const internalNotes = String(singleFormValue(formData, "internalNotes") ?? "").trim();
  if (!statuses.has(status)) throw new Error("Invalid status");
  if (internalNotes.length > ASSISTANCE_INTERNAL_NOTES_MAX_LENGTH) throw new Error("Internal notes are too long");
  const previous = await prisma.assistanceRequest.findUniqueOrThrow({
    where: { id },
    select: { id: true, status: true, appealId: true, email: true, referenceNumber: true, updatedAt: true, verification: { select: { decision: true, completedAt: true } } },
  });
  if (!isManualAssistanceStatusAllowed(previous.status, status, Boolean(previous.appealId))) throw new Error("This status can only be changed by the linked appeal workflow");
  if ((status === AssistanceStatus.APPROVED || status === AssistanceStatus.REJECTED) && previous.status !== status && !hasPermission(user, "assistance.approve")) throw new Error("Approval permission is required");
  if (status === AssistanceStatus.APPROVED && previous.status !== status && !canApproveAssistanceRequest(previous.verification)) throw new Error("Complete verification with an approved decision before marking this request approved");
  if (status === AssistanceStatus.REJECTED && previous.status !== status && (!previous.verification?.completedAt || previous.verification.decision !== AssistanceVerificationDecision.DECLINED)) throw new Error("Complete verification with a declined decision before marking this request rejected");

  await withSerializableTransactionRetry(async tx => {
    const current = await tx.assistanceRequest.findUniqueOrThrow({
      where: { id },
      select: {
        status: true,
        appealId: true,
        updatedAt: true,
        verification: { select: { decision: true, completedAt: true } },
      },
    });
    if (
      current.status !== previous.status ||
      current.appealId !== previous.appealId ||
      current.updatedAt.getTime() !== expectedUpdatedAt.getTime()
    ) {
      throw new Error("This request changed while you were reviewing it. Refresh before saving.");
    }
    if (status === AssistanceStatus.APPROVED && previous.status !== status && !canApproveAssistanceRequest(current.verification)) {
      throw new Error("Verification changed while you were reviewing it. Refresh and confirm the approved verification before saving.");
    }
    if (
      status === AssistanceStatus.REJECTED &&
      previous.status !== status &&
      (!current.verification?.completedAt || current.verification.decision !== AssistanceVerificationDecision.DECLINED)
    ) {
      throw new Error("Verification changed while you were reviewing it. Refresh and confirm the declined verification before saving.");
    }

    const updated = await tx.assistanceRequest.updateMany({
      where: {
        id,
        status: previous.status,
        ...(previous.appealId ? { appealId: previous.appealId } : { appealId: null }),
        updatedAt: expectedUpdatedAt,
      },
      data: { status, internalNotes: internalNotes || null },
    });
    if (updated.count !== 1) {
      throw new Error("This request changed while you were reviewing it. Refresh before saving.");
    }
    await withdrawStaleAnonymousOutcomeCopies(tx, id, user.id, "CASE_CHANGED");
    if (previous.status !== status &&
        (status === AssistanceStatus.CLOSED || status === AssistanceStatus.REJECTED)) {
      await cancelOpenFollowUpsOnCaseExit(
        tx, id, user.id, status === AssistanceStatus.CLOSED ? "CASE_CLOSED" : "CASE_REJECTED",
      );
    }
    await tx.auditEvent.create({ data: { actorId: user.id, action: "assistance.updated", entityType: "AssistanceRequest", entityId: id, metadata: { previousStatus: previous.status, status } } });
    if (previous.status !== status && previous.email) {
      await tx.notification.create({ data: { channel: NotificationChannel.EMAIL, recipient: previous.email, templateKey: "assistance-status-updated", subject: "Your Amaana request status was updated", payload: { referenceNumber: previous.referenceNumber, status }, assistanceRequestId: id } });
    }
  });
  if (!refreshCommittedRequest(id)) redirect(`/admin/requests/${id}`);
}

export async function assignRequest(formData: FormData) {
  const user = await requirePermission("assistance.assign");
  const id = String(singleFormValue(formData, "id"));
  const assignedToId = String(singleFormValue(formData, "assignedToId") || "");
  const expectedUpdatedAtRaw = String(singleFormValue(formData, "expectedUpdatedAt") ?? "");
  const expectedUpdatedAt = new Date(expectedUpdatedAtRaw);
  if (!expectedUpdatedAtRaw || Number.isNaN(expectedUpdatedAt.getTime())) throw new Error("Assignment version is missing or invalid. Refresh before assigning.");
  await withSerializableTransactionRetry(async tx => {
    if (assignedToId) {
      const eligibleAssignee = await tx.user.findFirst({
        where: {
          id: assignedToId,
          status: "ACTIVE",
          roles: { some: { role: { permissions: { some: { permission: { key: "assistance.view" } } } } } },
        },
        select: { id: true },
      });
      if (!eligibleAssignee) throw new Error("The selected staff member cannot access assistance requests");
    }

    const request = await tx.assistanceRequest.findUniqueOrThrow({
      where: { id },
      select: { assignedToId: true, updatedAt: true },
    });
    if (request.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
      throw new Error("This request changed while you were reviewing it. Refresh before assigning.");
    }
    const claimed = await tx.assistanceRequest.updateMany({
      where: { id, updatedAt: expectedUpdatedAt },
      data: { assignedToId: assignedToId || null },
    });
    if (claimed.count !== 1) throw new Error("This request changed while you were reviewing it. Refresh before assigning.");
    await tx.auditEvent.create({
      data: {
        actorId: user.id,
        action: "assistance.assigned",
        entityType: "AssistanceRequest",
        entityId: id,
        metadata: { previousAssignedToId: request.assignedToId, assignedToId: assignedToId || null },
      },
    });
  });
  if (!refreshCommittedRequest(id)) redirect(`/admin/requests/${id}`);
}

export async function convertToAppeal(formData: FormData) {
  const user = await requirePermission("appeal.create");
  if (!hasPermission(user, "assistance.view") || !hasPermission(user, "assistance.update")) redirect("/admin/forbidden");
  const id = String(singleFormValue(formData, "id"));
  const expectedUpdatedAtRaw = String(singleFormValue(formData, "expectedUpdatedAt") ?? "");
  const expectedUpdatedAt = new Date(expectedUpdatedAtRaw);
  if (!expectedUpdatedAtRaw || Number.isNaN(expectedUpdatedAt.getTime())) throw new Error("Conversion version is missing or invalid. Refresh before creating the appeal.");
  const expectedVerificationUpdatedAtRaw = String(singleFormValue(formData, "expectedVerificationUpdatedAt") ?? "");
  const expectedVerificationUpdatedAt = new Date(expectedVerificationUpdatedAtRaw);
  if (!expectedVerificationUpdatedAtRaw || Number.isNaN(expectedVerificationUpdatedAt.getTime())) throw new Error("Verification version is missing or invalid. Refresh before creating the appeal.");
  const title = String(singleFormValue(formData, "title") ?? "").trim();
  const publicSummary = String(singleFormValue(formData, "publicSummary") ?? "").trim();
  const publicStory = String(singleFormValue(formData, "publicStory") ?? "").trim();
  if (title.length < 8 || publicSummary.length < 20 || publicStory.length < 40) throw new Error("A public title, privacy-safe summary and privacy-safe story are required");

  await withSerializableTransactionRetry(async tx => {
    const request = await tx.assistanceRequest.findUniqueOrThrow({ where: { id }, include: { verification: true } });
    if (request.status !== AssistanceStatus.APPROVED || request.appealId) throw new Error("Only approved, unconverted requests can become appeals");
    if (request.updatedAt.getTime() !== expectedUpdatedAt.getTime()) throw new Error("This request changed while you were reviewing it. Refresh before creating the appeal.");
    if (!request.verification?.completedAt || !request.verification.reviewedById) throw new Error("Verification must be completed by an authorised reviewer before appeal conversion");
    if (request.verification.updatedAt.getTime() !== expectedVerificationUpdatedAt.getTime()) throw new Error("Verification changed while you were reviewing it. Refresh before creating the appeal.");
    const verificationIssues = getPublicAppealVerificationIssues(request.verification);
    if (verificationIssues.length) throw new Error(`Public appeal verification is incomplete: ${verificationIssues.join(" ")}`);
    const goalAmount = request.verification.approvedPublicTarget!.toNumber();
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60)}-${Date.now().toString(36)}`;

    const claimed = await tx.assistanceRequest.updateMany({
      where: { id, status: AssistanceStatus.APPROVED, appealId: null, updatedAt: expectedUpdatedAt },
      data: { status: AssistanceStatus.CONVERTED_TO_APPEAL },
    });
    if (claimed.count !== 1) throw new Error("This request was changed or converted by another admin. Refresh before trying again.");
    await cancelOpenFollowUpsOnCaseExit(tx, id, user.id, "APPEAL_CONVERSION");
    await withdrawStaleAnonymousOutcomeCopies(tx, id, user.id, "CASE_CHANGED");

    const appeal = await tx.appeal.create({
      data: {
        slug,
        title,
        summary: publicSummary,
        story: publicStory,
        category: request.category as AppealCategory,
        beneficiaryName: request.applicantName,
        beneficiaryLocation: null,
        goalAmount,
        createdById: user.id,
        assistanceRequest: { connect: { id } },
      },
    });
    await tx.auditEvent.create({
      data: {
        actorId: user.id,
        action: "appeal.created_from_assistance",
        entityType: "Appeal",
        entityId: appeal.id,
        metadata: { assistanceRequestId: id, verificationId: request.verification.id, approvedPublicTarget: goalAmount },
      },
    });
    if (request.email) {
      await tx.notification.create({ data: { channel: NotificationChannel.EMAIL, recipient: request.email, templateKey: "assistance-status-updated", subject: "Your Amaana request status was updated", payload: { referenceNumber: request.referenceNumber, status: AssistanceStatus.CONVERTED_TO_APPEAL }, assistanceRequestId: id } });
    }
  });
  refreshCommittedRequest(id);
  redirect(`/admin/requests/${id}`);
}

/** Match canonical and legacy absolute aliases for an approved managed cover.
 * Public storage keys are opaque; do not interpret arbitrary external URLs. */
function coverPublicationUrls(url: string): { urls: string[]; storageKey: string | null } {
  const variants = new Set([url]);
  let storageKey: string | null = null;
  try {
    const parsed = new URL(url, "https://amaanafoundation.org");
    const sameOrigin = parsed.protocol === "https:" &&
      ["amaanafoundation.org", "www.amaanafoundation.org"].includes(parsed.hostname);
    if ((url.startsWith("/media/") || sameOrigin) &&
        /^\/media\/\d{4}\/[0-9a-f-]{36}\.(?:pdf|jpg|png|webp)$/i.test(parsed.pathname) &&
        !parsed.search && !parsed.hash) {
      const path = parsed.pathname;
      storageKey = path.slice("/media/".length);
      variants.add(path);
      variants.add(`https://amaanafoundation.org${path}`);
      variants.add(`https://www.amaanafoundation.org${path}`);
    }
  } catch {
    // Invalid old cover paths match only their exact stored URL, never a key.
  }
  return { urls: [...variants], storageKey };
}

/**
 * Last-resort one-way privacy stop after case-to-appeal conversion.
 * Ordinary verification stays locked. Revocation and appeal closure/pause must
 * commit together so neither fundraising nor previously public copy outlives
 * the withdrawal in the database.
 */
export async function withdrawConvertedAppealDisclosure(formData: FormData) {
  const user = await requirePermission("assistance.approve");
  if (!hasPermission(user, "appeal.approve")) {
    throw new Error("Both assistance and appeal approval permission are required.");
  }

  function textField(name: string): string {
    const value = singleFormValue(formData, name);
    if (value !== null && typeof value !== "string") {
      throw new Error(`${name} must be a text field.`);
    }
    return value ?? "";
  }

  const id = textField("id").trim();
  const reason = textField("reason").trim();
  const confirmation = textField("confirmWithdrawal");
  const readVersion = (field: string) => {
    const raw = textField(field);
    const parsed = new Date(raw);
    if (!raw || Number.isNaN(parsed.getTime())) {
      throw new Error(`Invalid ${field}. Refresh the request before withdrawing disclosure.`);
    }
    return parsed;
  };
  const expectedRequestUpdatedAt = readVersion("expectedRequestUpdatedAt");
  const expectedVerificationUpdatedAt = readVersion("expectedVerificationUpdatedAt");
  const expectedAppealUpdatedAt = readVersion("expectedAppealUpdatedAt");
  if (!id) throw new Error("Assistance request identity is required.");
  if (confirmation !== "on") throw new Error("Explicit confirmation is required to withdraw public disclosure.");
  if (reason.length < 20 || reason.length > 500) {
    throw new Error("Record a factual private withdrawal reason between 20 and 500 characters.");
  }

  const result = await withSerializableTransactionRetry(async tx => {
    const request = await tx.assistanceRequest.findUniqueOrThrow({
      where: { id },
      select: {
        id: true, status: true, appealId: true, updatedAt: true,
        appeal: {
          select: {
            id: true, slug: true, status: true, updatedAt: true, coverImageUrl: true,
            initiative: { select: { slug: true } },
            cause: { select: { slug: true } },
          },
        },
        verification: {
          select: {
            id: true, updatedAt: true, decision: true, confidentialityLevel: true,
            publicNameConsent: true, photoConsent: true,
            medicalDetailsConsent: true, institutionNameConsent: true,
            archiveConsent: true,
          },
        },
      },
    });

    if (request.status !== AssistanceStatus.CONVERTED_TO_APPEAL ||
        !request.appealId || !request.appeal || request.appeal.id !== request.appealId ||
        !request.verification) {
      throw new Error("An existing linked appeal and verification are required for emergency disclosure withdrawal.");
    }
    if (request.updatedAt.getTime() !== expectedRequestUpdatedAt.getTime() ||
        request.appeal.updatedAt.getTime() !== expectedAppealUpdatedAt.getTime() ||
        request.verification.updatedAt.getTime() !== expectedVerificationUpdatedAt.getTime()) {
      throw new Error("This request, verification or appeal changed while you were reviewing it. Refresh before withdrawing disclosure.");
    }

    const status = request.appeal.status;
    if (!["PUBLISHED", "FUNDED", "CLOSED", "PAUSED"].includes(status)) {
      throw new Error("The linked appeal is not in a public or paused disclosure state.");
    }
    const previous = request.verification;
    if (previous.decision === "APPROVED_PRIVATE" &&
        previous.confidentialityLevel === "HIGHLY_SENSITIVE" &&
        previous.publicNameConsent === "NOT_ALLOWED" &&
        previous.photoConsent === "NOT_ALLOWED" &&
        previous.medicalDetailsConsent === "NOT_ALLOWED" &&
        previous.institutionNameConsent === "NOT_ALLOWED" &&
        previous.archiveConsent === "NOT_ALLOWED" &&
        (status === "CLOSED" || status === "PAUSED")) {
      throw new Error("Public disclosure has already been withdrawn for this appeal.");
    }

    const nextStatus = status === "PUBLISHED" ? "PAUSED" : status === "FUNDED" ? "CLOSED" : status;
    const verificationWrite = await tx.assistanceVerification.updateMany({
      where: { id: previous.id, assistanceRequestId: id, updatedAt: expectedVerificationUpdatedAt },
      data: {
        // Remove public approval while retaining verified needs and ledger facts.
        // This makes PAUSED→PUBLISHED fail even if name and cover are blank.
        decision: "APPROVED_PRIVATE",
        confidentialityLevel: "HIGHLY_SENSITIVE",
        publicNameConsent: "NOT_ALLOWED",
        photoConsent: "NOT_ALLOWED",
        medicalDetailsConsent: "NOT_ALLOWED",
        institutionNameConsent: "NOT_ALLOWED",
        archiveConsent: "NOT_ALLOWED",
      },
    });
    if (verificationWrite.count !== 1) {
      throw new Error("Verification changed while you were reviewing it. Refresh before withdrawing disclosure.");
    }
    const appealWrite = await tx.appeal.updateMany({
      where: { id: request.appeal.id, status, updatedAt: expectedAppealUpdatedAt },
      data: { status: nextStatus, isFeatured: false, featuredOrder: null },
    });
    if (appealWrite.count !== 1) {
      throw new Error("Appeal changed while you were reviewing it. Refresh before withdrawing disclosure.");
    }
    // A cover may be a managed storage object, an old absolute alias, or a
    // separately hosted public URL. All matching approved library references
    // must be unpublished atomically with the consent revocation. This can
    // affect a programme reusing the same asset: privacy takes precedence.
    const cover = request.appeal.coverImageUrl?.trim() ?? "";
    const matching = cover ? coverPublicationUrls(cover) : null;
    const coverAssets = matching
      ? await tx.mediaAsset.findMany({
          where: matching.storageKey
            ? { isPublic: true, OR: [
                { publicUrl: { in: matching.urls } },
                { storageKey: matching.storageKey },
              ] }
            : { isPublic: true, publicUrl: { in: matching.urls } },
          select: { id: true, updatedAt: true, publicUrl: true, storageKey: true },
        })
      : [];
    let externalMediaReviewRequired = Boolean(cover && coverAssets.length === 0);
    for (const asset of coverAssets) {
      if (!asset.storageKey) externalMediaReviewRequired = true;
      const unpublished = await tx.mediaAsset.updateMany({
        where: { id: asset.id, isPublic: true, updatedAt: asset.updatedAt },
        data: { isPublic: false, privacyApprovedAt: null },
      });
      if (unpublished.count !== 1) {
        throw new Error("Media publication changed while withdrawing consent. Refresh and review the case.");
      }
      await tx.auditEvent.create({
        data: {
          actorId: user.id,
          action: "media.unpublished_on_assistance_privacy_withdrawal",
          entityType: "MediaAsset",
          entityId: asset.id,
          metadata: { assistanceRequestId: id, linkedAppealId: request.appeal.id },
        },
      });
    }

    await withdrawStaleAnonymousOutcomeCopies(tx, id, user.id, "VERIFICATION_CHANGED");
    await tx.auditEvent.create({
      data: {
        actorId: user.id,
        action: "assistance.public_disclosure_withdrawn",
        entityType: "AssistanceRequest",
        entityId: id,
        metadata: {
          linkedAppealId: request.appeal.id,
          reason,
          previousAppealStatus: status,
          nextAppealStatus: nextStatus,
          previousDecision: previous.decision,
          previousConfidentiality: previous.confidentialityLevel,
        },
      },
    });
    return {
      appealId: request.appeal.id,
      slug: request.appeal.slug,
      initiativeSlug: request.appeal.initiative?.slug,
      causeSlug: request.appeal.cause?.slug,
      externalMediaReviewRequired,
    };
  });

  // Do not replay a committed revocation if a cache adapter fails. Invalidate
  // every public route independently and show a conspicuous staff warning.
  let refreshDelayed = false;
  try { updateTag("appeals"); } catch { refreshDelayed = true; }
  const paths = [
    `/admin/requests/${id}`, `/admin/appeals/${result.appealId}`, "/admin/appeals",
    "/", "/appeals", `/appeals/${result.slug}`, `/donate/${result.slug}`,
    "/our-work", "/impact",
    ...(result.initiativeSlug ? [`/our-work/${result.initiativeSlug}`] : []),
    ...(result.causeSlug ? [`/our-work/${result.causeSlug}`] : []),
  ];
  for (const path of paths) {
    try { revalidatePath(path); } catch { refreshDelayed = true; }
  }
  redirect(`/admin/requests/${encodeURIComponent(id)}?privacy=${refreshDelayed ? "refresh-delayed" : "withdrawn"}${result.externalMediaReviewRequired ? "&media=review-required" : ""}`);
}
