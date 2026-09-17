import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

type RateLimitPurpose = "donation" | "assistance";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const SERIALIZABLE_RETRY_LIMIT = 3;

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  const expected = configured
    ? new URL(configured).origin
    : `${process.env.NODE_ENV === "production" ? "https" : "http"}://${request.headers.get("host")}`;
  return origin === expected;
}

function getRateLimitPepper(purpose: RateLimitPurpose) {
  const envName = purpose === "assistance" ? "ASSISTANCE_TOKEN_PEPPER" : "DONATION_TOKEN_PEPPER";
  const pepper = process.env[envName];
  if (!pepper && process.env.NODE_ENV === "production") {
    throw new Error(`${envName} is not configured`);
  }
  return pepper ?? "development-only";
}

/**
 * Creates a one-way client identifier for short-lived abuse counters without
 * storing the source IP address. Donation and assistance traffic deliberately
 * use separate secret peppers so hashes cannot be correlated across the two
 * sensitive workflows if one secret is ever rotated or exposed.
 */
export function getRateLimitClientHash(request: Request, purpose: RateLimitPurpose) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded ?? request.headers.get("x-real-ip") ?? "unknown";
  const pepper = getRateLimitPepper(purpose);
  return createHash("sha256").update(`${purpose}:${address}:${pepper}`).digest("hex");
}

export function isRetryableRateLimitConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

async function claimRateLimitSlot(clientHash: string, limit: number) {
  for (let attempt = 0; attempt < SERIALIZABLE_RETRY_LIMIT; attempt += 1) {
    try {
      return await prisma.$transaction(
        async tx => {
          const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
          const attempts = await tx.donationAttempt.count({
            where: {
              clientHash,
              createdAt: { gte: since },
            },
          });

          if (attempts >= limit) return false;

          await tx.donationAttempt.create({ data: { clientHash } });
          return true;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (!isRetryableRateLimitConflict(error)) throw error;
      if (attempt === SERIALIZABLE_RETRY_LIMIT - 1) return false;
    }
  }

  return false;
}

export async function enforceDonationRateLimit(request: Request) {
  return claimRateLimitSlot(getRateLimitClientHash(request, "donation"), 10);
}

/**
 * Assistance submissions can contain sensitive documents, so this endpoint is
 * intentionally stricter than donations. We reuse DonationAttempt as a generic
 * hashed request-attempt ledger while keeping purpose and secret-key separation
 * so the counters cannot be correlated across workflows.
 */
export async function enforceAssistanceRateLimit(request: Request) {
  return claimRateLimitSlot(getRateLimitClientHash(request, "assistance"), 3);
}
