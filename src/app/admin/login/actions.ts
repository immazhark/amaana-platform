"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth";
import { parseAdminLoginInput } from "@/lib/admin-login-input";
import { isLoginSubjectLocked, recordFailedLoginAttempt } from "@/lib/auth-rate-limit";
import { getTrustedClientAddress } from "@/lib/client-address";
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
  const input = parseAdminLoginInput(formData.get("email"), formData.get("password"));
  const { email, password } = input;
  const headerStore = await headers();
  const address = getTrustedClientAddress(
    headerStore,
    process.env.NEXT_PUBLIC_APP_URL ?? "https://amaanafoundation.org",
  );
  const subjectHash = authenticationSubjectHash(input.rateLimitSubject, address);

  if (await isLoginSubjectLocked(subjectHash)) {
    redirect("/admin/login?error=locked");
  }

  if (!input.valid) {
    const recorded = await recordFailedLoginAttempt(subjectHash);
    redirect(recorded ? "/admin/login?error=invalid" : "/admin/login?error=locked");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { credential: true },
  });
  const passwordMatches = await verifyPassword(password, user?.credential?.passwordHash ?? "");
  const authenticated = Boolean(user && user.status === "ACTIVE" && passwordMatches);

  if (!authenticated) {
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
  const user = await getCurrentUser();
  await destroySession();
  if (user) {
    await prisma.auditEvent.create({
      data: {
        actorId: user.id,
        action: "session.logout",
        entityType: "User",
        entityId: user.id,
      },
    });
  }
  redirect("/admin/login");
}
