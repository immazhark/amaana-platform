import "server-only";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashReceiptToken } from "@/lib/donations";
import { canPublishDonorRecognition, parseDonorRecognitionName } from "@/lib/donor-recognition";

export const donorRecognitionEnabled = () => process.env.AMAANA_DONOR_RECOGNITION_ENABLED === "true";

/** Receipt credential stays in POST body and browser memory, never in query
 * strings, public content, admin logs or donation publicity metadata. */
export async function findDonorRecognitionByReceipt(reference: string, token: string) {
  const record = await prisma.donation.findUnique({
    where: { referenceNumber: reference },
    select: {
      id: true, receiptTokenHash: true, status: true, isAnonymous: true,
      refundedAmount: true, recognitionDisplayName: true,
      recognitionRequestedAt: true, recognitionApprovedAt: true, recognitionRevokedAt: true,
    },
  });
  const supplied = Buffer.from(hashReceiptToken(token), "utf8");
  const stored = Buffer.from(record?.receiptTokenHash ?? "0".repeat(64), "utf8");
  if (!record || supplied.length !== stored.length || !timingSafeEqual(supplied, stored)) return null;
  return record;
}

export function privateRecognitionState(record: {
  status: string; isAnonymous: boolean; refundedAmount: { toNumber(): number };
  recognitionDisplayName: string | null; recognitionRequestedAt: Date | null;
  recognitionApprovedAt: Date | null; recognitionRevokedAt: Date | null;
}): "unavailable" | "inactive" | "pending" | "published" {
  if (record.status !== "CAPTURED" || record.isAnonymous || record.refundedAmount.toNumber() !== 0) return "unavailable";
  if (canPublishDonorRecognition({ ...record, refundedAmount: record.refundedAmount.toNumber() })) return "published";
  if (record.recognitionRequestedAt && !record.recognitionRevokedAt && !record.recognitionApprovedAt &&
      parseDonorRecognitionName(record.recognitionDisplayName)) return "pending";
  return "inactive";
}

/** Only named, separately requested and staff-approved, fully unrefunded
 * donations may appear. No contact, amount, payment or intent data is selected. */
export async function listReviewedDonorRecognition(limit = 36) {
  if (!donorRecognitionEnabled()) return [];
  const rows = await prisma.donation.findMany({
    where: {
      status: "CAPTURED", isAnonymous: false, refundedAmount: 0,
      recognitionRequestedAt: { not: null }, recognitionApprovedAt: { not: null },
      recognitionRevokedAt: null, recognitionDisplayName: { not: null },
    },
    select: {
      recognitionDisplayName: true, recognitionRequestedAt: true,
      recognitionApprovedAt: true, recognitionRevokedAt: true,
      status: true, isAnonymous: true, refundedAmount: true,
    },
    orderBy: [{ recognitionApprovedAt: "desc" }, { id: "desc" }],
    take: Math.min(Math.max(limit, 1), 48),
  });
  return rows.flatMap(row => canPublishDonorRecognition({
    ...row, refundedAmount: row.refundedAmount.toNumber(),
  }) ? [{ name: row.recognitionDisplayName! }] : []);
}
