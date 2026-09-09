import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin"); if (!origin) return false;
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  const expected = configured ? new URL(configured).origin : `${process.env.NODE_ENV === "production" ? "https" : "http"}://${request.headers.get("host")}`;
  return origin === expected;
}

export async function enforceDonationRateLimit(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(); const address = forwarded ?? request.headers.get("x-real-ip") ?? "unknown";
  const clientHash = createHash("sha256").update(`${address}:${process.env.DONATION_TOKEN_PEPPER ?? "development-only"}`).digest("hex");
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const attempts = await prisma.donationAttempt.count({ where: { clientHash, createdAt: { gte: since } } });
  if (attempts >= 10) return false;
  await prisma.donationAttempt.create({ data: { clientHash } }); return true;
}
