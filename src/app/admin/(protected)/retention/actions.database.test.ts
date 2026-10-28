import { randomUUID } from "node:crypto";
import { AppealCategory, AssistanceStatus } from "@prisma/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ actorId: "", deleteObject: vi.fn(), authorize: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.authorize }));
vi.mock("@/lib/storage", () => ({ deletePrivateDocumentObject: mocks.deleteObject }));

import { prisma } from "@/lib/prisma";
import { updateRequest } from "../requests/[id]/actions";
import { reviewDocumentRetention } from "./actions";

// Run only against a disposable loopback PostgreSQL /amaana database.
describe.skipIf(process.env.AMAANA_DATABASE_TESTS !== "true")("document retention PostgreSQL claim ordering", () => {
  const prefix = randomUUID().replaceAll("-", "");
  let isolatedTargetAccepted = false;
  let requestId = "";
  let documentId = "";

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/amaana") {
      throw new Error("Retention DB tests require the isolated loopback amaana database");
    }
    isolatedTargetAccepted = true;
    const actor = await prisma.user.create({
      data: { name: "Synthetic retention reviewer", email: `retention-${prefix}@example.invalid`, status: "ACTIVE" },
      select: { id: true },
    });
    mocks.actorId = actor.id;
  });

  beforeEach(async () => {
    mocks.authorize.mockReset();
    mocks.authorize.mockImplementation(async () => ({ id: mocks.actorId }));
    mocks.deleteObject.mockReset();
    mocks.deleteObject.mockResolvedValue(undefined);
    const suffix = randomUUID();
    const request = await prisma.assistanceRequest.create({
      data: {
        referenceNumber: `SYN-RET-${suffix}`,
        applicantName: "Synthetic retention case",
        phone: "0000000000",
        city: "Synthetic",
        category: AppealCategory.OTHER,
        description: "Synthetic isolated-database retention claim test",
        consentGivenAt: new Date(),
        trackingTokenHash: prefix + suffix,
        status: AssistanceStatus.CLOSED,
      },
      select: { id: true },
    });
    requestId = request.id;
    const document = await prisma.assistanceDocument.create({
      data: {
        assistanceRequestId: requestId,
        objectKey: `synthetic-retention/${prefix}/${suffix}.pdf`,
        originalName: "synthetic.pdf",
        mimeType: "application/pdf",
        sizeBytes: 24,
      },
      select: { id: true },
    });
    documentId = document.id;
  });

  afterEach(async () => {
    if (!isolatedTargetAccepted) return;
    if (requestId) {
      await prisma.auditEvent.deleteMany({ where: { entityType: "AssistanceRequest", entityId: requestId } });
      await prisma.assistanceDocument.deleteMany({ where: { assistanceRequestId: requestId } });
      await prisma.assistanceRequest.delete({ where: { id: requestId } });
    }
    requestId = "";
    documentId = "";
  });

  afterAll(async () => {
    if (!isolatedTargetAccepted) return;
    if (mocks.actorId) {
      await prisma.auditEvent.deleteMany({ where: { actorId: mocks.actorId } });
      await prisma.user.delete({ where: { id: mocks.actorId } });
    }
    await prisma.$disconnect();
  });

  function form(decision: "DELETE" | "PLACE_HOLD") {
    const data = new FormData();
    data.set("documentId", documentId);
    data.set("decision", decision);
    data.set("reason", "Synthetic retention concurrency review");
    data.set("expectedHoldAction", "");
    data.set("expectedHoldCreatedAt", "");
    if (decision === "DELETE") data.set("deleteConfirmation", "DELETE");
    return data;
  }

  it("blocks a new hold after the deletion claim commits but before object removal", async () => {
    let releaseStorage!: () => void;
    let enteredStorage!: () => void;
    const storageGate = new Promise<void>(resolve => { releaseStorage = resolve; });
    const storageEntered = new Promise<void>(resolve => { enteredStorage = resolve; });
    mocks.deleteObject.mockImplementation(async () => { enteredStorage(); await storageGate; });

    const deletion = reviewDocumentRetention(form("DELETE"));
    try {
      await Promise.race([
        storageEntered,
        deletion.then(() => { throw new Error("Deletion returned before storage entered"); }),
      ]);
      await expect(reviewDocumentRetention(form("PLACE_HOLD"))).rejects.toThrow(/deletion.*claimed|deletion.*progress/i);
      expect(await prisma.auditEvent.count({
        where: { entityId: requestId, action: "assistance.document_legal_hold_placed" },
      })).toBe(0);
    } finally {
      releaseStorage();
      await deletion;
    }
    expect(mocks.deleteObject).toHaveBeenCalledOnce();
  });

  it("blocks reopening a closed request while claimed evidence deletion is paused", async () => {
    let releaseStorage!: () => void;
    let enteredStorage!: () => void;
    const storageGate = new Promise<void>(resolve => { releaseStorage = resolve; });
    const storageEntered = new Promise<void>(resolve => { enteredStorage = resolve; });
    mocks.deleteObject.mockImplementation(async () => { enteredStorage(); await storageGate; });

    const deletion = reviewDocumentRetention(form("DELETE"));
    try {
      await Promise.race([
        storageEntered,
        deletion.then(() => { throw new Error("Deletion returned before storage entered"); }),
      ]);
      const request = await prisma.assistanceRequest.findUniqueOrThrow({
        where: { id: requestId }, select: { status: true, updatedAt: true },
      });
      expect(request.status).toBe(AssistanceStatus.CLOSED);
      const edit = new FormData();
      edit.set("id", requestId);
      edit.set("status", AssistanceStatus.UNDER_VERIFICATION);
      edit.set("expectedUpdatedAt", request.updatedAt.toISOString());
      edit.set("internalNotes", "Synthetic reopen attempt during deletion");
      await expect(updateRequest(edit)).rejects.toThrow(/evidence deletion.*progress/i);
      expect(await prisma.assistanceRequest.findUniqueOrThrow({
        where: { id: requestId }, select: { status: true },
      })).toEqual({ status: AssistanceStatus.CLOSED });
    } finally {
      releaseStorage();
      await deletion;
    }
  });

  it("preserves a committed hold and denies later object deletion", async () => {
    await reviewDocumentRetention(form("PLACE_HOLD"));
    await expect(reviewDocumentRetention(form("DELETE"))).rejects.toThrow(/legal.*hold/i);
    expect(mocks.deleteObject).not.toHaveBeenCalled();
    expect(await prisma.assistanceDocument.count({ where: { id: documentId } })).toBe(1);
  });

  it("allows only one of two simultaneously submitted hold and delete decisions", async () => {
    let arrivals = 0;
    let releaseBoth!: () => void;
    const startTogether = new Promise<void>(resolve => { releaseBoth = resolve; });
    mocks.authorize.mockImplementation(async () => {
      arrivals += 1;
      if (arrivals === 2) releaseBoth();
      await startTogether;
      return { id: mocks.actorId };
    });

    const [hold, deletion] = await Promise.allSettled([
      reviewDocumentRetention(form("PLACE_HOLD")),
      reviewDocumentRetention(form("DELETE")),
    ]);
    expect([hold.status, deletion.status].sort()).toEqual(["fulfilled", "rejected"]);
    const holdEvents = await prisma.auditEvent.count({
      where: { entityId: requestId, action: "assistance.document_legal_hold_placed" },
    });
    const documentCount = await prisma.assistanceDocument.count({ where: { id: documentId } });
    if (hold.status === "fulfilled") {
      expect(holdEvents).toBe(1);
      expect(documentCount).toBe(1);
      expect(mocks.deleteObject).not.toHaveBeenCalled();
    } else {
      expect(holdEvents).toBe(0);
      expect(documentCount).toBe(0);
      expect(mocks.deleteObject).toHaveBeenCalledOnce();
    }
  });
});
