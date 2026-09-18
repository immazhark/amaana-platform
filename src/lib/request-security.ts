import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { isPrismaSerializableConflict, withSerializableTransactionRetry } from "./prisma-transaction";

type RateLimitPurpose = "donation" | "assistance" | "analytics";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

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
  const envName = purpose === "assistance"
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
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  const configuredHost = configuredUrl ? new URL(configuredUrl).host.toLowerCase() : null;
  const requestHost = (
    request.headers.get("x-forwarded-host")
    ?? request.headers.get("host")
    ?? new URL(request.url).host
  ).toLowerCase();

  const cloudflareAddress = request.headers.get("cf-connecting-ip")?.trim() ?? "";
  const railwayAddress = request.headers.get("x-real-ip")?.trim() ?? "";
  const forwardedChain = request.headers.get("x-forwarded-for")
    ?.split(",")
    .map(value => value.trim())
    .filter(Boolean) ?? [];
  const nearestForwardedAddress = forwardedChain.at(-1) ?? "";

  const configuredIsRailwayHost = configuredHost?.endsWith(".up.railway.app") ?? false;
  if (
    configuredHost
    && !configuredIsRailwayHost
    && requestHost === configuredHost
    && isIP(cloudflareAddress)
  ) {
    return cloudflareAddress;
  }

  if (isIP(railwayAddress)) return railwayAddress;
  if (isIP(nearestForwardedAddress)) return nearestForwardedAddress;
  return "unknown";
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
 * Assistance submissions can contain sensitive documents, so this endpoint is
 * intentionally stricter than donations. We reuse DonationAttempt as a generic
 * hashed request-attempt ledger while keeping purpose and secret-key separation
 * so the counters cannot be correlated across workflows.
 */
export async function enforceAssistanceRateLimit(request: Request) {
  return claimRateLimitSlot(getRateLimitClientHash(request, "assistance"), 3);
}

/**
 * Public page-view analytics are deliberately coarse and anonymous. The higher
 * allowance avoids interfering with normal navigation while still bounding the
 * database write rate from any one client. No source IP address is persisted.
 */
export async function enforceAnalyticsRateLimit(request: Request) {
  return claimRateLimitSlot(getRateLimitClientHash(request, "analytics"), 300);
}
