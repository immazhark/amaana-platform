import "server-only";
import { timingSafeEqual } from "node:crypto";
import type { DonorRightsRequestKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashReceiptToken } from "@/lib/donations";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";
import { DONOR_RIGHTS_KINDS, projectDonorRightsStatuses, type DonorRightsKind } from "@/lib/donor-rights";

export const donorRightsEnabled = () => process.env.AMAANA_DONOR_RIGHTS_ENABLED === "true";

/** One scoped receipt credential can act only on its own donation record. */
export async function findDonationRightsCapability(reference: string, token: string) {
  const donation = await prisma.donation.findUnique({
    where: { referenceNumber: reference },
    select: { id: true, receiptTokenHash: true },
  });
  const submitted = Buffer.from(hashReceiptToken(token), "hex");
  const expected = Buffer.from(donation?.receiptTokenHash ?? "0".repeat(64), "hex");
  if (!donation || submitted.length !== expected.length ||
      !timingSafeEqual(submitted, expected)) return null;
  return donation.id;
}

/** Return only the most recent safe status for each kind, not donor identity,
 * receipt capability, monetary details or private administrative notes. */
export async function readDonationRightsStatuses(donationId: string) {
  // A combined take:30 silently hides one category after many prior
  // requests in another category. Look up each latest row independently.
  const latest = await Promise.all(DONOR_RIGHTS_KINDS.map(kind =>
    prisma.donorRightsRequest.findFirst({
      where: { donationId, kind },
      select: { kind: true, status: true, createdAt: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
  ));
  return projectDonorRightsStatuses(latest.filter(row => row !== null));
}

/** Serializable check-and-insert allows at most one active request per
 * donation and kind without forcing a permanent uniqueness constraint that
 * would prevent a legitimate new request after resolution. */
export async function openDonationRightsRequest(donationId: string, kind: DonorRightsKind) {
  return withSerializableTransactionRetry(async tx => {
    const existing = await tx.donorRightsRequest.findFirst({
      where: { donationId, kind: kind as DonorRightsRequestKind, status: { in: ["OPEN", "IN_REVIEW"] } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { status: true, createdAt: true },
    });
    if (existing) return { status: existing.status, requestedAt: existing.createdAt.toISOString() };
    const created = await tx.donorRightsRequest.create({
      data: { donationId, kind: kind as DonorRightsRequestKind },
      select: { status: true, createdAt: true },
    });
    return { status: created.status, requestedAt: created.createdAt.toISOString() };
  });
}
