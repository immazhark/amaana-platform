import { createHash } from "node:crypto";
import { isPrismaSerializableConflict, withSerializableTransactionRetry } from "./prisma-transaction";
import { prisma } from "./prisma";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;

function getAuthRateLimitPepper() {
  const pepper = process.env.AUTH_RATE_LIMIT_PEPPER;
  if (!pepper && process.env.NODE_ENV === "production") {
    throw new Error("Authentication rate-limit pepper is not configured");
  }
  return pepper ?? "development-only";
}

export function getAuthSubjectHash(email: string, address: string) {
  return createHash("sha256")
    .update(`${email.toLowerCase()}:${address}:${getAuthRateLimitPepper()}`)
    .digest("hex");
}

function failureWindowStart() {
  return new Date(Date.now() - LOGIN_WINDOW_MS);
}

export async function isLoginSubjectLocked(subjectHash: string) {
  const recentFailures = await prisma.loginAttempt.count({
    where: {
      subjectHash,
      succeeded: false,
      createdAt: { gte: failureWindowStart() },
    },
  });
  return recentFailures >= MAX_FAILURES;
}

/**
 * Records one failed authentication attempt without allowing concurrent bad
 * passwords to race past the threshold. Serializable retries resolve normal
 * write conflicts; exhausted contention fails closed and reports the subject as
 * locked instead of permitting another attempt.
 */
export async function recordFailedLoginAttempt(subjectHash: string) {
  try {
    return await withSerializableTransactionRetry(async tx => {
      const recentFailures = await tx.loginAttempt.count({
        where: {
          subjectHash,
          succeeded: false,
          createdAt: { gte: failureWindowStart() },
        },
      });

      if (recentFailures >= MAX_FAILURES) return false;

      await tx.loginAttempt.create({ data: { subjectHash, succeeded: false } });
      return true;
    });
  } catch (error) {
    if (isPrismaSerializableConflict(error)) return false;
    throw error;
  }
}

export async function recordSuccessfulLoginAttempt(subjectHash: string) {
  await prisma.loginAttempt.create({ data: { subjectHash, succeeded: true } });
}
