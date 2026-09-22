"use server";

import {
  AppealCategory,
  AssistanceStatus,
  AssistanceVerificationDecision,
  ConfidentialityLevel,
  ConsentDecision,
  NotificationChannel,
  ZakatReviewStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
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
import { prisma } from "@/lib/prisma";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";

const statuses = new Set(Object.values(AssistanceStatus));
const verificationDecisions = new Set<string>(ASSISTANCE_VERIFICATION_DECISIONS);
const consentDecisions = new Set<string>(ASSISTANCE_CONSENT_DECISIONS);
const zakatStatuses = new Set<string>(ASSISTANCE_ZAKAT_STATUSES);
const confidentialityLevels = new Set<string>(ASSISTANCE_CONFIDENTIALITY_LEVELS);

function optionalPositiveAmount(value: FormDataEntryValue | null, field: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000_000) throw new Error(`${field} must be a positive amount`);
  return amount;
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
  const id = String(formData.get("id") ?? "");
  const request = await prisma.assistanceRequest.findUniqueOrThrow({
    where: { id },
    select: { id: true, appealId: true, status: true, verification: true },
  });
  if (request.appealId || request.status === AssistanceStatus.CONVERTED_TO_APPEAL) throw new Error("Verification is locked after conversion to an appeal");

  const needConfirmed = formData.get("needConfirmed") === "on";
  const evidenceReviewed = formData.get("evidenceReviewed") === "on";
  const otherFundingChecked = formData.get("otherFundingChecked") === "on";
  const verifiedNeedAmount = optionalPositiveAmount(formData.get("verifiedNeedAmount"), "Verified need amount");
  const approvedPublicTarget = optionalPositiveAmount(formData.get("approvedPublicTarget"), "Approved public target");
  const paymentDestination = String(formData.get("paymentDestination") ?? "").trim();
  const otherFundingNotes = String(formData.get("otherFundingNotes") ?? "").trim();
  const verificationSummary = String(formData.get("verificationSummary") ?? "").trim();
  const decision = requiredEnum<AssistanceVerificationDecision>(formData.get("decision"), verificationDecisions, "verification decision");
  const confidentialityLevel = requiredEnum<ConfidentialityLevel>(formData.get("confidentialityLevel"), confidentialityLevels, "confidentiality level");
  const publicNameConsent = requiredEnum<ConsentDecision>(formData.get("publicNameConsent"), consentDecisions, "public-name consent");
  const photoConsent = requiredEnum<ConsentDecision>(formData.get("photoConsent"), consentDecisions, "photo consent");
  const medicalDetailsConsent = requiredEnum<ConsentDecision>(formData.get("medicalDetailsConsent"), consentDecisions, "medical-details consent");
  const institutionNameConsent = requiredEnum<ConsentDecision>(formData.get("institutionNameConsent"), consentDecisions, "institution-name consent");
  const archiveConsent = requiredEnum<ConsentDecision>(formData.get("archiveConsent"), consentDecisions, "archive consent");
  const zakatStatus = requiredEnum<ZakatReviewStatus>(formData.get("zakatStatus"), zakatStatuses, "Zakat review status");
  const markComplete = formData.get("markComplete") === "on";

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
      select: { id: true },
    });
    if (!stillEditable) {
      throw new Error("Verification was locked because this request was converted while you were reviewing it. Refresh before saving.");
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
  revalidatePath(`/admin/requests/${id}`);
  revalidatePath("/admin");
}

