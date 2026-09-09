"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const headerStore = await headers(); const address = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip") ?? "unknown";
  const pepper = process.env.AUTH_RATE_LIMIT_PEPPER; if (!pepper && process.env.NODE_ENV === "production") throw new Error("Authentication rate-limit pepper is not configured");
  const subjectHash = createHash("sha256").update(`${email}:${address}:${pepper ?? "development-only"}`).digest("hex");
  const recentFailures = await prisma.loginAttempt.count({ where: { subjectHash, succeeded: false, createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } } });
  if (recentFailures >= 10) redirect("/admin/login?error=locked");
  const user = await prisma.user.findUnique({ where: { email }, include: { credential: true } });
  if (!user?.credential || user.status !== "ACTIVE" || !(await verifyPassword(password, user.credential.passwordHash))) { await prisma.loginAttempt.create({ data: { subjectHash } }); redirect("/admin/login?error=invalid"); }
  await prisma.loginAttempt.create({ data: { subjectHash, succeeded: true } });
  await createSession(user.id);
  await prisma.auditEvent.create({ data: { actorId: user.id, action: "session.login", entityType: "User", entityId: user.id } });
  redirect("/admin");
}

export async function logout() { await destroySession(); redirect("/admin/login"); }
