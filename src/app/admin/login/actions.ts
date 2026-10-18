"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth";
import { parseAdminLoginInput } from "@/lib/admin-login-input";
import { reserveLoginAttempt } from "@/lib/auth-rate-limit";
import { getTrustedClientAddress } from "@/lib/client-address";
import { hashPassword, passwordNeedsRehash, verifyPassword } from "@/lib/password";
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

  const attemptId = await reserveLoginAttempt(subjectHash);
  if (!attemptId) {
    redirect("/admin/login?error=locked");
  }

  if (!input.valid) {
    redirect("/admin/login?error=invalid");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { credential: true },
  });
  const passwordMatches = await verifyPassword(password, user?.credential?.passwordHash ?? "");

  if (!user || user.status !== "ACTIVE" || !passwordMatches) {
    redirect("/admin/login?error=invalid");
  }

  if (user.credential && passwordNeedsRehash(user.credential.passwordHash)) {
    const upgradedHash = await hashPassword(password);
    // A concurrent password reset can replace the digest after verification.
    // Only upgrade the exact credential that was successfully verified, and
    // audit the upgrade in the same transaction as the compare-and-swap.
    const upgraded = await prisma.$transaction(async tx => {
      const result = await tx.passwordCredential.updateMany({
        where: { userId: user.id, passwordHash: user.credential!.passwordHash },
        data: { passwordHash: upgradedHash },
      });
      if (result.count === 1) {
        await tx.auditEvent.create({
          data: {
            actorId: user.id,
            action: "credential.password_rehashed",
            entityType: "User",
            entityId: user.id,
          },
        });
      }
      return result.count === 1;
    });
    if (!upgraded) {
      // Do not start a session using a password that may have been revoked.
      redirect("/admin/login?error=invalid");
    }
  }

  // Session persistence and this attempt's successful release share one
  // database transaction. No cookie is issued if either write fails.
  await createSession(user.id, attemptId);
  // session.login auditing is committed with session creation.
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
