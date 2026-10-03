import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  findMany: vi.fn(),
  createRecord: vi.fn(),
  deleteRecord: vi.fn(),
  updateRecord: vi.fn(),
  updateMany: vi.fn(),
  createAudit: vi.fn(),
  transaction: vi.fn(),
  serializableTransaction: vi.fn(),
  deletePublicMediaObject: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth", () => ({
  hasPermission: () => true,
  requirePermission: mocks.requirePermission,
}));
vi.mock("@/lib/prisma-transaction", () => ({ withSerializableTransactionRetry: mocks.serializableTransaction }));
vi.mock("@/lib/media-governance", () => ({
  mediaPublicationIssues: () => [],
  parseMediaPublicationReview: () => ({}),
}));
vi.mock("@/lib/public-media", () => ({
  canRenderPublicMedia: () => true,
  IDENTITY_MEDIA_SORT_ORDER: -1000,
  normalizeSafePublicMediaUrl: (value: string | null | undefined) => value?.trim() || null,
}));
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
      create: mocks.createRecord,
      update: mocks.updateRecord,
      updateMany: mocks.updateMany,
    },
    auditEvent: { create: mocks.createAudit },
    $transaction: mocks.transaction,
  },
}));

import { createMediaAsset, deleteMediaAsset, setMediaPublication, updateMediaAsset } from "./actions";

function deletionForm(confirm = "DELETE") {
  const formData = new FormData();
  formData.set("id", "media_123");
  formData.set("confirm", confirm);
  return formData;
}

function updateForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("id", "media_123");
  formData.set("publicUrl", "https://cdn.example/original.jpg");
  formData.set("altText", "Documentary photograph");
  formData.set("sortOrder", "0");
  formData.set("expectedUpdatedAt", "2026-09-23T00:00:00.000Z");
  for (const [key, value] of Object.entries(overrides)) formData.set(key, value);
  return formData;
}

describe("identity media creation concurrency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "user_123" });
    mocks.findMany.mockResolvedValue([]);
    mocks.updateMany.mockResolvedValue({ count: 0 });
    mocks.createRecord.mockResolvedValue({ id: "media_new", publicUrl: "https://cdn.example/identity.jpg" });
    mocks.createAudit.mockResolvedValue({ id: "audit_123" });
    mocks.serializableTransaction.mockImplementation(async callback => callback({
      mediaAsset: {
        findMany: mocks.findMany,
        updateMany: mocks.updateMany,
        create: mocks.createRecord,
      },
      auditEvent: { create: mocks.createAudit },
    }));
  });

  it("serializes identity creation around the target identity predicate", async () => {
    const form = new FormData();
    form.set("target", "cause:cause_1");
    form.set("publicUrl", "https://cdn.example/identity.jpg");
    form.set("kind", "IMAGE");
    form.set("altText", "Amaana programme identity photograph");
    form.set("identityImage", "on");

    await createMediaAsset(form);

    expect(mocks.serializableTransaction).toHaveBeenCalledTimes(1);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        kind: "IMAGE",
        sortOrder: -1000,
        causeId: "cause_1",
      }),
      select: { id: true },
    }));
    expect(mocks.findMany.mock.invocationCallOrder[0]).toBeLessThan(mocks.updateMany.mock.invocationCallOrder[0]);
    expect(mocks.updateMany.mock.invocationCallOrder[0]).toBeLessThan(mocks.createRecord.mock.invocationCallOrder[0]);
    expect(mocks.createRecord).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ sortOrder: -1000, isPublic: false, causeId: "cause_1" }),
    }));
    expect(mocks.createAudit).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "media.created", entityId: "media_new" }),
    });
  });
});

