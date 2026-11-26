import type { Prisma } from "@prisma/client";
import { STAGING_ASSISTANCE_REFERENCE, type AdminRecordView } from "./admin-record-visibility";

export const DECISION_COHORT_DAYS = 90;
const DAY_MS = 86_400_000;
const fields = ["received", "recorded", "withinDay", "withinWeek", "overWeek", "openWithoutDecision", "otherWithoutDecision",
  "verificationRecorded", "verificationWithinDay", "verificationWithinWeek", "verificationOverWeek", "verificationMissing"] as const;
export type AssistanceDecisionReport = Record<(typeof fields)[number], number>;
type Raw = Record<(typeof fields)[number], bigint>;

/** Receipt cohort, not a review SLA. Decision and saved verification evidence are separate measures. */
export async function loadAssistanceDecisionReport(
  client: Pick<Prisma.TransactionClient, "$queryRaw">, view: AdminRecordView, now = new Date(),
): Promise<AssistanceDecisionReport> {
  const start = new Date(now.getTime() - DECISION_COHORT_DAYS * DAY_MS);
  const tests = view === "tests";
  const rows = await client.$queryRaw<Raw[]>`
    WITH cohort AS (
      SELECT id, status, "createdAt", "acceptedAt"
      FROM "AssistanceRequest"
      WHERE "createdAt" >= ${start} AND "createdAt" <= ${now}
        AND ((${tests} AND "referenceNumber" = ${STAGING_ASSISTANCE_REFERENCE}) OR (NOT ${tests} AND "referenceNumber" <> ${STAGING_ASSISTANCE_REFERENCE}))
    ), evidence AS (
      SELECT id, "acceptedAt" AS "decisionAt" FROM cohort WHERE "acceptedAt" IS NOT NULL
      UNION ALL
      SELECT c.id, r."rejectedAt" FROM cohort c JOIN "AssistanceRejection" r ON r."assistanceRequestId" = c.id
      UNION ALL
      SELECT c.id, a."createdAt" FROM cohort c JOIN "AuditEvent" a ON a."entityId" = c.id
      WHERE a."entityType" = 'AssistanceRequest' AND a.action IN ('assistance.approved', 'assistance.rejected')
    ), earliest AS (
      SELECT c.id, MIN(e."decisionAt") AS "decisionAt"
      FROM cohort c JOIN evidence e ON e.id = c.id
      WHERE e."decisionAt" >= c."createdAt" AND e."decisionAt" <= ${now}
      GROUP BY c.id
    ), verification_evidence AS (
      SELECT c.id, v."createdAt" AS "verificationAt"
      FROM cohort c JOIN "AssistanceVerification" v ON v."assistanceRequestId" = c.id
      UNION ALL
      SELECT c.id, a."createdAt" FROM cohort c JOIN "AuditEvent" a ON a."entityId" = c.id
      WHERE a."entityType" = 'AssistanceRequest' AND a.action IN ('assistance.verification_saved', 'assistance.verification_completed')
    ), earliest_verification AS (
      SELECT c.id, MIN(v."verificationAt") AS "verificationAt"
      FROM cohort c JOIN verification_evidence v ON v.id = c.id
      WHERE v."verificationAt" >= c."createdAt" AND v."verificationAt" <= ${now}
      GROUP BY c.id
    ), durations AS (
      SELECT c.status, e."decisionAt", EXTRACT(EPOCH FROM (e."decisionAt" - c."createdAt")) AS seconds,
        v."verificationAt", EXTRACT(EPOCH FROM (v."verificationAt" - c."createdAt")) AS "verificationSeconds"
      FROM cohort c LEFT JOIN earliest e ON e.id = c.id LEFT JOIN earliest_verification v ON v.id = c.id
    )
    SELECT COUNT(*)::bigint AS "received",
      COUNT("decisionAt")::bigint AS "recorded",
      COUNT(CASE WHEN seconds <= 86400 THEN 1 END)::bigint AS "withinDay",
      COUNT(CASE WHEN seconds > 86400 AND seconds <= 604800 THEN 1 END)::bigint AS "withinWeek",
      COUNT(CASE WHEN seconds > 604800 THEN 1 END)::bigint AS "overWeek",
      COUNT(CASE WHEN "decisionAt" IS NULL AND status IN ('SUBMITTED', 'DOCUMENTS_REQUESTED', 'UNDER_VERIFICATION') THEN 1 END)::bigint AS "openWithoutDecision",
      COUNT(CASE WHEN "decisionAt" IS NULL AND status NOT IN ('SUBMITTED', 'DOCUMENTS_REQUESTED', 'UNDER_VERIFICATION') THEN 1 END)::bigint AS "otherWithoutDecision",
      COUNT("verificationAt")::bigint AS "verificationRecorded",
      COUNT(CASE WHEN "verificationSeconds" <= 86400 THEN 1 END)::bigint AS "verificationWithinDay",
      COUNT(CASE WHEN "verificationSeconds" > 86400 AND "verificationSeconds" <= 604800 THEN 1 END)::bigint AS "verificationWithinWeek",
      COUNT(CASE WHEN "verificationSeconds" > 604800 THEN 1 END)::bigint AS "verificationOverWeek",
      COUNT(CASE WHEN "verificationAt" IS NULL THEN 1 END)::bigint AS "verificationMissing"
    FROM durations
  `;
  const row = rows[0];
  if (rows.length !== 1 || !row) throw new Error("Inconsistent assistance decision report");
  const report = Object.fromEntries(fields.map(field => [field, Number(row[field])])) as AssistanceDecisionReport;
  if (fields.some(field => !Number.isSafeInteger(report[field]) || report[field] < 0) ||
      report.recorded !== report.withinDay + report.withinWeek + report.overWeek ||
      report.received !== report.recorded + report.openWithoutDecision + report.otherWithoutDecision ||
      report.verificationRecorded !== report.verificationWithinDay + report.verificationWithinWeek + report.verificationOverWeek ||
      report.received !== report.verificationRecorded + report.verificationMissing) {
    throw new Error("Inconsistent assistance decision report");
  }
  return report;
}
