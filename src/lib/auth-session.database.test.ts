import { createHash, randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const cookieSet = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({
  cookies: async () => ({ set: cookieSet }),
}));

import { createSession } from "./auth";
import { prisma } from "./prisma";

// A real PostgreSQL test, deliberately unavailable to hosted and production DBs.
describe.skipIf(process.env.AMAANA_DATABASE_TESTS !== "true")("atomic admin session PostgreSQL invariants", () => {
  const prefix = randomUUID().replaceAll("-", "");
  const subjectHash = createHash("sha256").update("synthetic-session:" + prefix).digest("hex");
  let userId: string;

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/amaana") {
      throw new Error("Admin session DB tests require the isolated loopback amaana database");
    }

    const user = await prisma.user.create({
      data: { name: "Synthetic session tester", email: prefix + "@example.invalid", status: "ACTIVE" },
      select: { id: true },
    });
    userId = user.id;
  });

  beforeEach(() => {
    cookieSet.mockClear();
  });

  afterAll(async () => {
    if (userId) {
      await prisma.auditEvent.deleteMany({ where: { actorId: userId } });
      await prisma.session.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    }
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
});
