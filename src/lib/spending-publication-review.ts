import { validPublishableSummary } from "@/lib/fund-disbursement";

type DraftReviewInput = {
  status: string;
  publicSummary: string | null;
  createdById: string | null;
  pool: "ZAKAT" | "NON_ZAKAT";
  zakatEligibilityConfirmedAt: Date | null;
};

/** Private review guidance only. The publication service remains the authority. */
export function spendingPublicationReview(entry: DraftReviewInput, actorId: string, soleOperator: boolean) {
  if (entry.status !== "DRAFT") return null;
  const summary = validPublishableSummary(entry.publicSummary) ? entry.publicSummary : null;
  const reviewer: "unrecorded" | "second-person" | "sole-operator" | "same-person" = !entry.createdById ? "unrecorded" : entry.createdById !== actorId ? "second-person" : soleOperator ? "sole-operator" : "same-person";
  const eligibility: "not-applicable" | "recorded" | "not-recorded" = entry.pool !== "ZAKAT" ? "not-applicable" : entry.zakatEligibilityConfirmedAt instanceof Date && Number.isFinite(entry.zakatEligibilityConfirmedAt.getTime()) ? "recorded" : "not-recorded";
  return { summary, summaryReady: summary !== null, reviewer, eligibility };
}
