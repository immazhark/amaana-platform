import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  const expected = configured
    ? new URL(configured).origin
    : `${process.env.NODE_ENV === "production" ? "https" : "http"}://${request.headers.get("host")}`;
  return origin === expected;
}

function getClientHash(request: Request, purpose: "donation" | "assistance") {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded ?? request.headers.get("x-real-ip") ?? "unknown";
  const pepper = process.env.DONATION_TOKEN_PEPPER ?? "development-only";
  return createHash("sha256").update(`${purpose}:${address}:${pepper}`).digest("hex");
}

export async function enforceDonationRateLimit(request: Request) {
  const clientHash = getClientHash(request, "donation");
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const attempts = await prisma.donationAttempt.count({ where: { clientHash, createdAt: { gte: since } } });
  if (attempts >= 10) return false;
  await prisma.donationAttempt.create({ data: { clientHash } });
  return true;
}

/**
 * Assistance submissions can contain sensitive documents, so this endpoint is
 * intentionally stricter than donations. We reuse DonationAttempt as a generic
 * hashed request-attempt ledger for now; the purpose prefix keeps the two
 * counters isolated without storing a raw IP address.
 */
export async function enforceAssistanceRateLimit(request: Request) {
  const clientHash = getClientHash(request, "assistance");
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const attempts = await prisma.donationAttempt.count({ where: { clientHash, createdAt: { gte: since } } });
  if (attempts >= 3) return false;
  await prisma.donationAttempt.create({ data: { clientHash } });
  return true;
}