describe("published media editing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "user_123" });
  });

  it("rejects a stale same-state metadata edit before demoting another identity asset", async () => {
    const renderedAt = new Date("2026-09-23T00:00:00.000Z");
    const newerAt = new Date("2026-09-23T00:01:00.000Z");
    mocks.findUniqueOrThrow.mockResolvedValue({
      id: "media_123", kind: "IMAGE", isPublic: false,
      title: null, altText: "Documentary photograph", caption: null, sourcePath: null, sourceYear: null,
      publicUrl: "https://cdn.example/original.jpg", storageKey: null,
      sortOrder: 0, causeId: "cause_1", initiativeId: null, storyId: null, faithContentId: null,
      updatedAt: newerAt,
    });
    mocks.serializableTransaction.mockImplementation(async callback => callback({
      mediaAsset: { findUniqueOrThrow: mocks.findUniqueOrThrow, updateMany: mocks.updateMany },
      auditEvent: { create: mocks.createAudit },
    }));

    await expect(updateMediaAsset(updateForm({ identityImage: "on", expectedUpdatedAt: renderedAt.toISOString() })))
      .rejects.toThrow(/changed while you were reviewing/i);
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.createAudit).not.toHaveBeenCalled();
  });

  it("requires unpublishing before changing a published delivery URL", async () => {
    mocks.findUniqueOrThrow.mockResolvedValue({
      id: "media_123", kind: "IMAGE", isPublic: true,
      publicUrl: "https://cdn.example/original.jpg", storageKey: null,
      sortOrder: 0, causeId: "cause_1", initiativeId: null, storyId: null, faithContentId: null,
    });

    await expect(updateMediaAsset(updateForm({ publicUrl: "https://cdn.example/replacement.jpg" }))).rejects.toThrow(/unpublish.*delivery URL/i);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("requires unpublishing before changing published privacy or provenance metadata", async () => {
    mocks.findUniqueOrThrow.mockResolvedValue({
      id: "media_123", kind: "IMAGE", isPublic: true,
      title: null, altText: "Documentary photograph", caption: null, sourcePath: null, sourceYear: null,
      publicUrl: "https://cdn.example/original.jpg", storageKey: null,
      sortOrder: 0, causeId: "cause_1", initiativeId: null, storyId: null, faithContentId: null,
    });

    await expect(updateMediaAsset(updateForm({ caption: "A newly identifying public caption" }))).rejects.toThrow(/unpublish.*metadata/i);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("requires unpublishing before promoting published media to identity use", async () => {
    mocks.findUniqueOrThrow.mockResolvedValue({
      id: "media_123", kind: "IMAGE", isPublic: true,
      publicUrl: "https://cdn.example/original.jpg", storageKey: null,
      sortOrder: 0, causeId: "cause_1", initiativeId: null, storyId: null, faithContentId: null,
    });

    await expect(updateMediaAsset(updateForm({ identityImage: "on" }))).rejects.toThrow(/unpublish.*identity-image/i);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

describe("media publication concurrency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "approver_123" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.createAudit.mockResolvedValue({ id: "audit_123" });
    mocks.serializableTransaction.mockImplementation(async callback => callback({
      mediaAsset: { findUniqueOrThrow: mocks.findUniqueOrThrow, updateMany: mocks.updateMany },
      auditEvent: { create: mocks.createAudit },
    }));
  });

  it("revalidates the asset inside the serialized privacy-publication boundary", async () => {
    mocks.findUniqueOrThrow
      .mockResolvedValueOnce({ id: "media_123", kind: "IMAGE", isPublic: false, publicUrl: "https://cdn.example/media.jpg", altText: "Documentary image", sortOrder: 0 })
      .mockResolvedValueOnce({ id: "media_123", kind: "IMAGE", isPublic: true, publicUrl: "https://cdn.example/media.jpg", altText: "Documentary image", sortOrder: 0, updatedAt: new Date() });
    const formData = new FormData();
    formData.set("id", "media_123");
    formData.set("publish", "true");

    await expect(setMediaPublication(formData)).rejects.toThrow(/already published/i);
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.createAudit).not.toHaveBeenCalled();
  });

  it("atomically unpublishes and audits a currently public asset", async () => {
    const updatedAt = new Date("2026-09-23T00:00:00.000Z");
    mocks.findUniqueOrThrow
      .mockResolvedValueOnce({ id: "media_123", kind: "IMAGE", isPublic: true, publicUrl: "https://cdn.example/media.jpg", altText: "Documentary image", sortOrder: 0 })
      .mockResolvedValueOnce({ isPublic: true, updatedAt });
    const formData = new FormData();
    formData.set("id", "media_123");
    formData.set("publish", "false");

    await setMediaPublication(formData);

    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "media_123", isPublic: true, updatedAt },
      data: { isPublic: false, privacyApprovedAt: null },
    });
    expect(mocks.createAudit).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "media.unpublished", entityId: "media_123" }) });
  });

  it("does not duplicate an unpublication audit when another admin wins the race", async () => {
    const updatedAt = new Date("2026-09-23T00:00:00.000Z");
    mocks.findUniqueOrThrow
      .mockResolvedValueOnce({ id: "media_123", kind: "IMAGE", isPublic: true, publicUrl: "https://cdn.example/media.jpg", altText: "Documentary image", sortOrder: 0 })
      .mockResolvedValueOnce({ isPublic: true, updatedAt });
    mocks.updateMany.mockResolvedValueOnce({ count: 0 });
    const formData = new FormData();
    formData.set("id", "media_123");
    formData.set("publish", "false");

    await expect(setMediaPublication(formData)).rejects.toThrow(/changed while you were reviewing/i);
    expect(mocks.createAudit).not.toHaveBeenCalled();
  });

  it("fails closed when the reviewed media changes before the publication claim", async () => {
    const updatedAt = new Date("2026-09-23T00:00:00.000Z");
    mocks.findUniqueOrThrow
      .mockResolvedValueOnce({ id: "media_123", kind: "IMAGE", isPublic: false, publicUrl: "https://cdn.example/media.jpg", altText: "Documentary image", sortOrder: 0 })
      .mockResolvedValueOnce({ id: "media_123", kind: "IMAGE", isPublic: false, publicUrl: "https://cdn.example/media.jpg", altText: "Documentary image", sortOrder: 0, updatedAt });
    mocks.updateMany.mockResolvedValueOnce({ count: 0 });
    const formData = new FormData();
    formData.set("id", "media_123");
    formData.set("publish", "true");

    await expect(setMediaPublication(formData)).rejects.toThrow(/changed while you were reviewing/i);
    expect(mocks.createAudit).not.toHaveBeenCalled();
  });
});

