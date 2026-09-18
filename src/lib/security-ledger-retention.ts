import { prisma } from "@/lib/prisma";

export const RATE_LIMIT_LEDGER_RETENTION_MS = 24 * 60 * 60 * 1000;
export const LOGIN_ATTEMPT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export function ephemeralSecurityLedgerCutoffs(now = new Date()) {
  return {
    rateLimitBefore: new Date(now.getTime() - RATE_LIMIT_LEDGER_RETENTION_MS),
    loginBefore: new Date(now.getTime() - LOGIN_ATTEMPT_RETENTION_MS),
  };
}

export async function pruneEphemeralSecurityLedgers(now = new Date()) {
  const { rateLimitBefore, loginBefore } = ephemeralSecurityLedgerCutoffs(now);
  const [rateLimits, logins] = await prisma.$transaction([
    prisma.donationAttempt.deleteMany({
      where: { createdAt: { lt: rateLimitBefore } },
    }),
    prisma.loginAttempt.deleteMany({
      where: { createdAt: { lt: loginBefore } },
    }),
  ]);

  return {
    rateLimitAttemptsDeleted: rateLimits.count,
    loginAttemptsDeleted: logins.count,
  };
}
