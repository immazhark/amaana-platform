import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

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
 * The per-subject transaction lock serializes slot reservations under
 * sustained bursts, without relying on a fixed number of retry attempts.
 * READ COMMITTED takes a fresh snapshot for the count after waiting for
 * the lock; a SERIALIZABLE snapshot could still see a stale count.
 */
export async function reserveLoginAttempt(subjectHash: string, now = new Date()) {
  return prisma.$transaction(async tx => {
    // Lock the server-side SHA-256 subject identifier for this transaction.
    // Equal subjects serialize; unrelated subjects proceed independently.
    // The cast keeps the result representable by Prisma's raw query decoder.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${subjectHash}, 0))::text AS acquired`;
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
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
}
