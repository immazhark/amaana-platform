import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { notificationIssueFilter, notificationIssueWhere, notificationQueueOrder } from "./notification-review-queue";

describe.skipIf(process.env.AMAANA_DATABASE_TESTS !== "true")("notification exception queues PostgreSQL", () => {
  beforeAll(() => {
    const raw = process.env.DATABASE_URL;
    const refused = () => new Error("Notification queue tests require the disposable loopback amaana PostgreSQL database");
    if (!raw || process.env.CI !== "true") throw refused();
    let url: URL;
    try { url = new URL(raw); } catch { throw refused(); }
    if (url.protocol !== "postgresql:" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
      url.port !== "5432" || url.pathname !== "/amaana" || url.username !== "postgres" ||
      !url.password || url.search !== "?schema=public" || url.hash || url.href !== raw) throw refused();
  });
  afterAll(async () => { await prisma.$disconnect(); });
  it("matches the operational counts, exact time thresholds, email channel and stable queue order", async () => {
    const prefix = "notification-review-" + randomUUID();
    const rollback = new Error("Synthetic notification fixture rollback");
    const now = new Date("2026-11-27T00:00:00.000Z");
    const edge = new Date(now.getTime() - 15 * 60 * 1000);
    const before = new Date(edge.getTime() - 1);
    const earlier = new Date(edge.getTime() - 2);
    const terminal = new Date("9999-01-01T00:00:00.000Z");
    const fixture = (suffix: string, data: Partial<Prisma.NotificationCreateManyInput>): Prisma.NotificationCreateManyInput => ({
      id: prefix + "-" + suffix, channel: "EMAIL", status: "PENDING",
      recipient: "synthetic@example.invalid", templateKey: prefix, payload: { synthetic: true },
      createdAt: earlier, updatedAt: now, scheduledFor: now, ...data,
    });
    await expect(prisma.$transaction(async tx => {
      await tx.notification.createMany({ data: [
        fixture("stuck-a", { status: "PROCESSING", updatedAt: before }),
        fixture("stuck-b", { status: "PROCESSING", updatedAt: before }),
        fixture("stuck-edge", { status: "PROCESSING", updatedAt: edge }),
        fixture("overdue-pending", { scheduledFor: earlier }),
        fixture("overdue-failed", { status: "FAILED", scheduledFor: before, attempts: 4 }),
        fixture("overdue-edge", { scheduledFor: edge }),
        fixture("terminal-attempts", { status: "FAILED", scheduledFor: earlier, updatedAt: before, attempts: 5 }),
        fixture("terminal-sentinel", { status: "FAILED", scheduledFor: terminal, updatedAt: edge, attempts: 1 }),
        fixture("other-channel", { channel: "WHATSAPP", status: "FAILED", scheduledFor: earlier, attempts: 5 }),
        fixture("sent", { status: "SENT", scheduledFor: earlier }),
        fixture("cancelled", { status: "CANCELLED", scheduledFor: earlier }),
      ] });
      for (const [issue, expected] of [
        ["stale-processing", ["stuck-a", "stuck-b"]],
        ["overdue", ["overdue-pending", "overdue-failed"]],
        ["terminal", ["terminal-attempts", "terminal-sentinel"]],
      ] as const) {
        const filter = notificationIssueFilter(issue, now);
        const where = { AND: [{ templateKey: prefix }, filter.where!] };
        const signal = await tx.notification.count({ where: { AND: [{ templateKey: prefix }, notificationIssueWhere(issue, now)] } });
        const grouped = await tx.notification.groupBy({ by: ["status"], where, _count: { _all: true } });
        const rows = await tx.notification.findMany({ where, select: { id: true, status: true }, orderBy: notificationQueueOrder(issue), take: 50 });
        expect(rows.map(row => row.id)).toEqual(expected.map(suffix => prefix + "-" + suffix));
        expect(signal).toBe(expected.length);
        expect(grouped.reduce((sum, row) => sum + row._count._all, 0)).toBe(signal);
        for (const group of grouped) expect(rows.filter(row => row.status === group.status)).toHaveLength(group._count._all);
      }
      const invalid = notificationIssueFilter(["overdue", "unknown"], now);
      expect(await tx.notification.count({ where: { AND: [{ templateKey: prefix }, invalid.where!] } })).toBe(0);
      throw rollback;
    }, { timeout: 20000 })).rejects.toBe(rollback);
    expect(await prisma.notification.count({ where: { templateKey: prefix } })).toBe(0);
  });
});
