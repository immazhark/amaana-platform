import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "amaana_admin_session";
const SESSION_DAYS = 7;
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await prisma.session.create({ data: { userId, tokenHash: tokenHash(token), expiresAt } });
  (await cookies()).set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", expires: expiresAt });
}

export async function destroySession() {
  const jar = await cookies(); const token = jar.get(COOKIE_NAME)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
  jar.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  return prisma.user.findFirst({ where: { status: "ACTIVE", sessions: { some: { tokenHash: tokenHash(token), expiresAt: { gt: new Date() } } } }, include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } } });
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function requirePermission(permission: string) {
  const user = await requireAuthenticatedUser();
  const allowed = user.roles.some(userRole => userRole.role.permissions.some(item => item.permission.key === permission));
  if (!allowed) redirect("/admin/forbidden");
  return user;
}

export function hasPermission(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>, permission: string) {
  return user.roles.some(userRole => userRole.role.permissions.some(item => item.permission.key === permission));
}

export function permissionKeys(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  return user.roles.flatMap(userRole => userRole.role.permissions.map(item => item.permission.key));
}
