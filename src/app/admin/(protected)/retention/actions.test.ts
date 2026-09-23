import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  findFirstAudit: vi.fn(),
  createAudit: vi.fn(),
  deleteDocumentRecord: vi.fn(),
  transaction: vi.fn(),
  deletePrivateDocumentObject: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.requirePermission }));
vi.mock("@/lib/storage", () => ({ deletePrivateDocumentObject: mocks.deletePrivateDocumentObject }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    assistanceDocument: {
      findUniqueOrThrow: mocks.findUniqueOrThrow,
      delete: mocks.deleteDocumentRecord,
    },
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

describe("private document retention deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "user_123" });
    mocks.findFirstAudit.mockResolvedValue(null);
    mocks.findUniqueOrThrow.mockResolvedValue({
      id: "doc_123",
      assistanceRequestId: "request_123",
      objectKey: "assistance/request_123/123e4567-e89b-12d3-a456-426614174000.pdf",
      originalName: "evidence.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024,
      assistanceRequest: {
        referenceNumber: "AFR-123",
        status: "CLOSED",
        appeal: null,
      },
    });
    mocks.createAudit.mockResolvedValue({ id: "audit_123" });
    mocks.deletePrivateDocumentObject.mockResolvedValue(undefined);
    mocks.deleteDocumentRecord.mockResolvedValue({ id: "doc_123" });
    mocks.transaction.mockResolvedValue([]);
  });

  it("requires exact destructive confirmation before loading the document", async () => {
    await expect(reviewDocumentRetention(deletionForm("delete"))).rejects.toThrow(/Type DELETE/);
    expect(mocks.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(mocks.deletePrivateDocumentObject).not.toHaveBeenCalled();
  });

  it("records destructive intent before deleting storage and then removes the database record", async () => {
    await reviewDocumentRetention(deletionForm());

    expect(mocks.requirePermission).toHaveBeenCalledWith("assistance.approve");
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
    expect(mocks.createAudit.mock.invocationCallOrder[0])
      .toBeLessThan(mocks.deletePrivateDocumentObject.mock.invocationCallOrder[0]);
    expect(mocks.deletePrivateDocumentObject.mock.invocationCallOrder[0])
      .toBeLessThan(mocks.transaction.mock.invocationCallOrder[0]);
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
        assistanceRequest: { referenceNumber: "AFR-123", status: "CLOSED", appeal: null },
      })
      .mockResolvedValueOnce({
        assistanceRequestId: "request_123",
        objectKey: "assistance/request_123/123e4567-e89b-12d3-a456-426614174000.pdf",
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

  it("blocks deletion while an active hold exists", async () => {
    mocks.findFirstAudit.mockResolvedValue({ action: "assistance.document_legal_hold_placed" });
    await expect(reviewDocumentRetention(deletionForm())).rejects.toThrow(/Release the legal/);
    expect(mocks.deletePrivateDocumentObject).not.toHaveBeenCalled();
  });
});
