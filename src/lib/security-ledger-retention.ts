import { prisma } from "@/lib/prisma";

export const RATE_LIMIT_LEDGER_RETENTION_MS = 24 * 60 * 60 * 1000;
export const LOGIN_ATTEMPT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const WEB_VITALS_AGGREGATE_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

export function ephemeralSecurityLedgerCutoffs(now = new Date()) {
  return {
    rateLimitBefore: new Date(now.getTime() - RATE_LIMIT_LEDGER_RETENTION_MS),
    loginBefore: new Date(now.getTime() - LOGIN_ATTEMPT_RETENTION_MS),
    // Date-only PostgreSQL aggregates must be compared against a UTC date
    // boundary, never a mid-day timestamp that silently deletes a whole day.
    webVitalsBefore: new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - WEB_VITALS_AGGREGATE_RETENTION_MS / (24 * 60 * 60 * 1000),
    )),
  };
}

export async function pruneEphemeralSecurityLedgers(now = new Date()) {
  const { rateLimitBefore, loginBefore, webVitalsBefore } = ephemeralSecurityLedgerCutoffs(now);
  const [rateLimits, logins, webVitals] = await prisma.$transaction([
    prisma.donationAttempt.deleteMany({
      where: { createdAt: { lt: rateLimitBefore } },
    }),
    prisma.loginAttempt.deleteMany({
      where: { createdAt: { lt: loginBefore } },
    }),
    prisma.dailyWebVital.deleteMany({
      where: { date: { lt: webVitalsBefore } },
    }),
  ]);

  return {
    rateLimitAttemptsDeleted: rateLimits.count,
    loginAttemptsDeleted: logins.count,
    webVitalsAggregatesDeleted: webVitals.count,
  };
}
