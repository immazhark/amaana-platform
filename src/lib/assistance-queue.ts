import { AssistanceStatus, type AssistanceVerificationDecision, type Prisma } from "@prisma/client";

export const ASSISTANCE_QUEUE_STATUSES = Object.values(AssistanceStatus);
export type AssistanceQueueFilters = {
  status?: AssistanceStatus;
  assignment: "all" | "mine" | "unassigned";
  order: "newest" | "oldest";
  age: "all" | "7d" | "30d";
  city?: string;
  review: "all" | "incomplete" | "complete";
};
type SearchValue = string | string[] | undefined;

export function parseAssistanceQueueFilters(params: {
  status?: SearchValue; assignment?: SearchValue; order?: SearchValue; age?: SearchValue; city?: SearchValue; review?: SearchValue;
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
      ...(page > 1 ? { page } : {}),
    },
  };
}

const VERIFICATION_LABELS: Record<AssistanceVerificationDecision, string> = {
  PENDING: "Decision needs review",
  APPROVED_PUBLIC: "Public appeal approved",
  APPROVED_PRIVATE: "Private support approved",
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
