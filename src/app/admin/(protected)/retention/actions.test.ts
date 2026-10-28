import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  findFirstAudit: vi.fn(),
  createAudit: vi.fn(),
  deleteDocumentRecord: vi.fn(),
  updateManyDocument: vi.fn(),
  updateManyRequest: vi.fn(),
  transaction: vi.fn(),
  serializableTransaction: vi.fn(),
  deletePrivateDocumentObject: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.requirePermission }));
vi.mock("@/lib/storage", () => ({ deletePrivateDocumentObject: mocks.deletePrivateDocumentObject }));
vi.mock("@/lib/prisma-transaction", () => ({
  withSerializableTransactionRetry: mocks.serializableTransaction,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    assistanceDocument: {
      findUniqueOrThrow: mocks.findUniqueOrThrow,
      delete: mocks.deleteDocumentRecord,
      updateMany: mocks.updateManyDocument,
    },
    assistanceRequest: { updateMany: mocks.updateManyRequest },
    auditEvent: {
      findFirst: mocks.findFirstAudit,
      create: mocks.createAudit,
    },
    $transaction: mocks.transaction,
  },
}));

import { reviewDocumentRetention } from "./actions";

function deletionForm(confirm = "DELETE") {
  const form = new FormData();
  form.set("documentId", "doc_123");
  form.set("decision", "DELETE");
  form.set("deleteConfirmation", confirm);
  form.set("reason", "Operational purpose completed and no hold remains.");
  return form;
}

function holdForm() {
  const form = new FormData();
  form.set("documentId", "doc_123");
  form.set("decision", "PLACE_HOLD");
  form.set("reason", "Safeguarding review is active.");
  form.set("expectedHoldAction", "");
  form.set("expectedHoldCreatedAt", "");
  return form;
}

