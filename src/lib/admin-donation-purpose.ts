import { resolvePrivateDonationPurpose } from "@/lib/donation-destination";

type DonationPurposeInput = Parameters<typeof resolvePrivateDonationPurpose>[0];

export type AdminDonationPurpose = {
  label: string;
  provenance: "original" | "legacy" | "review";
  requiresReview: boolean;
};

/** A corrupt legacy destination must not take down the full finance console.
 * Preserve a conspicuous staff-only warning; never silently substitute a
 * current fund/appeal title for a malformed original donor designation. */
export function getAdminDonationPurpose(donation: DonationPurposeInput): AdminDonationPurpose {
  try {
    const result = resolvePrivateDonationPurpose(donation);
    return { ...result, requiresReview: result.provenance === "review" };
  } catch {
    return {
      label: "Donation destination requires reconciliation",
      provenance: "review",
      requiresReview: true,
    };
  }
}
