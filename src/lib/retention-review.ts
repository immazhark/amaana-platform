import type { Prisma } from "@prisma/client";

export function indiaCalendarDay(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export type RetentionSchedule = "due" | "upcoming" | "unreviewed" | "unscheduled" | "invalid";

/** The existing action stores a date-only review reminder at UTC midnight. Interpret it as an Indian calendar day. */
export function classifyRetentionSchedule(recorded: boolean, reviewAfter: unknown, today: string): RetentionSchedule {
  if (!recorded) return "unreviewed";
  if (reviewAfter == null) return "unscheduled";
  if (typeof reviewAfter !== "string" || !/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/.test(reviewAfter)) return "invalid";
  const date = new Date(reviewAfter);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== reviewAfter) return "invalid";
  return reviewAfter.slice(0, 10) <= today ? "due" : "upcoming";
}

type Group = { held: boolean; recorded: boolean; reviewAfter: unknown; count: bigint };
export type RetentionScheduleSummary = Record<RetentionSchedule, number> & { total: number; held: number };

export function summarizeRetentionSchedules(groups: readonly Group[], today: string): RetentionScheduleSummary {
  const summary: RetentionScheduleSummary = { total: 0, held: 0, due: 0, upcoming: 0, unreviewed: 0, unscheduled: 0, invalid: 0 };
  for (const group of groups) {
    const count = Number(group.count);
    if (typeof group.held !== "boolean" || typeof group.recorded !== "boolean" || !Number.isSafeInteger(count) || count <= 0 || !Number.isSafeInteger(summary.total + count)) throw new Error("Invalid retention review aggregate");
    summary.total += count;
    if (group.held) summary.held += count;
    summary[classifyRetentionSchedule(group.recorded, group.reviewAfter, today)] += count;
  }
  return summary;
}

/** One read-only snapshot of stored document review reminders. No document IDs, names, reasons or object keys returned. */
export async function loadRetentionScheduleSummary(client: Pick<Prisma.TransactionClient, "$queryRaw">, today: string): Promise<RetentionScheduleSummary> {
  const groups = await client.$queryRaw<Group[]>`
    WITH current_evidence AS (
      SELECT COALESCE(h.action = 'assistance.document_legal_hold_placed', false) AS held,
        r.action IS NOT NULL AS recorded,
        CASE WHEN r.metadata->'reviewAfter' IS NULL OR jsonb_typeof(r.metadata->'reviewAfter') = 'null' THEN NULL
          WHEN jsonb_typeof(r.metadata->'reviewAfter') = 'string'
            AND (r.metadata->>'reviewAfter') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T00:00:00[.]000Z$' THEN r.metadata->>'reviewAfter'
          ELSE 'invalid' END AS "reviewAfter"
      FROM "AssistanceDocument" d
      LEFT JOIN LATERAL (
        SELECT a.action FROM "AuditEvent" a
        WHERE a."entityType" = 'AssistanceRequest' AND a."entityId" = d."assistanceRequestId"
          AND a.metadata->>'documentId' = d.id
          AND a.action IN ('assistance.document_legal_hold_placed', 'assistance.document_legal_hold_released')
        ORDER BY a."createdAt" DESC, a.id DESC LIMIT 1
      ) h ON true
      LEFT JOIN LATERAL (
        SELECT a.action, a.metadata FROM "AuditEvent" a
        WHERE a."entityType" = 'AssistanceRequest' AND a."entityId" = d."assistanceRequestId"
          AND a.metadata->>'documentId' = d.id
          AND a.action IN ('assistance.document_retention_reviewed', 'assistance.document_legal_hold_placed', 'assistance.document_legal_hold_released')
        ORDER BY a."createdAt" DESC, a.id DESC LIMIT 1
      ) r ON true
    )
    SELECT held, recorded, "reviewAfter", COUNT(*)::bigint AS count
    FROM current_evidence GROUP BY held, recorded, "reviewAfter"
  `;
  return summarizeRetentionSchedules(groups, today);
}
