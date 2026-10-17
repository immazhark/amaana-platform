import { createHash } from "node:crypto";
import { getTrustedClientAddress } from "./client-address";
import { isPrismaSerializableConflict, withSerializableTransactionRetry } from "./prisma-transaction";

type RateLimitPurpose = "donation" | "assistance" | "analytics" | "tracking" | "acknowledgement";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const production = process.env.NODE_ENV === "production";
  if (!configured && production) return false;
  const host = request.headers.get("host");
  if (!configured && !host) return false;
  try {
    const expected = new URL(configured || `http://${host}`);
    if (!["http:", "https:"].includes(expected.protocol) ||
        expected.username || expected.password ||
        (production && expected.protocol !== "https:")) return false;
    return origin === expected.origin;
  } catch {
    return false;
  }
}

function getRateLimitPepper(purpose: RateLimitPurpose) {
  const envName = (purpose === "assistance" || purpose === "tracking")
    ? "ASSISTANCE_TOKEN_PEPPER"
    : purpose === "analytics"
      ? "AUTH_RATE_LIMIT_PEPPER"
      : "DONATION_TOKEN_PEPPER";
  const pepper = process.env[envName];
  if (!pepper && process.env.NODE_ENV === "production") {
    throw new Error(`${envName} is not configured`);
  }
  return pepper ?? "development-only";
}

/**
 * Creates a one-way client identifier for short-lived abuse counters without
 * storing the source IP address. Each public workflow includes a purpose prefix
 * and an independently configurable secret so counters cannot be correlated
 * across sensitive workflows if one secret is ever rotated or exposed.
 */
export function getRateLimitClientAddress(request: Request) {
  return getTrustedClientAddress(request.headers, request.url);
}

export function getRateLimitClientHash(request: Request, purpose: RateLimitPurpose) {
  const address = getRateLimitClientAddress(request);
  const pepper = getRateLimitPepper(purpose);
  return createHash("sha256").update(`${purpose}:${address}:${pepper}`).digest("hex");
}

export const isRetryableRateLimitConflict = isPrismaSerializableConflict;

async function claimRateLimitSlot(clientHash: string, limit: number) {
  try {
    return await withSerializableTransactionRetry(async tx => {
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
    });
  } catch (error) {
    // High contention after all bounded retries is treated as a denied request,
    // never as permission to bypass the abuse-control boundary.
    if (isPrismaSerializableConflict(error)) return false;
    throw error;
  }
}

export async function enforceDonationRateLimit(request: Request) {
  return claimRateLimitSlot(getRateLimitClientHash(request, "donation"), 10);
}

/**
 * Receipt lookups are deliberately separate from donor checkout attempts.
 * Use a purpose-separated peppered SHA-256 hash (no raw IP retention) and
 * an independent allowance to constrain repeated private-record lookups.
 * Share the existing donation pepper rather than adding new production
 * secret configuration. The check remains database-atomic and fail-closed.
 */
export async function enforceAcknowledgementRateLimit(request: Request) {
  return claimRateLimitSlot(getRateLimitClientHash(request, "acknowledgement"), 30);
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

/** Private status reads have their own allowance and never spend submission slots. */
export async function enforceTrackingRateLimit(request: Request) {
  return claimRateLimitSlot(getRateLimitClientHash(request, "tracking"), 60);
}

/**
 * Public page-view analytics are deliberately coarse and anonymous. The higher
 * allowance avoids interfering with normal navigation while still bounding the
 * database write rate from any one client. No source IP address is persisted.
 */
export async function enforceAnalyticsRateLimit(request: Request) {
  return claimRateLimitSlot(getRateLimitClientHash(request, "analytics"), 300);
}

