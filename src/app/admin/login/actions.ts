"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/auth";
import {
  getAuthSubjectHash,
  isLoginSubjectLocked,
  recordFailedLoginAttempt,
  recordSuccessfulLoginAttempt,
} from "@/lib/auth-rate-limit";
import { verifyPasswordOrDummy } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const headerStore = await headers();
  const address =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    "unknown";
  const subjectHash = getAuthSubjectHash(email, address);

  if (await isLoginSubjectLocked(subjectHash)) {
    redirect("/admin/login?error=locked");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { credential: true },
  });

  const passwordValid = await verifyPasswordOrDummy(
    password,
    user?.credential?.passwordHash,
  );

  if (!user?.credential || user.status !== "ACTIVE" || !passwordValid) {
    const recorded = await recordFailedLoginAttempt(subjectHash);
    redirect(recorded ? "/admin/login?error=invalid" : "/admin/login?error=locked");
  }

  await recordSuccessfulLoginAttempt(subjectHash);
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
