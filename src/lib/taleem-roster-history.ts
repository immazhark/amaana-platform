import type { Prisma } from "@prisma/client";
import type { rosterLearnerFilters } from "./taleem-roster-review";

export const TALEEM_HISTORY_PAGE_SIZE = 25;
type Boundary = { startedOn: Date; id: string };
type Filters = ReturnType<typeof rosterLearnerFilters>;

/** Accept only an existing opaque learner alias, never a name or arbitrary record ID. */
export function selectHistoryLearner<T extends { publicAlias: string }>(learners: readonly T[], raw: unknown) {
  return typeof raw === "string" && /^TL-[A-HJ-NP-Z2-9]{8}$/.test(raw) ? learners.find(learner => learner.publicAlias === raw) : undefined;
}

export function historyBoundary(raw: unknown): Boundary | null {
  if (typeof raw !== "string" || raw.length > 91) return null;
  const match = /^(\d{4}-\d{2}-\d{2})~([A-Za-z0-9_-]{1,80})$/.exec(raw);
  if (!match) return null;
  const startedOn = new Date(`${match[1]}T00:00:00.000Z`);
  if (!Number.isFinite(startedOn.getTime()) || startedOn.toISOString().slice(0, 10) !== match[1]) return null;
  return { startedOn, id: match[2]! };
}

function periodSelection(boundary: Boundary | null) {
  return {
    ...(boundary ? { where: { OR: [{ startedOn: { lt: boundary.startedOn } }, { startedOn: boundary.startedOn, id: { lt: boundary.id } }] } } : {}),
    orderBy: [{ startedOn: "desc" as const }, { id: "desc" as const }],
    take: TALEEM_HISTORY_PAGE_SIZE + 1,
  };
}

/** Read one selected learner's bounded history only. Nested relations enforce the learner scope. */
export function loadTaleemHistory(client: Pick<Prisma.TransactionClient, "taleemLearner">, learnerId: string, programmeBefore: Boundary | null, assignmentBefore: Boundary | null) {
  return client.taleemLearner.findUnique({
    where: { id: learnerId },
    select: {
      enrolments: { ...periodSelection(programmeBefore), select: { id: true, programme: true, startedOn: true, endedOn: true } },
      assignments: { ...periodSelection(assignmentBefore), select: { id: true, startedOn: true, endedOn: true, place: { select: { placeCode: true } } } },
    },
  });
}

export function historyPage<T extends Boundary>(records: readonly T[]) {
  const rows = records.slice(0, TALEEM_HISTORY_PAGE_SIZE);
  return { rows, older: records.length > TALEEM_HISTORY_PAGE_SIZE ? rows.at(-1) ?? null : null };
}

export function historyPeriodState(period: { startedOn: Date; endedOn: Date | null }, day: Date) {
  return period.startedOn > day ? "Scheduled" : period.endedOn && period.endedOn < day ? "Ended" : "Current on date";
}

const encodeBoundary = (boundary: Boundary) => boundary.startedOn.toISOString().slice(0, 10) + "~" + boundary.id;

/** Use only server-validated roster filters, a selected alias and validated boundaries. */
export function historyHref(filters: Filters, alias?: string, programmeBefore?: Boundary | null, assignmentBefore?: Boundary | null) {
  const query = new URLSearchParams();
  if (filters.programme !== "ALL") query.set("programmeFilter", filters.programme);
  if (filters.status !== "ALL") query.set("statusFilter", filters.status);
  if (filters.placement !== "ALL") query.set("placementFilter", filters.placement);
  if (alias) {
    query.set("historyLearner", alias);
    if (programmeBefore) query.set("programmeBefore", encodeBoundary(programmeBefore));
    if (assignmentBefore) query.set("assignmentBefore", encodeBoundary(assignmentBefore));
  }
  return "/admin/taleem" + (query.size ? "?" + query.toString() : "") + (alias ? "#learner-history-heading" : "#learners-heading");
}
