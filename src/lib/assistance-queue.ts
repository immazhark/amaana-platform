import { AssistanceStatus, type Prisma } from "@prisma/client";

export const ASSISTANCE_QUEUE_STATUSES = Object.values(AssistanceStatus);
export type AssistanceQueueFilters = {
  status?: AssistanceStatus;
  assignment: "all" | "mine" | "unassigned";
  order: "newest" | "oldest";
};
type SearchValue = string | string[] | undefined;

export function parseAssistanceQueueFilters(params: {
  status?: SearchValue; assignment?: SearchValue; order?: SearchValue;
}): AssistanceQueueFilters {
  const status = ASSISTANCE_QUEUE_STATUSES.find(value => value === params.status);
  return {
    ...(status ? { status } : {}),
    assignment: params.assignment === "mine" || params.assignment === "unassigned" ? params.assignment : "all",
    order: params.order === "oldest" ? "oldest" : "newest",
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

export function assistanceQueueHref(filters: AssistanceQueueFilters, page = 1) {
  return {
    pathname: "/admin",
    query: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.assignment !== "all" ? { assignment: filters.assignment } : {}),
      ...(filters.order !== "newest" ? { order: filters.order } : {}),
      ...(page > 1 ? { page } : {}),
    },
  };
}

/** Operational elapsed age only; no invented urgency classification or SLA. */
export function assistanceQueueAge(createdAt: Date, now: Date): string {
  const elapsed = now.getTime() - createdAt.getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) return "Date needs review";
  const days = Math.floor(elapsed / 86_400_000);
  return days === 0 ? "Under 1 day" : `${days} ${days === 1 ? "day" : "days"}`;
}
