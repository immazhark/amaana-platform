import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

type RateLimitPurpose = "donation" | "assistance";

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

export async function enforceDonationRateLimit(request: Request) {
  const clientHash = getRateLimitClientHash(request, "donation");
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const attempts = await prisma.donationAttempt.count({ where: { clientHash, createdAt: { gte: since } } });
  if (attempts >= 10) return false;
  await prisma.donationAttempt.create({ data: { clientHash } });
  return true;
}

/**
 * Assistance submissions can contain sensitive documents, so this endpoint is
 * intentionally stricter than donations. We reuse DonationAttempt as a generic
 * hashed request-attempt ledger for now while keeping purpose and secret-key
 * separation so the counters cannot be correlated across workflows.
 */
export async function enforceAssistanceRateLimit(request: Request) {
  const clientHash = getRateLimitClientHash(request, "assistance");
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const attempts = await prisma.donationAttempt.count({ where: { clientHash, createdAt: { gte: since } } });
  if (attempts >= 3) return false;
  await prisma.donationAttempt.create({ data: { clientHash } });
  return true;
}
