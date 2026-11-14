export const publicFaithWhere = {
  status: "PUBLISHED" as const,
  religiousReviewStatus: "VERIFIED" as const,
  verifiedAt: { not: null },
  sourceCitation: { not: null },
};

export function isPublicFaithReviewComplete(input: {
  status: string;
  religiousReviewStatus: string;
  verifiedAt: Date | null;
  sourceCitation: string | null;
}) {
  // Database records cross a runtime boundary; malformed rows must never
  // become reviewed public religious content or interrupt the public index.
  if (!input || typeof input !== "object" || Array.isArray(input)) return false;
  return input.status === "PUBLISHED" &&
    input.religiousReviewStatus === "VERIFIED" &&
    input.verifiedAt instanceof Date &&
    Number.isFinite(input.verifiedAt.getTime()) &&
    typeof input.sourceCitation === "string" && input.sourceCitation.trim().length > 0;
}
