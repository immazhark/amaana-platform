import { prisma } from "./prisma";
import { withSerializableTransactionRetry } from "./prisma-transaction";

export const AUTH_FAILURE_LIMIT = 10;
export const AUTH_FAILURE_WINDOW_MS = 15 * 60 * 1000;

export function authFailureWindowStart(now = new Date()) {
  return new Date(now.getTime() - AUTH_FAILURE_WINDOW_MS);
}

export function isAuthFailureCountLocked(recentFailures: number) {
  return recentFailures >= AUTH_FAILURE_LIMIT;
}

export async function isLoginSubjectLocked(subjectHash: string, now = new Date()) {
  const recentFailures = await prisma.loginAttempt.count({
    where: {
      subjectHash,
      succeeded: false,
      createdAt: { gte: authFailureWindowStart(now) },
    },
  });

  return isAuthFailureCountLocked(recentFailures);
}

/**
 * Records one failed authentication attempt without allowing concurrent bad
 * password requests to race past the configured threshold. Serializable
 * isolation ensures that if multiple requests observe the same count, only one
 * can commit before the others retry against the updated ledger.
 */
export async function recordFailedLoginAttempt(subjectHash: string, now = new Date()) {
  return withSerializableTransactionRetry(async tx => {
    const recentFailures = await tx.loginAttempt.count({
      where: {
        subjectHash,
        succeeded: false,
        createdAt: { gte: authFailureWindowStart(now) },
      },
    });

    if (isAuthFailureCountLocked(recentFailures)) return false;

    await tx.loginAttempt.create({ data: { subjectHash } });
    return true;
  });
}
