"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email }, include: { credential: true } });
  if (!user?.credential || user.status !== "ACTIVE" || !(await verifyPassword(password, user.credential.passwordHash))) redirect("/admin/login?error=invalid");
  await createSession(user.id);
  await prisma.auditEvent.create({ data: { actorId: user.id, action: "session.login", entityType: "User", entityId: user.id } });
  redirect("/admin");
}

export async function logout() { await destroySession(); redirect("/admin/login"); }
