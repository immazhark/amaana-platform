/** A receipt credential proves control of ONE donation record, not donor
 * account identity or ownership of all donations sharing an email address. */
export const DONOR_RIGHTS_KINDS = ["ACCESS", "CORRECTION", "DELETION_REVIEW"] as const;
export type DonorRightsKind = typeof DONOR_RIGHTS_KINDS[number];
export const DONOR_RIGHTS_LABELS: Record<DonorRightsKind, string> = {
  ACCESS: "Request access to this donation's information",
  CORRECTION: "Request correction of information",
  DELETION_REVIEW: "Ask for deletion or retention review",
};
export const DONOR_RIGHTS_STATUSES = ["OPEN", "IN_REVIEW", "CLOSED"] as const;
export type DonorRightsStatus = typeof DONOR_RIGHTS_STATUSES[number];

export function isDonorRightsKind(value: unknown): value is DonorRightsKind {
  return typeof value === "string" && DONOR_RIGHTS_KINDS.some(kind => kind === value);
}
export function isDonorRightsStatus(value: unknown): value is DonorRightsStatus {
  return typeof value === "string" && DONOR_RIGHTS_STATUSES.some(status => status === value);
}

/** Deliberately exclude all contact details, donation amounts and private
 * identifiers from the client-visible rights status projection. */
export function projectDonorRightsStatuses(
  records: readonly { kind: string; status: string; createdAt: Date }[],
): Array<{ kind: DonorRightsKind; status: DonorRightsStatus; requestedAt: string }> {
  const seen = new Set<DonorRightsKind>();
  const projected: Array<{ kind: DonorRightsKind; status: DonorRightsStatus; requestedAt: string }> = [];
  for (const record of [...records].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())) {
    if (!isDonorRightsKind(record.kind) || !isDonorRightsStatus(record.status) || seen.has(record.kind) ||
        !Number.isFinite(record.createdAt.getTime())) continue;
    seen.add(record.kind);
    projected.push({ kind: record.kind, status: record.status, requestedAt: record.createdAt.toISOString() });
  }
  return projected;
}
