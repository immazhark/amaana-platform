import { createHash, randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { cookieSet, cookieGet } = vi.hoisted(() => ({ cookieSet: vi.fn(), cookieGet: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ set: cookieSet, get: cookieGet }),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error("Synthetic redirect: " + path); },
}));

import { createSession, getCurrentUser, requirePermission } from "./auth";
import { prisma } from "./prisma";

// A real PostgreSQL test, deliberately unavailable to hosted and production DBs.
describe.skipIf(process.env.AMAANA_DATABASE_TESTS !== "true")("atomic admin session PostgreSQL invariants", () => {
  const prefix = randomUUID().replaceAll("-", "");
  const subjectHash = createHash("sha256").update("synthetic-session:" + prefix).digest("hex");
  let userId: string;
  let otherUserId: string;
  let roleId: string;
  let permissionId: string;
  let isolatedTargetAccepted = false;
  const permissionKey = "synthetic.session." + prefix;

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/amaana") {
      throw new Error("Admin session DB tests require the isolated loopback amaana database");
    }
    isolatedTargetAccepted = true;

    const user = await prisma.user.create({
      data: { name: "Synthetic session tester", email: prefix + "@example.invalid", status: "ACTIVE" },
      select: { id: true },
    });
    userId = user.id;
    otherUserId = (await prisma.user.create({
      data: { name: "Other synthetic tester", email: "other-" + prefix + "@example.invalid", status: "ACTIVE" },
    })).id;
    roleId = (await prisma.role.create({ data: { name: "synthetic-session-" + prefix } })).id;
    permissionId = (await prisma.permission.create({ data: { key: permissionKey } })).id;
    await prisma.userRole.create({ data: { userId, roleId } });
  });

  beforeEach(async () => {
    cookieSet.mockClear();
    cookieGet.mockReset();
    await prisma.session.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
    await prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
    await prisma.rolePermission.deleteMany({ where: { roleId } });
  });

  afterAll(async () => {
    if (!isolatedTargetAccepted) return;
    if (userId) {
      await prisma.auditEvent.deleteMany({ where: { actorId: userId } });
      await prisma.session.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    }
    if (otherUserId) await prisma.user.delete({ where: { id: otherUserId } });
    if (roleId) await prisma.role.delete({ where: { id: roleId } });
    if (permissionId) await prisma.permission.delete({ where: { id: permissionId } });
    await prisma.loginAttempt.deleteMany({ where: { subjectHash } });
    await prisma.$disconnect();
  });

  it("commits session, successful quota release and audit as one unit", async () => {
    const attempt = await prisma.loginAttempt.create({ data: { subjectHash } });

    await createSession(userId, attempt.id);

    const storedAttempt = await prisma.loginAttempt.findUniqueOrThrow({ where: { id: attempt.id } });
    const storedSessions = await prisma.session.findMany({ where: { userId } });
    const events = await prisma.auditEvent.findMany({ where: { actorId: userId, action: "session.login" } });

    expect(storedAttempt.succeeded).toBe(true);
    expect(storedSessions).toHaveLength(1);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(expect.objectContaining({
      entityType: "User",
      entityId: userId,
    }));
    expect(cookieSet).toHaveBeenCalledOnce();
    const [cookieName, token, cookieOptions] = cookieSet.mock.calls[0]!;
    expect(cookieName).toBe("amaana_admin_session");
    expect(cookieOptions).toEqual(expect.objectContaining({ httpOnly: true, sameSite: "strict", path: "/" }));
    expect(storedSessions[0]?.tokenHash).toBe(createHash("sha256").update(token).digest("hex"));
  });

  it("rolls back session creation and audit if admission reservation persistence fails", async () => {
    const beforeSessions = await prisma.session.count({ where: { userId } });
    const beforeAudits = await prisma.auditEvent.count({ where: { actorId: userId, action: "session.login" } });

    await expect(createSession(userId, "nonexistent-" + prefix)).rejects.toThrow();

    expect(await prisma.session.count({ where: { userId } })).toBe(beforeSessions);
    expect(await prisma.auditEvent.count({ where: { actorId: userId, action: "session.login" } })).toBe(beforeAudits);
    expect(cookieSet).not.toHaveBeenCalled();
  });

  async function presentSession(subjectId: string, expiresAt: Date) {
    const token = createHash("sha256").update(randomUUID()).digest("base64url");
    const session = await prisma.session.create({
      data: { userId: subjectId, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt },
    });
    cookieGet.mockReturnValue({ value: token });
    return session;
  }

  it("rejects an expired token even when the same user has another active session", async () => {
    await presentSession(userId, new Date(Date.now() + 60_000));
    await presentSession(userId, new Date(Date.now() - 60_000));
    expect(await getCurrentUser()).toBeNull();
    await expect(requirePermission(permissionKey)).rejects.toThrow("Synthetic redirect: /admin/login");
  });

  it("resolves only the user who owns the presented unexpired token", async () => {
    await presentSession(userId, new Date(Date.now() + 60_000));
    await presentSession(otherUserId, new Date(Date.now() + 60_000));
    expect((await getCurrentUser())?.id).toBe(otherUserId);
    await expect(requirePermission(permissionKey)).rejects.toThrow("Synthetic redirect: /admin/forbidden");
  });

  it("rejects a suspended user while their unexpired session remains stored", async () => {
    await presentSession(userId, new Date(Date.now() + 60_000));
    expect((await getCurrentUser())?.id).toBe(userId);
    await prisma.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
    expect(await getCurrentUser()).toBeNull();
    await expect(requirePermission(permissionKey)).rejects.toThrow("Synthetic redirect: /admin/login");
  });

  it("rejects a revoked session on the next lookup with the same cookie", async () => {
    const session = await presentSession(userId, new Date(Date.now() + 60_000));
    expect((await getCurrentUser())?.id).toBe(userId);
    await prisma.session.delete({ where: { id: session.id } });
    expect(await getCurrentUser()).toBeNull();
    await expect(requirePermission(permissionKey)).rejects.toThrow("Synthetic redirect: /admin/login");
  });

  it("rechecks scoped permissions after a grant and revocation without a new login", async () => {
    await presentSession(userId, new Date(Date.now() + 60_000));
    await expect(requirePermission(permissionKey)).rejects.toThrow("Synthetic redirect: /admin/forbidden");
    await prisma.rolePermission.create({ data: { roleId, permissionId } });
    expect((await requirePermission(permissionKey)).id).toBe(userId);
    await prisma.rolePermission.delete({ where: { roleId_permissionId: { roleId, permissionId } } });
    await expect(requirePermission(permissionKey)).rejects.toThrow("Synthetic redirect: /admin/forbidden");
  });
});
