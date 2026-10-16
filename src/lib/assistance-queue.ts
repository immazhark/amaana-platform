import { AssistanceStatus, type AssistanceVerificationDecision, type Prisma } from "@prisma/client";

export const ASSISTANCE_QUEUE_STATUSES = Object.values(AssistanceStatus);
export type AssistanceQueueFilters = {
  status?: AssistanceStatus;
  assignment: "all" | "mine" | "unassigned";
  order: "newest" | "oldest";
  age: "all" | "7d" | "30d";
  city?: string;
  review: "all" | "incomplete" | "complete";
  followUp: "all" | "due" | "open" | "none" | "mine";
  delivery: "all" | "reported" | "proof_missing" | "ready" | "confirmed" | "bank_pending" | "bank_missing" | "bank_reviewed" | "none";
  outcome: "all" | "reported" | "reviewed" | "copy_draft" | "copy_approved" | "none";
};
type SearchValue = string | string[] | undefined;

export function parseAssistanceQueueFilters(params: {
  status?: SearchValue; assignment?: SearchValue; order?: SearchValue; age?: SearchValue; city?: SearchValue; review?: SearchValue; followUp?: SearchValue; delivery?: SearchValue; outcome?: SearchValue;
}): AssistanceQueueFilters {
  const status = ASSISTANCE_QUEUE_STATUSES.find(value => value === params.status);
  // Administrative geography is a verbatim self-reported city, never a
  // guessed service zone. Bound it before passing it to a database predicate.
  const city = typeof params.city === "string" ? params.city.trim() : "";
  const validCity = city && city.length <= 80 && !/[\u0000-\u001f\u007f]/.test(city);
  return {
    ...(status ? { status } : {}),
    assignment: params.assignment === "mine" || params.assignment === "unassigned" ? params.assignment : "all",
    order: params.order === "oldest" ? "oldest" : "newest",
    age: params.age === "7d" || params.age === "30d" ? params.age : "all",
    ...(validCity ? { city } : {}),
    review: params.review === "incomplete" || params.review === "complete" ? params.review : "all",
    followUp: params.followUp === "due" || params.followUp === "open" || params.followUp === "none" || params.followUp === "mine" ? params.followUp : "all",
    delivery: params.delivery === "bank_pending" || params.delivery === "bank_missing" ||
      params.delivery === "bank_reviewed" || params.delivery === "reported" || params.delivery === "proof_missing" ||
      params.delivery === "ready" || params.delivery === "confirmed" ||
      params.delivery === "none" ? params.delivery : "all",
    outcome: params.outcome === "reported" || params.outcome === "reviewed" ||
      params.outcome === "copy_draft" || params.outcome === "copy_approved" ||
      params.outcome === "none" ? params.outcome : "all",
  };
}

/** The signed-in user supplies the identity; no query-string staff ID is accepted. */
export function assistanceQueueAssignmentWhere(
  assignment: AssistanceQueueFilters["assignment"], userId: string,
): Prisma.AssistanceRequestWhereInput {
  if (assignment === "mine") return { assignedToId: userId };
  if (assignment === "unassigned") return { assignedToId: null };
  return {};
}

/** Elapsed-age cutoffs are triage aids, not deadlines or case urgency assessments.
 * Compare timestamps in UTC with a single request-local snapshot. */
export function assistanceQueueAgeWhere(age: AssistanceQueueFilters["age"], now: Date): Prisma.AssistanceRequestWhereInput {
  if (age === "all") return {};
  const days = age === "30d" ? 30 : 7;
  return { createdAt: { lte: new Date(now.getTime() - days * 86_400_000) } };
}

/** Draft review decisions cannot substitute for reviewer completion. */
export function assistanceQueueReviewWhere(review: AssistanceQueueFilters["review"]): Prisma.AssistanceRequestWhereInput {
  if (review === "complete") return { verification: { is: { completedAt: { not: null } } } };
  if (review === "incomplete") return {
    OR: [
      { verification: { is: null } },
      { verification: { is: { completedAt: null } } },
    ],
  };
  return {};
}

/** Only operator-authored, unresolved task dates are used for action triage;
 * never infer clinical priority or an organization-wide response deadline. */
export function assistanceQueueFollowUpWhere(
  followUp: AssistanceQueueFilters["followUp"], today: string, userId: string,
): Prisma.AssistanceRequestWhereInput {
  if (followUp === "all") return {};
  if (followUp === "mine") return { followUps: { some: { state: "OPEN", assignedToId: userId } } };
  if (followUp === "none") return { followUps: { none: { state: "OPEN" } } };
  if (followUp === "open") return { followUps: { some: { state: "OPEN" } } };
  return { followUps: { some: {
    state: "OPEN", dueOn: { lte: new Date(`${today}T00:00:00.000Z`) },
  } } };
}

