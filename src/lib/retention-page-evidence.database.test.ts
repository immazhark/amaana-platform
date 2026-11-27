import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { loadRetentionPageEvidence } from "./retention-page-evidence";
import { classifyRetentionSchedule } from "./retention-review";

describe.skipIf(process.env.AMAANA_DATABASE_TESTS !== "true")("private retention page evidence PostgreSQL", () => {
  beforeAll(() => {
    const raw = process.env.DATABASE_URL;
    const refused = () => new Error("Retention evidence tests require the disposable loopback amaana PostgreSQL database");
    if (!raw || process.env.CI !== "true") throw refused();
    let url: URL;
    try { url = new URL(raw); } catch { throw refused(); }
    if (url.protocol !== "postgresql:" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
      url.port !== "5432" || url.pathname !== "/amaana" || url.username !== "postgres" ||
      !url.password || url.search !== "?schema=public" || url.hash || url.href !== raw) throw refused();
  });
  afterAll(async () => { await prisma.$disconnect(); });

  it("bounds persisted evidence, isolates cases, detects conflicting holds and preserves reminder classification", async () => {
    const prefix = "retention-" + randomUUID();
    const rollback = new Error("Synthetic retention fixture rollback");
    const old = new Date("2020-01-01T00:00:00.000Z");
    const hold = new Date("2026-01-01T00:00:00.000Z");
    const release = new Date("2026-02-01T00:00:00.000Z");
    const review = new Date("2026-03-01T00:00:00.000Z");
    const reminder = "2026-04-01T00:00:00.000Z";
    await expect(prisma.$transaction(async tx => {
      const actor = await tx.user.create({ data: { name: "Synthetic retention reviewer", email: prefix + "@example.invalid" } });
      const makeCase = (suffix: string) => tx.assistanceRequest.create({ data: {
        referenceNumber: prefix + "-" + suffix, applicantName: "Synthetic applicant", phone: "+910000000000",
        city: "Hyderabad", category: "OTHER", description: "Disposable retention evidence test",
        consentGivenAt: old, trackingTokenHash: "0".repeat(64), status: "CLOSED",
      } });
      const caseA = await makeCase("a");
      const caseB = await makeCase("b");
      const makeDocument = (suffix: string, assistanceRequestId: string) => tx.assistanceDocument.create({ data: {
        id: prefix + "-" + suffix, assistanceRequestId, objectKey: "synthetic/" + prefix + "/" + suffix,
        originalName: "synthetic.pdf", mimeType: "application/pdf", sizeBytes: 1,
      } });
      const clean = await makeDocument("clean", caseA.id);
      const cross = await makeDocument("cross", caseA.id);
      const tied = await makeDocument("tied", caseB.id);
      const invalid = await makeDocument("invalid", caseB.id);
      const empty = await makeDocument("empty", caseA.id);
      const excluded = await makeDocument("excluded", caseA.id);
      const placed = "assistance.document_legal_hold_placed";
      const released = "assistance.document_legal_hold_released";
      const retained = "assistance.document_retention_reviewed";
      const event = (suffix: string, entityId: string, documentId: string, action: string, createdAt: Date, extra: Prisma.InputJsonObject = {}) => ({
        id: prefix + "-" + suffix, actorId: actor.id, entityType: "AssistanceRequest", entityId,
        action, createdAt, metadata: { documentId, ...extra },
      });
      await tx.auditEvent.createMany({ data: [
        ...Array.from({ length: 100 }, (_, i) => event("old-" + String(i).padStart(3, "0"), caseA.id, clean.id, retained, old, { reason: "Obsolete marker" })),
        event("clean-hold", caseA.id, clean.id, placed, hold),
        event("clean-release", caseA.id, clean.id, released, release),
        event("clean-review-a", caseA.id, clean.id, retained, review, { reason: "Older tied review", reviewAfter: null }),
        event("clean-review-b", caseA.id, clean.id, retained, review, { reason: "Latest tied review", reviewAfter: reminder, undisplayed: "PRIVATE_SYNTHETIC_METADATA" }),
        event("cross-hold", caseA.id, cross.id, placed, hold),
        event("foreign-release", caseB.id, cross.id, released, review, { reason: "FOREIGN_SYNTHETIC_REASON" }),
        event("tied-hold-a", caseB.id, tied.id, placed, hold),
        event("tied-release-b", caseB.id, tied.id, released, hold),
        event("invalid-review", caseB.id, invalid.id, retained, review, { reviewAfter: "2026-02-30T00:00:00.000Z" }),
        event("excluded-review", caseA.id, excluded.id, retained, review, { reason: "EXCLUDED_SYNTHETIC_REASON" }),
        { ...event("wrong-entity", caseB.id, clean.id, released, review), entityType: "SyntheticFixture" },
      ] });
      const documents = [clean, cross, tied, invalid, empty].map(({ id, assistanceRequestId }) => ({ id, assistanceRequestId }));
      const result = await loadRetentionPageEvidence(tx, documents);
      expect(result.size).toBe(5);
      expect(result.has(excluded.id)).toBe(false);
      expect(result.get(clean.id)).toMatchObject({
        conflict: false, holdAction: released, holdAt: release, holdActor: actor.name,
        reviewAt: review, reviewActor: actor.name, reviewReason: "Latest tied review",
        reviewAfter: reminder, decisionAction: retained, decisionAfter: reminder,
      });
      expect(classifyRetentionSchedule(true, result.get(clean.id)?.decisionAfter, "2026-04-01")).toBe("due");
      expect(result.get(cross.id)).toMatchObject({ conflict: true, holdAction: placed, holdAt: hold });
      expect(result.get(tied.id)).toMatchObject({ conflict: true, holdAction: released, holdAt: hold });
      expect(result.get(empty.id)).toMatchObject({ conflict: false, holdAction: null, reviewAt: null, decisionAction: null });
      expect(classifyRetentionSchedule(true, result.get(invalid.id)?.decisionAfter, "2026-04-01")).toBe("invalid");
      const serialized = JSON.stringify([...result.values()]);
      expect(serialized).not.toMatch(/PRIVATE_SYNTHETIC_METADATA|FOREIGN_SYNTHETIC_REASON|EXCLUDED_SYNTHETIC_REASON|Obsolete marker|Older tied review/);
      // Positive control: the previous case-wide read returns the other case's release first.
      const oldHistory = await tx.auditEvent.findMany({
        where: { entityType: "AssistanceRequest", entityId: { in: [caseA.id, caseB.id] }, action: { in: [placed, released] } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { entityId: true, action: true, metadata: true },
      });
      const oldLatest = oldHistory.find(item => (item.metadata as { documentId?: string } | null)?.documentId === cross.id);
      expect(oldLatest).toMatchObject({ entityId: caseB.id, action: released });
      await expect(loadRetentionPageEvidence(tx, [{ id: clean.id, assistanceRequestId: caseB.id }])).rejects.toThrow("Inconsistent retention page evidence");
      await expect(loadRetentionPageEvidence(tx, [{ id: prefix + "-missing", assistanceRequestId: caseA.id }])).rejects.toThrow("Incomplete retention page evidence");
      throw rollback;
    }, { timeout: 20000 })).rejects.toBe(rollback);
    expect(await prisma.user.count({ where: { email: prefix + "@example.invalid" } })).toBe(0);
  });
});