describe("admin media deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "user_123" });
    mocks.deletePublicMediaObject.mockResolvedValue(undefined);
    mocks.deleteRecord.mockResolvedValue({ id: "media_123" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
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

  it("blocks deletion if another admin republishes the media before storage mutation", async () => {
    mocks.findUniqueOrThrow
      .mockResolvedValueOnce({
        id: "media_123", isPublic: false,
        storageKey: "2026/11111111-1111-4111-8111-111111111111.jpg",
        publicUrl: "https://cdn.example/media.jpg", title: "Unpublished", sourcePath: "IMG.jpg", updatedAt: new Date("2026-09-23T00:00:00.000Z"),
      })
      .mockResolvedValueOnce({
        isPublic: true,
        storageKey: "2026/11111111-1111-4111-8111-111111111111.jpg",
        publicUrl: "https://cdn.example/media.jpg",
        updatedAt: new Date("2026-09-23T00:00:00.000Z"),
      });

    await expect(deleteMediaAsset(deletionForm())).rejects.toThrow(/published while you were reviewing/i);
    expect(mocks.deletePublicMediaObject).not.toHaveBeenCalled();
    expect(mocks.createAudit).not.toHaveBeenCalled();
  });

  it("blocks deletion if the managed object changes before storage mutation", async () => {
    mocks.findUniqueOrThrow
      .mockResolvedValueOnce({
        id: "media_123", isPublic: false,
        storageKey: "2026/old.jpg", publicUrl: "https://cdn.example/old.jpg",
        title: "Unpublished", sourcePath: "IMG.jpg", updatedAt: new Date("2026-09-23T00:00:00.000Z"),
      })
      .mockResolvedValueOnce({
        isPublic: false,
        storageKey: "2026/replacement.jpg",
        publicUrl: "https://cdn.example/replacement.jpg",
        updatedAt: new Date("2026-09-23T00:01:00.000Z"),
      });

    await expect(deleteMediaAsset(deletionForm())).rejects.toThrow(/changed while you were reviewing/i);
    expect(mocks.deletePublicMediaObject).not.toHaveBeenCalled();
    expect(mocks.createAudit).not.toHaveBeenCalled();
  });

  it("deletes managed storage before atomically removing an unpublished record and recording the audit", async () => {
    mocks.findUniqueOrThrow
      .mockResolvedValueOnce({
        id: "media_123",
        isPublic: false,
        storageKey: "2026/11111111-1111-4111-8111-111111111111.jpg",
        publicUrl: "https://cdn.example/media.jpg",
        title: "Unpublished",
        sourcePath: "IMG.jpg",
        updatedAt: new Date("2026-09-23T00:00:00.000Z"),
      })
      .mockResolvedValueOnce({
        isPublic: false,
        storageKey: "2026/11111111-1111-4111-8111-111111111111.jpg",
        publicUrl: "https://cdn.example/media.jpg",
        updatedAt: new Date("2026-09-23T00:00:00.000Z"),
      });

    await deleteMediaAsset(deletionForm());

    expect(mocks.requirePermission).toHaveBeenCalledWith("content.approve");
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: "media_123", isPublic: false }),
      data: expect.objectContaining({ updatedAt: expect.any(Date) }),
    }));
    expect(mocks.deletePublicMediaObject).toHaveBeenCalledWith("2026/11111111-1111-4111-8111-111111111111.jpg");
    expect(mocks.deleteRecord).toHaveBeenCalledWith({ where: { id: "media_123" } });
    expect(mocks.createAudit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "media.deletion_started", entityId: "media_123", actorId: "user_123" }),
    }));
    expect(mocks.createAudit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "media.deleted", entityId: "media_123", actorId: "user_123" }),
    }));
    for (const [arg] of mocks.createAudit.mock.calls) {
      if (arg?.data?.action === "media.deletion_started" || arg?.data?.action === "media.deleted") {
        expect(arg.data.metadata).not.toHaveProperty("title");
        expect(arg.data.metadata).not.toHaveProperty("sourcePath");
      }
    }
    expect(mocks.createAudit.mock.invocationCallOrder[0]).toBeLessThan(mocks.deletePublicMediaObject.mock.invocationCallOrder[0]);
    expect(mocks.deletePublicMediaObject.mock.invocationCallOrder[0]).toBeLessThan(mocks.transaction.mock.invocationCallOrder[0]);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/media");
  });
});
