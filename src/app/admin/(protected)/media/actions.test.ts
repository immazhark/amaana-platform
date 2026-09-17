import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  deleteRecord: vi.fn(),
  createAudit: vi.fn(),
  transaction: vi.fn(),
  deletePublicMediaObject: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth", () => ({
  hasPermission: () => true,
  requirePermission: mocks.requirePermission,
}));
vi.mock("@/lib/media-governance", () => ({
  mediaPublicationIssues: () => [],
  parseMediaPublicationReview: () => ({}),
}));
vi.mock("@/lib/public-media", () => ({ canRenderPublicMedia: () => true }));
vi.mock("@/lib/storage", () => ({
  deletePublicMediaObject: mocks.deletePublicMediaObject,
  uploadPublicMediaFile: vi.fn(),
  validatePublicMediaFile: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    mediaAsset: {
      findUniqueOrThrow: mocks.findUniqueOrThrow,
      delete: mocks.deleteRecord,
      create: vi.fn(),
      update: vi.fn(),
    },
    auditEvent: { create: mocks.createAudit },
    $transaction: mocks.transaction,
  },
}));

import { deleteMediaAsset } from "./actions";

function deletionForm(confirm = "DELETE") {
  const formData = new FormData();
  formData.set("id", "media_123");
  formData.set("confirm", confirm);
  return formData;
}

describe("admin media deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "user_123" });
    mocks.deletePublicMediaObject.mockResolvedValue(undefined);
    mocks.deleteRecord.mockResolvedValue({ id: "media_123" });
    mocks.createAudit.mockResolvedValue({ id: "audit_123" });
    mocks.transaction.mockResolvedValue([]);
  });

  it("requires explicit DELETE confirmation before reading the media record", async () => {
    await expect(deleteMediaAsset(deletionForm("delete"))).rejects.toThrow(/type DELETE/i);
    expect(mocks.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(mocks.deletePublicMediaObject).not.toHaveBeenCalled();
  });

  it("refuses permanent deletion while media is published", async () => {
    mocks.findUniqueOrThrow.mockResolvedValue({
      id: "media_123",
      isPublic: true,
      storageKey: "2026/11111111-1111-4111-8111-111111111111.jpg",
      publicUrl: "https://cdn.example/media.jpg",
      title: "Published",
      sourcePath: "IMG.jpg",
    });

    await expect(deleteMediaAsset(deletionForm())).rejects.toThrow(/unpublish/i);
    expect(mocks.deletePublicMediaObject).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("deletes managed storage before atomically removing an unpublished record and recording the audit", async () => {
    mocks.findUniqueOrThrow.mockResolvedValue({
      id: "media_123",
      isPublic: false,
      storageKey: "2026/11111111-1111-4111-8111-111111111111.jpg",
      publicUrl: "https://cdn.example/media.jpg",
      title: "Unpublished",
      sourcePath: "IMG.jpg",
    });

    await deleteMediaAsset(deletionForm());

    expect(mocks.requirePermission).toHaveBeenCalledWith("content.approve");
    expect(mocks.deletePublicMediaObject).toHaveBeenCalledWith("2026/11111111-1111-4111-8111-111111111111.jpg");
    expect(mocks.deleteRecord).toHaveBeenCalledWith({ where: { id: "media_123" } });
    expect(mocks.createAudit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "media.deleted", entityId: "media_123", actorId: "user_123" }),
    }));
    expect(mocks.deletePublicMediaObject.mock.invocationCallOrder[0]).toBeLessThan(mocks.transaction.mock.invocationCallOrder[0]);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/media");
  });
});
