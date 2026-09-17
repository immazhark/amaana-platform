"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/auth";
import { isLoginSubjectLocked, recordFailedLoginAttempt } from "@/lib/auth-rate-limit";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

function getAuthenticationRateLimitPepper() {
  const pepper = process.env.AUTH_RATE_LIMIT_PEPPER;
  if (!pepper && process.env.NODE_ENV === "production") {
    throw new Error("Authentication rate-limit pepper is not configured");
  }
  return pepper ?? "development-only";
}

function authenticationSubjectHash(email: string, address: string) {
  return createHash("sha256")
    .update(`${email}:${address}:${getAuthenticationRateLimitPepper()}`)
    .digest("hex");
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const headerStore = await headers();
  const address =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    "unknown";
  const subjectHash = authenticationSubjectHash(email, address);

  if (await isLoginSubjectLocked(subjectHash)) {
    redirect("/admin/login?error=locked");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { credential: true },
  });
  const authenticated =
    Boolean(user?.credential) &&
    user?.status === "ACTIVE" &&
    (await verifyPassword(password, user.credential!.passwordHash));

  if (!user || !authenticated) {
    const recorded = await recordFailedLoginAttempt(subjectHash);
    redirect(recorded ? "/admin/login?error=invalid" : "/admin/login?error=locked");
  }

  await prisma.loginAttempt.create({ data: { subjectHash, succeeded: true } });
  await createSession(user.id);
  await prisma.auditEvent.create({
    data: {
      actorId: user.id,
      action: "session.login",
      entityType: "User",
      entityId: user.id,
    },
  });
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