export async function updateRequest(formData: FormData) {
  const user = await requirePermission("assistance.update");
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as AssistanceStatus;
  const internalNotes = String(formData.get("internalNotes") ?? "").trim();
  if (!statuses.has(status)) throw new Error("Invalid status");
  if (internalNotes.length > ASSISTANCE_INTERNAL_NOTES_MAX_LENGTH) throw new Error("Internal notes are too long");
  const previous = await prisma.assistanceRequest.findUniqueOrThrow({
    where: { id },
    select: { id: true, status: true, appealId: true, email: true, referenceNumber: true, verification: { select: { decision: true, completedAt: true } } },
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
        verification: { select: { decision: true, completedAt: true } },
      },
    });
    if (
      current.status !== previous.status ||
      current.appealId !== previous.appealId
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
      },
      data: { status, internalNotes: internalNotes || null },
    });
    if (updated.count !== 1) {
      throw new Error("This request changed while you were reviewing it. Refresh before saving.");
    }
    await tx.auditEvent.create({ data: { actorId: user.id, action: "assistance.updated", entityType: "AssistanceRequest", entityId: id, metadata: { previousStatus: previous.status, status } } });
    if (previous.status !== status && previous.email) {
      await tx.notification.create({ data: { channel: NotificationChannel.EMAIL, recipient: previous.email, templateKey: "assistance-status-updated", subject: "Your Amaana request status was updated", payload: { referenceNumber: previous.referenceNumber, status }, assistanceRequestId: id } });
    }
  });
  revalidatePath(`/admin/requests/${id}`);
  revalidatePath("/admin");
}

export async function assignRequest(formData: FormData) {
  const user = await requirePermission("assistance.assign");
  const id = String(formData.get("id"));
  const assignedToId = String(formData.get("assignedToId") || "");
  if (assignedToId) {
    const eligibleAssignee = await prisma.user.findFirst({
      where: {
        id: assignedToId,
        status: "ACTIVE",
        roles: { some: { role: { permissions: { some: { permission: { key: "assistance.view" } } } } } },
      },
      select: { id: true },
    });
    if (!eligibleAssignee) throw new Error("The selected staff member cannot access assistance requests");
  }
  await prisma.$transaction([
    prisma.assistanceRequest.update({ where: { id }, data: { assignedToId: assignedToId || null } }),
    prisma.auditEvent.create({ data: { actorId: user.id, action: "assistance.assigned", entityType: "AssistanceRequest", entityId: id, metadata: { assignedToId: assignedToId || null } } }),
  ]);
  revalidatePath(`/admin/requests/${id}`);
  revalidatePath("/admin");
}

export async function convertToAppeal(formData: FormData) {
  const user = await requirePermission("appeal.create");
  if (!hasPermission(user, "assistance.view") || !hasPermission(user, "assistance.update")) redirect("/admin/forbidden");
  const id = String(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  const publicSummary = String(formData.get("publicSummary") ?? "").trim();
  const publicStory = String(formData.get("publicStory") ?? "").trim();
  if (title.length < 8 || publicSummary.length < 20 || publicStory.length < 40) throw new Error("A public title, privacy-safe summary and privacy-safe story are required");

  await withSerializableTransactionRetry(async tx => {
    const request = await tx.assistanceRequest.findUniqueOrThrow({ where: { id }, include: { verification: true } });
    if (request.status !== AssistanceStatus.APPROVED || request.appealId) throw new Error("Only approved, unconverted requests can become appeals");
    if (!request.verification?.completedAt || !request.verification.reviewedById) throw new Error("Verification must be completed by an authorised reviewer before appeal conversion");
    const verificationIssues = getPublicAppealVerificationIssues(request.verification);
    if (verificationIssues.length) throw new Error(`Public appeal verification is incomplete: ${verificationIssues.join(" ")}`);
    const goalAmount = request.verification.approvedPublicTarget!.toNumber();
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60)}-${Date.now().toString(36)}`;

    const claimed = await tx.assistanceRequest.updateMany({
      where: { id, status: AssistanceStatus.APPROVED, appealId: null },
      data: { status: AssistanceStatus.CONVERTED_TO_APPEAL },
    });
    if (claimed.count !== 1) throw new Error("This request was changed or converted by another admin. Refresh before trying again.");

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
  redirect(`/admin/requests/${id}`);
}
