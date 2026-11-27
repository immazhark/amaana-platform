import type { Prisma } from "@prisma/client";
import { assistanceCaseHref } from "./assistance-queue-navigation";

export const CASE_HISTORY_PAGE_SIZE = 50;
type Boundary = { createdAt: Date; id: string };

export function parseCaseHistoryBoundary(value: unknown): Boundary | null {
  if (typeof value !== "string" || value.length > 110) return null;
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)~([A-Za-z0-9_-]{1,80})$/.exec(value);
  if (!match) return null;
  const createdAt = new Date(match[1]!);
  if (!Number.isFinite(createdAt.getTime()) || createdAt.toISOString() !== match[1]) return null;
  return { createdAt, id: match[2]! };
}

/** A bounded keyset read, always inside this case. An arbitrary boundary cannot select another case. */
export function caseHistoryQuery(id: string, boundary: Boundary | null) {
  return {
    where: {
      entityType: "AssistanceRequest", entityId: id,
      ...(boundary ? { OR: [{ createdAt: { lt: boundary.createdAt } }, { createdAt: boundary.createdAt, id: { lt: boundary.id } }] } : {}),
    },
    select: { id: true, action: true, createdAt: true, actor: { select: { name: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: CASE_HISTORY_PAGE_SIZE + 1,
  } satisfies Prisma.AuditEventFindManyArgs;
}

export function caseHistoryPage<T extends Boundary>(rows: readonly T[]) {
  const events = rows.slice(0, CASE_HISTORY_PAGE_SIZE);
  const last = events.at(-1);
  return { events, older: rows.length > CASE_HISTORY_PAGE_SIZE && last ? last : null };
}

/** Drop action notices and unvalidated query state; keep only the existing validated queue filters. */
export function caseHistoryHref(id: string, filters: Record<string, string | string[] | undefined>, boundary?: Boundary) {
  const path = assistanceCaseHref(id, filters);
  return path + (boundary ? (path.includes("?") ? "&" : "?") + "historyBefore=" + encodeURIComponent(boundary.createdAt.toISOString() + "~" + boundary.id) : "") + "#audit-history-heading";
}
