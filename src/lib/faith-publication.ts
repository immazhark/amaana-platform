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
  return input.status === "PUBLISHED" &&
    input.religiousReviewStatus === "VERIFIED" &&
    input.verifiedAt instanceof Date &&
    Boolean(input.sourceCitation?.trim());
}