describe("private document retention deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "user_123" });
    mocks.findFirstAudit.mockResolvedValue(null);
    mocks.updateManyDocument.mockResolvedValue({ count: 1 });
    mocks.updateManyRequest.mockResolvedValue({ count: 1 });
    mocks.findUniqueOrThrow.mockResolvedValue({
      id: "doc_123",
      assistanceRequestId: "request_123",
      objectKey: "assistance/request_123/123e4567-e89b-12d3-a456-426614174000.pdf",
      originalName: "evidence.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024,
      updatedAt: new Date("2026-09-23T00:00:00.000Z"),
      assistanceRequest: {
        referenceNumber: "AFR-123",
        status: "CLOSED",
        updatedAt: new Date("2026-09-23T00:00:00.000Z"),
        appeal: null,
      },
    });
    mocks.createAudit.mockResolvedValue({ id: "audit_123" });
    mocks.deletePrivateDocumentObject.mockResolvedValue(undefined);
    mocks.deleteDocumentRecord.mockResolvedValue({ id: "doc_123" });
    mocks.transaction.mockResolvedValue([]);
    mocks.serializableTransaction.mockImplementation(async callback => callback({
      assistanceDocument: { findUniqueOrThrow: mocks.findUniqueOrThrow, updateMany: mocks.updateManyDocument },
      assistanceRequest: { updateMany: mocks.updateManyRequest },
      auditEvent: { findFirst: mocks.findFirstAudit, create: mocks.createAudit },
    }));
  });

  function expectNoRecordEffects() {
    for (const effect of [mocks.findUniqueOrThrow, mocks.findFirstAudit, mocks.createAudit,
      mocks.updateManyDocument, mocks.updateManyRequest, mocks.deleteDocumentRecord, mocks.transaction,
      mocks.serializableTransaction, mocks.deletePrivateDocumentObject, mocks.revalidatePath]) {
      expect(effect).not.toHaveBeenCalled();
    }
  }

  it.each(["documentId", "decision", "deleteConfirmation", "reason", "reviewAfter", "expectedHoldAction", "expectedHoldCreatedAt"])(
    "rejects repeated %s fields before private record access", async field => {
      const form = deletionForm();
      if (!form.has(field)) form.set(field, "");
      form.append(field, "ambiguous second value");
      await expect(reviewDocumentRetention(form)).rejects.toThrow(/Repeated/);
      expectNoRecordEffects();
    },
  );

  it.each(["documentId", "decision", "deleteConfirmation", "reason", "reviewAfter", "expectedHoldAction", "expectedHoldCreatedAt"])(
    "rejects file-valued %s before private record access", async field => {
      const form = deletionForm();
      form.set(field, new Blob(["synthetic"]), "synthetic.txt");
      await expect(reviewDocumentRetention(form)).rejects.toThrow(/single text/);
      expectNoRecordEffects();
    },
  );

  it.each(["2027-02-31", "2027-02-29", "2028-04-31", "2028-2-09", "2028-13-01", "2028-01-00", "not-a-date"])(
    "rejects impossible or noncanonical review date %s before private record access", async date => {
      const form = deletionForm();
      form.set("decision", "RETAIN");
      form.set("reviewAfter", date);
      await expect(reviewDocumentRetention(form)).rejects.toThrow(/Invalid review date/);
      expectNoRecordEffects();
    },
  );

  it.each(["2096-02-29", "2097-02-28"])("preserves valid future review date %s", async date => {
    const form = deletionForm();
    form.set("decision", "RETAIN");
    form.set("reviewAfter", date);
    await reviewDocumentRetention(form);
    expect(mocks.createAudit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ metadata: expect.objectContaining({ reviewAfter: `${date}T00:00:00.000Z` }) }),
    }));
    expect(mocks.deletePrivateDocumentObject).not.toHaveBeenCalled();
  });

  it("rejects a stale hold decision without writing contradictory audit history", async () => {
    const form = new FormData();
    form.set("documentId", "doc_123");
    form.set("decision", "PLACE_HOLD");
    form.set("reason", "Safeguarding review is active.");
    form.set("expectedHoldAction", "");
    form.set("expectedHoldCreatedAt", "");

    mocks.findFirstAudit
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        action: "assistance.document_legal_hold_placed",
        createdAt: new Date("2026-09-23T04:00:00.000Z"),
      });

    await expect(reviewDocumentRetention(form)).rejects.toThrow(/hold state changed while you were reviewing/i);
    expect(mocks.createAudit).not.toHaveBeenCalled();
  });

  it("records a hold only when the reviewed hold version is still current", async () => {
    const createdAt = new Date("2026-09-23T04:00:00.000Z");
    const form = new FormData();
    form.set("documentId", "doc_123");
    form.set("decision", "RELEASE_HOLD");
    form.set("reason", "Safeguarding review is complete.");
    form.set("expectedHoldAction", "assistance.document_legal_hold_placed");
    form.set("expectedHoldCreatedAt", createdAt.toISOString());

    mocks.findFirstAudit.mockImplementation(async args =>
      Array.isArray(args.where.action?.in)
        ? { action: "assistance.document_legal_hold_placed", createdAt }
        : null);

    await reviewDocumentRetention(form);

    expect(mocks.serializableTransaction).toHaveBeenCalledTimes(1);
    expect(mocks.createAudit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: "assistance.document_legal_hold_released",
        entityId: "request_123",
        metadata: expect.objectContaining({ documentId: "doc_123" }),
      }),
    }));
  });

  it("blocks a hold after a deletion claim, before creating an audit entry", async () => {
    mocks.findFirstAudit.mockImplementation(async args =>
      args.where.action === "assistance.document_deletion_started"
        ? { action: "assistance.document_deletion_started" }
        : null);

    await expect(reviewDocumentRetention(holdForm())).rejects.toThrow(/deletion.*progress|deletion.*claimed/i);
    expect(mocks.createAudit).not.toHaveBeenCalled();
    expect(mocks.deletePrivateDocumentObject).not.toHaveBeenCalled();
  });

  it("updates the document version inside the hold transaction", async () => {
    let inTransaction = false;
    mocks.serializableTransaction.mockImplementation(async callback => {
      inTransaction = true;
      try {
        return await callback({
          assistanceDocument: { findUniqueOrThrow: mocks.findUniqueOrThrow, updateMany: mocks.updateManyDocument },
          assistanceRequest: { updateMany: mocks.updateManyRequest },
          auditEvent: { findFirst: mocks.findFirstAudit, create: mocks.createAudit },
        });
      } finally {
        inTransaction = false;
      }
    });
    mocks.updateManyDocument.mockImplementation(async () => {
      expect(inTransaction).toBe(true);
      return { count: 1 };
    });

    await reviewDocumentRetention(holdForm());
    expect(mocks.updateManyDocument).toHaveBeenCalledOnce();
    expect(mocks.createAudit).toHaveBeenCalledOnce();
  });

  it("requires exact destructive confirmation before loading the document", async () => {
    await expect(reviewDocumentRetention(deletionForm("delete"))).rejects.toThrow(/Type DELETE/);
    expect(mocks.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(mocks.deletePrivateDocumentObject).not.toHaveBeenCalled();
  });

  it("records destructive intent before deleting storage and then removes the database record", async () => {
    await reviewDocumentRetention(deletionForm());

    expect(mocks.requirePermission).toHaveBeenCalledWith("assistance.approve");
    expect(mocks.updateManyDocument).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: "doc_123", objectKey: expect.any(String), updatedAt: expect.any(Date) }),
      data: expect.objectContaining({ updatedAt: expect.any(Date) }),
    }));
    expect(mocks.createAudit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: "assistance.document_deletion_started",
        entityId: "request_123",
        actorId: "user_123",
      }),
    }));
    expect(mocks.deletePrivateDocumentObject).toHaveBeenCalledWith(
      "assistance/request_123/123e4567-e89b-12d3-a456-426614174000.pdf",
      "request_123",
    );
    const auditOrder = mocks.createAudit.mock.invocationCallOrder[0];
    const deleteObjectOrder = mocks.deletePrivateDocumentObject.mock.invocationCallOrder[0];
    const transactionOrder = mocks.transaction.mock.invocationCallOrder[0];
    if (auditOrder === undefined || deleteObjectOrder === undefined || transactionOrder === undefined) {
      throw new Error("Expected retention deletion call ordering.");
    }
    expect(auditOrder).toBeLessThan(deleteObjectOrder);
    expect(deleteObjectOrder).toBeLessThan(transactionOrder);
    expect(mocks.createAudit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: "assistance.document_deleted",
        entityId: "request_123",
      }),
    }));
    for (const [arg] of mocks.createAudit.mock.calls) {
      if (arg?.data?.action === "assistance.document_deletion_started" || arg?.data?.action === "assistance.document_deleted") {
        expect(arg.data.metadata).toEqual({
          documentId: "doc_123",
          reason: "Operational purpose completed and no hold remains.",
        });
        expect(arg.data.metadata).not.toHaveProperty("originalName");
        expect(arg.data.metadata).not.toHaveProperty("objectKey");
        expect(arg.data.metadata).not.toHaveProperty("requestReference");
        expect(arg.data.metadata).not.toHaveProperty("mimeType");
        expect(arg.data.metadata).not.toHaveProperty("sizeBytes");
      }
    }
  });

  it("claims and audits deletion in one serializable transaction before object deletion", async () => {
    let inTransaction = false;
    mocks.serializableTransaction.mockImplementation(async callback => {
      inTransaction = true;
      try {
        return await callback({
          assistanceDocument: { findUniqueOrThrow: mocks.findUniqueOrThrow, updateMany: mocks.updateManyDocument },
          assistanceRequest: { updateMany: mocks.updateManyRequest },
          auditEvent: { findFirst: mocks.findFirstAudit, create: mocks.createAudit },
        });
      } finally {
        inTransaction = false;
      }
    });
    mocks.updateManyDocument.mockImplementation(async () => {
      expect(inTransaction).toBe(true);
      return { count: 1 };
    });
    mocks.createAudit.mockImplementation(async args => {
      if (args.data.action === "assistance.document_deletion_started") expect(inTransaction).toBe(true);
      return { id: "audit_123" };
    });

    await reviewDocumentRetention(deletionForm());
    expect(mocks.serializableTransaction).toHaveBeenCalledOnce();
    expect(mocks.deletePrivateDocumentObject).toHaveBeenCalledOnce();
  });

  it("claims the request version before storage deletion so status transitions must serialize", async () => {
    await reviewDocumentRetention(deletionForm());

    expect(mocks.updateManyRequest).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: "request_123", status: "CLOSED", updatedAt: expect.any(Date),
      }),
      data: { updatedAt: expect.any(Date) },
    }));
    const requestClaimOrder = mocks.updateManyRequest.mock.invocationCallOrder[0];
    const storageOrder = mocks.deletePrivateDocumentObject.mock.invocationCallOrder[0];
    if (requestClaimOrder === undefined || storageOrder === undefined) {
      throw new Error("Expected the request claim and storage deletion to be called.");
    }
    expect(requestClaimOrder).toBeLessThan(storageOrder);
  });

  it("does not delete object storage if the request version claim fails", async () => {
    mocks.updateManyRequest.mockResolvedValueOnce({ count: 0 });

    await expect(reviewDocumentRetention(deletionForm())).rejects.toThrow(/request.*changed/i);
    expect(mocks.deletePrivateDocumentObject).not.toHaveBeenCalled();
  });

  it("rejects a second deletion when an earlier deletion claim remains", async () => {
    mocks.findFirstAudit.mockImplementation(async args =>
      args.where.action === "assistance.document_deletion_started"
        ? { action: "assistance.document_deletion_started" }
        : null);

    await expect(reviewDocumentRetention(deletionForm())).rejects.toThrow(/deletion.*progress|deletion.*claimed/i);
    expect(mocks.deletePrivateDocumentObject).not.toHaveBeenCalled();
    expect(mocks.deleteDocumentRecord).not.toHaveBeenCalled();
  });

  it("does not delete storage if the deletion-claim audit cannot commit", async () => {
    mocks.createAudit.mockRejectedValueOnce(new Error("Synthetic audit write failure"));

    await expect(reviewDocumentRetention(deletionForm())).rejects.toThrow(/Synthetic audit write failure/);
    expect(mocks.serializableTransaction).toHaveBeenCalledOnce();
    expect(mocks.deletePrivateDocumentObject).not.toHaveBeenCalled();
    expect(mocks.deleteDocumentRecord).not.toHaveBeenCalled();
  });

  it("keeps a later hold blocked after an uncertain object deletion failure", async () => {
    let started = false;
    mocks.findFirstAudit.mockImplementation(async args =>
      args.where.action === "assistance.document_deletion_started" && started
        ? { id: "deletion_started_123" }
        : null);
    mocks.createAudit.mockImplementation(async args => {
      if (args.data.action === "assistance.document_deletion_started") started = true;
      return { id: "audit_123" };
    });
    mocks.deletePrivateDocumentObject.mockRejectedValueOnce(new Error("Synthetic uncertain storage failure"));

    await expect(reviewDocumentRetention(deletionForm())).rejects.toThrow(/uncertain storage failure/);
    await expect(reviewDocumentRetention(holdForm())).rejects.toThrow(/deletion.*progress|deletion.*claimed/i);
    expect(mocks.deletePrivateDocumentObject).toHaveBeenCalledOnce();
    expect(mocks.deleteDocumentRecord).not.toHaveBeenCalled();
    expect(mocks.createAudit).toHaveBeenCalledOnce();
  });

  it("revalidates a newly placed hold immediately before storage deletion", async () => {
    mocks.findFirstAudit
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ action: "assistance.document_legal_hold_placed" });

    await expect(reviewDocumentRetention(deletionForm())).rejects.toThrow(/placed under hold while you were reviewing/i);
    expect(mocks.deletePrivateDocumentObject).not.toHaveBeenCalled();
    expect(mocks.createAudit).not.toHaveBeenCalled();
  });

  it("revalidates terminal workflow state immediately before storage deletion", async () => {
    mocks.findUniqueOrThrow
      .mockResolvedValueOnce({
        id: "doc_123",
        assistanceRequestId: "request_123",
        objectKey: "assistance/request_123/123e4567-e89b-12d3-a456-426614174000.pdf",
        originalName: "evidence.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
        updatedAt: new Date("2026-09-23T00:00:00.000Z"),
        assistanceRequest: { referenceNumber: "AFR-123", status: "CLOSED", appeal: null },
      })
      .mockResolvedValueOnce({
        assistanceRequestId: "request_123",
        objectKey: "assistance/request_123/123e4567-e89b-12d3-a456-426614174000.pdf",
        updatedAt: new Date("2026-09-23T00:00:00.000Z"),
        assistanceRequest: { status: "UNDER_VERIFICATION", appeal: { status: "PUBLISHED" } },
      });

    await expect(reviewDocumentRetention(deletionForm())).rejects.toThrow(/changed while you were reviewing/i);
    expect(mocks.deletePrivateDocumentObject).not.toHaveBeenCalled();
    expect(mocks.createAudit).not.toHaveBeenCalled();
  });

  it("blocks deletion while the request and linked appeal are still active", async () => {
    mocks.findUniqueOrThrow.mockResolvedValue({
      id: "doc_123",
      assistanceRequestId: "request_123",
      objectKey: "assistance/request_123/123e4567-e89b-12d3-a456-426614174000.pdf",
      originalName: "evidence.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024,
      updatedAt: new Date("2026-09-23T00:00:00.000Z"),
      assistanceRequest: {
        referenceNumber: "AFR-123",
        status: "UNDER_VERIFICATION",
        appeal: { status: "PUBLISHED" },
      },
    });

    await expect(reviewDocumentRetention(deletionForm())).rejects.toThrow(/only be deleted after/i);
    expect(mocks.deletePrivateDocumentObject).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("fails closed if a hold placement and release share the latest timestamp", async () => {
    const tiedAt = new Date("2026-10-28T08:00:00.000Z");
    mocks.findFirstAudit.mockImplementation(async args => {
      if (Array.isArray(args.where.action?.in)) {
        return { action: "assistance.document_legal_hold_released", createdAt: tiedAt };
      }
      if (args.where.action === "assistance.document_legal_hold_placed" && args.where.createdAt) {
        return { id: "opposing-hold" };
      }
      return null;
    });

    await expect(reviewDocumentRetention(deletionForm())).rejects.toThrow(/conflicting legal hold/i);
    expect(mocks.deletePrivateDocumentObject).not.toHaveBeenCalled();
    expect(mocks.createAudit).not.toHaveBeenCalled();
  });

  it("blocks deletion while an active hold exists", async () => {
    mocks.findFirstAudit.mockImplementation(async args => Array.isArray(args.where.action?.in)
      ? { action: "assistance.document_legal_hold_placed", createdAt: new Date("2026-10-28T08:00:00.000Z") }
      : null);
    await expect(reviewDocumentRetention(deletionForm())).rejects.toThrow(/Release the legal/);
    expect(mocks.deletePrivateDocumentObject).not.toHaveBeenCalled();
  });
});
