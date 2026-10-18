import { withSerializableTransactionRetry } from "./prisma-transaction";

export const AUTH_FAILURE_LIMIT = 10;
export const AUTH_FAILURE_WINDOW_MS = 15 * 60 * 1000;

export function authFailureWindowStart(now = new Date()) {
  return new Date(now.getTime() - AUTH_FAILURE_WINDOW_MS);
}

export function isAuthFailureCountLocked(recentFailures: number) {
  return recentFailures >= AUTH_FAILURE_LIMIT;
}

/**
 * Reserves quota before credential lookup or password verification. Pending and
 * interrupted attempts count as failures until this exact attempt succeeds.
 * Serializable retries prevent concurrent requests from sharing the last slot.
 */
export async function reserveLoginAttempt(subjectHash: string, now = new Date()) {
  return withSerializableTransactionRetry(async tx => {
    const recentFailures = await tx.loginAttempt.count({
      where: {
        subjectHash,
        succeeded: false,
        createdAt: { gte: authFailureWindowStart(now) },
      },
    });

    if (isAuthFailureCountLocked(recentFailures)) return null;

    const attempt = await tx.loginAttempt.create({ data: { subjectHash }, select: { id: true } });
    return attempt.id;
  });
}