/** A report awaiting evidence review is not independently confirmed support. */
export function assistanceQueueDeliveryWhere(delivery: AssistanceQueueFilters["delivery"]): Prisma.AssistanceRequestWhereInput {
  if (delivery === "reported") return { deliveryRecords: { some: { state: "REPORTED" } } };
  if (delivery === "proof_missing") return {
    deliveryRecords: { some: { state: "REPORTED", evidenceDocumentId: null } },
  };
  if (delivery === "ready") return {
    deliveryRecords: { some: { state: "REPORTED", evidenceDocumentId: { not: null } } },
  };
  if (delivery === "confirmed") return { deliveryRecords: { some: { state: "CONFIRMED" } } };
  if (delivery === "bank_missing") return { deliveryRecords: { some: {
    kind: "FINANCIAL", state: "CONFIRMED", financialReconciliation: { is: null },
  } } };
  if (delivery === "bank_pending") return { deliveryRecords: { some: {
    kind: "FINANCIAL", state: "CONFIRMED", financialReconciliation: { is: { status: "PENDING" } },
  } } };
  if (delivery === "bank_reviewed") return { deliveryRecords: { some: {
    kind: "FINANCIAL", state: "CONFIRMED", financialReconciliation: { is: { status: "EVIDENCE_REVIEWED" } },
  } } };
  if (delivery === "none") return { deliveryRecords: { none: { state: { in: ["REPORTED", "CONFIRMED"] } } } };
  return {};
}

/** Only internal observation review states. Never imply public impact. */
export function assistanceQueueOutcomeWhere(
  outcome: AssistanceQueueFilters["outcome"],
): Prisma.AssistanceRequestWhereInput {
  if (outcome === "reported") return { outcomeObservations: { some: { state: "REPORTED" } } };
  if (outcome === "reviewed") return { outcomeObservations: { some: { state: "REVIEWED" } } };
  if (outcome === "copy_draft") return {
    outcomeObservations: { some: { state: "REVIEWED",
      disclosure: { is: { state: "DRAFT" } } } },
  };
  if (outcome === "copy_approved") return {
    outcomeObservations: { some: { state: "REVIEWED",
      disclosure: { is: { state: "APPROVED_COPY" } } } },
  };
  if (outcome === "none") return {
    outcomeObservations: { none: { state: { in: ["REPORTED", "REVIEWED"] } } },
  };
  return {};
}

export function assistanceQueueHref(filters: AssistanceQueueFilters, page = 1) {
  return {
    pathname: "/admin",
    query: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.assignment !== "all" ? { assignment: filters.assignment } : {}),
      ...(filters.order !== "newest" ? { order: filters.order } : {}),
      ...(filters.age !== "all" ? { age: filters.age } : {}),
      ...(filters.city ? { city: filters.city } : {}),
      ...(filters.review !== "all" ? { review: filters.review } : {}),
      ...(filters.followUp !== "all" ? { followUp: filters.followUp } : {}),
      ...(filters.delivery !== "all" ? { delivery: filters.delivery } : {}),
      ...(filters.outcome !== "all" ? { outcome: filters.outcome } : {}),
      ...(page > 1 ? { page } : {}),
    },
  };
}

const VERIFICATION_LABELS: Record<AssistanceVerificationDecision, string> = {
  PENDING: "Decision needs review",
  APPROVED_PUBLIC: "Approved for draft appeal",
  APPROVED_PRIVATE: "Approved for private support",
  APPROVED_PARTIAL: "Partial support approved",
  REFERRED: "Referred",
  DECLINED: "Declined",
};

/** Keep the queue's completion signal aligned with the private review record.
 * Draft decisions remain incomplete until an authorized reviewer records completion. */
export function assistanceQueueVerificationLabel(
  review: { decision: AssistanceVerificationDecision; completedAt: Date | null } | null,
): string {
  if (!review) return "Not started";
  return review.completedAt ? VERIFICATION_LABELS[review.decision] : "In progress";
}

/** Operational elapsed age only; no invented urgency classification or SLA. */
export function assistanceQueueAge(createdAt: Date, now: Date): string {
  const elapsed = now.getTime() - createdAt.getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) return "Date needs review";
  const days = Math.floor(elapsed / 86_400_000);
  return days === 0 ? "Under 1 day" : `${days} ${days === 1 ? "day" : "days"}`;
}
