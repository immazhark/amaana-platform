import { createHash, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "./prisma";
import { AUTH_FAILURE_LIMIT, AUTH_FAILURE_WINDOW_MS, reserveLoginAttempt } from "./auth-rate-limit";

// Opt-in and loopback-only: never run against a hosted or production database.
describe.skipIf(process.env.AMAANA_DATABASE_TESTS !== "true")("login admission PostgreSQL invariants", () => {
  const subjects: string[] = [];

  beforeAll(() => {
    const url = new URL(process.env.DATABASE_URL!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/amaana") {
      throw new Error("Login admission tests require the isolated loopback amaana database");
    }
  });

  afterAll(async () => {
    if (subjects.length) await prisma.loginAttempt.deleteMany({ where: { subjectHash: { in: subjects } } });
    await prisma.$disconnect();
  });

  function subject() {
    const hash = createHash("sha256").update(`synthetic-login:${randomUUID()}`).digest("hex");
    subjects.push(hash);
    return hash;
  }

  it("grants the final slot exactly once under concurrent transactions", async () => {
    const subjectHash = subject();
    await prisma.loginAttempt.createMany({
      data: Array.from({ length: AUTH_FAILURE_LIMIT - 1 }, () => ({ subjectHash })),
    });
    const outcomes = await Promise.all(Array.from({ length: 8 }, () => reserveLoginAttempt(subjectHash)));
    expect(outcomes.filter(Boolean)).toHaveLength(1);
    expect(outcomes.filter(id => id === null)).toHaveLength(7);
    expect(await prisma.loginAttempt.count({ where: { subjectHash, succeeded: false } })).toBe(AUTH_FAILURE_LIMIT);
    expect(await reserveLoginAttempt(subjectHash)).toBeNull();
  });

  it("releases only a successful reservation while preserving previous failures", async () => {
    const subjectHash = subject();
    await prisma.loginAttempt.createMany({
      data: Array.from({ length: AUTH_FAILURE_LIMIT - 1 }, () => ({ subjectHash })),
    });
    const id = await reserveLoginAttempt(subjectHash);
    expect(id).toEqual(expect.any(String));
    await prisma.loginAttempt.update({ where: { id: id! }, data: { succeeded: true } });
    expect(await reserveLoginAttempt(subjectHash)).toEqual(expect.any(String));
    expect(await reserveLoginAttempt(subjectHash)).toBeNull();
    expect(await prisma.loginAttempt.count({ where: { subjectHash, succeeded: true } })).toBe(1);
    expect(await prisma.loginAttempt.count({ where: { subjectHash, succeeded: false } })).toBe(AUTH_FAILURE_LIMIT);
  });

  it("excludes expired failures and another subject's failures", async () => {
    const subjectHash = subject();
    const otherSubject = subject();
    await prisma.loginAttempt.createMany({ data: [
      ...Array.from({ length: AUTH_FAILURE_LIMIT }, () => ({ subjectHash, createdAt: new Date(Date.now() - AUTH_FAILURE_WINDOW_MS - 60_000) })),
      ...Array.from({ length: AUTH_FAILURE_LIMIT }, () => ({ subjectHash: otherSubject })),
    ] });
    expect(await reserveLoginAttempt(subjectHash)).toEqual(expect.any(String));
    expect(await reserveLoginAttempt(otherSubject)).toBeNull();
  });
});
