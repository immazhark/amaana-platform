import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  createRecord: vi.fn(),
  deleteRecord: vi.fn(),
  updateRecord: vi.fn(),
  updateMany: vi.fn(),
  createAudit: vi.fn(),
  transaction: vi.fn(),
  serializableTransaction: vi.fn(),
  deletePublicMediaObject: vi.fn(),
  uploadPublicMediaFile: vi.fn(),
  revalidatePath: vi.fn(), redirect: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
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
  uploadPublicMediaFile: mocks.uploadPublicMediaFile,
  validatePublicMediaFile: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    mediaAsset: {
      findUniqueOrThrow: mocks.findUniqueOrThrow,
      findFirst: mocks.findFirst,
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

  it("rejects a manual URL that could override an uploaded managed file", async () => {
    const form = new FormData();
    form.set("target", "initiative:initiative_1");
    form.set("file", new File(["synthetic"], "image.png", { type: "image/png" }));
    form.set("publicUrl", "https://cdn.example.org/unapproved-photo.png");
    form.set("altText", "Synthetic evidence");

    await expect(createMediaAsset(form)).rejects.toThrow(/either a managed upload or a reviewed external URL/i);
    expect(mocks.uploadPublicMediaFile).not.toHaveBeenCalled();
    expect(mocks.serializableTransaction).not.toHaveBeenCalled();
    expect(mocks.createRecord).not.toHaveBeenCalled();
  });

  it("persists managed media through the consent-gated local proxy and starts unpublished", async () => {
    const storageKey = "2026/123e4567-e89b-12d3-a456-426614174000.png";
    mocks.uploadPublicMediaFile.mockResolvedValueOnce({
      objectKey: storageKey,
      publicUrl: "/media/" + storageKey,
      originalName: "image.png",
      width: 1,
      height: 1,
      blurDataURL: "data:image/jpeg;base64,/9j/AAAA",
    });
    const form = new FormData();
    form.set("target", "initiative:initiative_1");
    form.set("file", new File(["synthetic"], "image.png", { type: "image/png" }));
    form.set("altText", "Synthetic document image");
    await createMediaAsset(form);

    expect(mocks.createRecord).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        publicUrl: "/media/" + storageKey,
        storageKey,
        blurDataURL: "data:image/jpeg;base64,/9j/AAAA",
        isPublic: false,
        initiativeId: "initiative_1",
      }),
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
    const findOrder = mocks.findMany.mock.invocationCallOrder[0];
    const updateOrder = mocks.updateMany.mock.invocationCallOrder[0];
    const createOrder = mocks.createRecord.mock.invocationCallOrder[0];
    if (findOrder === undefined || updateOrder === undefined || createOrder === undefined) throw new Error("Expected media creation call ordering.");
    expect(findOrder).toBeLessThan(updateOrder);
    expect(updateOrder).toBeLessThan(createOrder);
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
    mocks.findMany.mockReset();
    mocks.findMany.mockResolvedValue([]);
    mocks.requirePermission.mockResolvedValue({ id: "approver_123" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.createAudit.mockResolvedValue({ id: "audit_123" });
    mocks.serializableTransaction.mockImplementation(async callback => callback({
      mediaAsset: { findUniqueOrThrow: mocks.findUniqueOrThrow, findMany: mocks.findMany, updateMany: mocks.updateMany },
      auditEvent: { create: mocks.createAudit },
    }));
  });

  it("refuses publication of a managed file pointing to an unreviewed CDN", async () => {
    mocks.findUniqueOrThrow.mockResolvedValueOnce({
      id: "media_123",
      kind: "IMAGE",
      isPublic: false,
      storageKey: "2026/123e4567-e89b-12d3-a456-426614174000.webp",
      publicUrl: "https://cdn.example.org/123e4567-e89b-12d3-a456-426614174000.webp",
      altText: "Synthetic documentary photo",
      sortOrder: 0,
    });
    const form = new FormData();
    form.set("id", "media_123");
    form.set("publish", "true");

    await expect(setMediaPublication(form)).rejects.toThrow(/consent-gated \/media\/ route/i);
    expect(mocks.serializableTransaction).not.toHaveBeenCalled();
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("rejects a CDN delivery swap detected during the publication transaction", async () => {
    const key = "2026/123e4567-e89b-12d3-a456-426614174000.webp";
    mocks.findUniqueOrThrow
      .mockResolvedValueOnce({
        id: "media_123", kind: "IMAGE", isPublic: false,
        storageKey: key, publicUrl: "/media/" + key,
        altText: "Synthetic documentary photo", sortOrder: 0,
      })
      .mockResolvedValueOnce({
        id: "media_123", kind: "IMAGE", isPublic: false,
        storageKey: key, publicUrl: "https://cdn.example.org/photo.webp",
        altText: "Synthetic documentary photo", sortOrder: 0,
      });
    const form = new FormData();
    form.set("id", "media_123");
    form.set("publish", "true");

    await expect(setMediaPublication(form)).rejects.toThrow(/delivery changed.*consent-gated/i);
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.createAudit).not.toHaveBeenCalled();
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

  it("atomically unpublishes every public record sharing a managed storage object and audits each revocation", async () => {
    const updatedAt = new Date("2026-10-17T00:00:00.000Z");
    const key = "2026/123e4567-e89b-12d3-a456-426614174000.webp";
    const url = "/media/" + key;
    const target = { id: "media_123", isPublic: true, updatedAt, storageKey: key, publicUrl: url,
      initiative: { slug: "primary-initiative" }, cause: null, story: null, faithContent: null };
    const sibling = { id: "media_shared", updatedAt, storageKey: key, publicUrl: "https://amaanafoundation.org/media/" + key,
      initiative: { slug: "secondary-initiative" }, cause: null, story: null, faithContent: null };
    mocks.findUniqueOrThrow.mockResolvedValueOnce(target).mockResolvedValueOnce(target);
    mocks.findMany.mockResolvedValueOnce([sibling]);
    const form = new FormData(); form.set("id", target.id); form.set("publish", "false");
    await setMediaPublication(form);
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { id: { not: target.id }, isPublic: true, OR: [{ storageKey: key }, { publicUrl: url }] },
      select: expect.objectContaining({
        id: true, updatedAt: true, storageKey: true, publicUrl: true,
        initiative: { select: { slug: true } },
      }),
    });
    expect(mocks.updateMany).toHaveBeenCalledTimes(2);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "media_shared", isPublic: true, updatedAt },
      data: { isPublic: false, privacyApprovedAt: null },
    });
    expect(mocks.createAudit).toHaveBeenCalledWith({ data: expect.objectContaining({
      action: "media.unpublished_shared_reference", entityId: "media_shared",
      metadata: { sourceMediaId: target.id },
    }) });
    for (const path of ["/media/" + key, "/our-work/primary-initiative", "/our-work/secondary-initiative",
      "/media-archive/initiative/secondary-initiative"]) {
      expect(mocks.revalidatePath).toHaveBeenCalledWith(path);
    }
  });

  it("revokes separate public references using the same external photograph URL", async () => {
    const updatedAt = new Date("2026-10-17T00:00:00.000Z");
    const url = "https://cdn.example.org/approved-cover.webp";
    mocks.findUniqueOrThrow.mockResolvedValueOnce({ id: "media_123", isPublic: true, publicUrl: url, storageKey: null, updatedAt })
      .mockResolvedValueOnce({ id: "media_123", isPublic: true, publicUrl: url, storageKey: null, updatedAt });
    mocks.findMany.mockResolvedValueOnce([{ id: "media_shared", updatedAt, storageKey: null, publicUrl: url }]);
    const form = new FormData(); form.set("id", "media_123"); form.set("publish", "false");
    await setMediaPublication(form);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: { not: "media_123" }, isPublic: true, OR: [{ publicUrl: url }] },
    }));
    expect(mocks.updateMany).toHaveBeenCalledTimes(2);
  });

  it("rolls back all alias unpublications if one shared record changed while reviewing", async () => {
    const updatedAt = new Date("2026-10-17T00:00:00.000Z");
    const key = "2026/123e4567-e89b-12d3-a456-426614174000.webp";
    const target = { id: "media_123", isPublic: true, updatedAt, storageKey: key, publicUrl: "/media/" + key };
    mocks.findUniqueOrThrow.mockResolvedValueOnce(target).mockResolvedValueOnce(target);
    mocks.findMany.mockResolvedValueOnce([{ id: "media_shared", updatedAt, storageKey: key, publicUrl: "/media/" + key }]);
    mocks.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    const form = new FormData(); form.set("id", "media_123"); form.set("publish", "false");
    await expect(setMediaPublication(form)).rejects.toThrow(/changed while you were reviewing/i);
    expect(mocks.createAudit).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
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

describe("committed media publication refresh integrity", () => {
  const updatedAt = new Date("2026-10-17T00:00:00.000Z");
  const key = "2026/123e4567-e89b-12d3-a456-426614174000.webp";
  const asset = {
    id: "media_123", kind: "IMAGE", isPublic: true,
    storageKey: key, publicUrl: "/media/" + key, altText: "Approved evidence",
    sortOrder: 0, initiative: { slug: "winter-relief-2025" },
    cause: { slug: "seasonal-relief" }, story: null, faithContent: null,
  };
  const publicationForm = () => {
    const data = new FormData();
    data.set("id", asset.id);
    data.set("publish", "false");
    return data;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findMany.mockReset();
    mocks.findMany.mockResolvedValue([]);
    mocks.requirePermission.mockResolvedValue({ id: "reviewer_123" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.createAudit.mockResolvedValue({ id: "audit_123" });
    mocks.findUniqueOrThrow
      .mockResolvedValueOnce(asset)
      .mockResolvedValueOnce({ isPublic: true, updatedAt });
    mocks.serializableTransaction.mockImplementation(async callback => callback({
      mediaAsset: { findUniqueOrThrow: mocks.findUniqueOrThrow, findMany: mocks.findMany, updateMany: mocks.updateMany },
      auditEvent: { create: mocks.createAudit },
    }));
    mocks.redirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });
  });

  it("invalidates both specific detail/archives and managed delivery after a successful unpublication", async () => {
    await setMediaPublication(publicationForm());
    for (const path of [
      "/admin/media", "/", "/our-work", "/impact", "/stories", "/faith-and-reflections",
      "/appeals", "/media/" + key, "/our-work/winter-relief-2025", "/our-work/seasonal-relief",
      "/media-archive/initiative/winter-relief-2025",
    ]) expect(mocks.revalidatePath).toHaveBeenCalledWith(path);
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.createAudit).toHaveBeenCalledOnce();
    expect(mocks.updateMany).toHaveBeenCalledOnce();
  });

  it("does not misreport a committed withdrawal as a transaction failure when a refresh throws", async () => {
    mocks.revalidatePath.mockImplementation(path => {
      if (path === "/") throw new Error("cache unavailable");
    });
    await expect(setMediaPublication(publicationForm())).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.updateMany).toHaveBeenCalledOnce();
    expect(mocks.createAudit).toHaveBeenCalledOnce();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/media/" + key);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/media-archive/initiative/winter-relief-2025");
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/media?saved=refresh-delayed");
    expect(mocks.createAudit.mock.invocationCallOrder[0]).toBeLessThan(mocks.revalidatePath.mock.invocationCallOrder[0]!);
  });

  it("does not revalidate or report committed success after transaction failure", async () => {
    mocks.serializableTransaction.mockRejectedValueOnce(new Error("failed transaction"));
    await expect(setMediaPublication(publicationForm())).rejects.toThrow("failed transaction");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("refreshes story and faith detail archives when their reviewed media changes", async () => {
    const storyAsset = {
      ...asset, storageKey: null, publicUrl: "https://cdn.example.org/documentary.jpg",
      initiative: null, cause: null,
      story: { slug: "completed-support" },
      faithContent: { slug: "reflection" },
    };
    mocks.findUniqueOrThrow.mockReset()
      .mockResolvedValueOnce(storyAsset)
      .mockResolvedValueOnce({ isPublic: true, updatedAt });
    await setMediaPublication(publicationForm());
    for (const path of [
      "/stories/completed-support", "/media-archive/story/completed-support",
      "/faith-and-reflections/reflection", "/media-archive/faith/reflection",
    ]) expect(mocks.revalidatePath).toHaveBeenCalledWith(path);
  });
});

describe("committed media draft refresh integrity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "editor_123" });
    mocks.redirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });
    mocks.revalidatePath.mockImplementation(path => {
      if (path === "/admin/media") throw new Error("cache unreachable");
    });
  });

  it("does not erase a created managed object or replay its audit after a committed create", async () => {
    mocks.uploadPublicMediaFile.mockResolvedValue({
      objectKey: "2026/123e4567-e89b-12d3-a456-426614174000.webp",
      publicUrl: "/media/2026/123e4567-e89b-12d3-a456-426614174000.webp",
      originalName: "evidence.webp",
      width: 10, height: 10, blurDataURL: null,
    });
    mocks.createRecord.mockResolvedValue({ id: "new-media" });
    mocks.serializableTransaction.mockImplementation(async callback => callback({
      mediaAsset: { findMany: mocks.findMany, updateMany: mocks.updateMany, create: mocks.createRecord },
      auditEvent: { create: mocks.createAudit },
    }));
    const form = new FormData();
    form.set("target", "initiative:initiative-1");
    form.set("file", new File(["synthetic"], "evidence.webp", { type: "image/webp" }));
    form.set("altText", "A consent-reviewed initiative photograph");
    await expect(createMediaAsset(form)).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.createRecord).toHaveBeenCalledOnce();
    expect(mocks.createAudit).toHaveBeenCalledOnce();
    expect(mocks.deletePublicMediaObject).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/media?saved=refresh-delayed");
  });

  it("does not return a false failed-edit response after an audited metadata update", async () => {
    const updatedAt = new Date("2026-09-23T00:00:00.000Z");
    mocks.findUniqueOrThrow.mockResolvedValue({
      id: "media_123", kind: "IMAGE", isPublic: false, updatedAt,
      title: null, altText: "Documentary photograph", caption: null,
      sourcePath: null, sourceYear: null, publicUrl: "https://cdn.example/original.jpg",
      storageKey: null, sortOrder: 0, causeId: "cause_1",
      initiativeId: null, storyId: null, faithContentId: null,
    });
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.serializableTransaction.mockImplementation(async callback => callback({
      mediaAsset: { findUniqueOrThrow: mocks.findUniqueOrThrow, updateMany: mocks.updateMany },
      auditEvent: { create: mocks.createAudit },
    }));
    await expect(updateMediaAsset(updateForm())).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.updateMany).toHaveBeenCalledOnce();
    expect(mocks.createAudit).toHaveBeenCalledOnce();
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/media?saved=refresh-delayed");
  });
});

describe("admin media deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "user_123" });
    mocks.deletePublicMediaObject.mockResolvedValue(undefined);
    mocks.deleteRecord.mockResolvedValue({ id: "media_123" });
    mocks.findFirst.mockResolvedValue(null);
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

  it.each([
    ["published", true],
    ["unpublished", false],
  ])("refuses object deletion when another %s media record shares its managed storage key", async (_label, isPublic) => {
    const current = {
      id: "media_123", isPublic: false,
      storageKey: "2026/11111111-1111-4111-8111-111111111111.jpg",
      publicUrl: "/media/2026/11111111-1111-4111-8111-111111111111.jpg",
      updatedAt: new Date("2026-09-23T00:00:00.000Z"),
    };
    mocks.findUniqueOrThrow.mockResolvedValue(current);
    mocks.findFirst.mockResolvedValue({ id: "shared-asset", isPublic });
    await expect(deleteMediaAsset(deletionForm())).rejects.toThrow(/shared.*storage object/i);
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        storageKey: current.storageKey,
        id: { not: "media_123" },
      },
      select: { id: true },
    });
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.deletePublicMediaObject).not.toHaveBeenCalled();
    expect(mocks.createAudit).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("blocks a newly discovered storage-key alias after the deletion claim and before object removal", async () => {
    mocks.findUniqueOrThrow.mockResolvedValue({
      id: "media_123", isPublic: false,
      storageKey: "2026/11111111-1111-4111-8111-111111111111.jpg",
      publicUrl: "/media/2026/11111111-1111-4111-8111-111111111111.jpg",
      updatedAt: new Date("2026-09-23T00:00:00.000Z"),
    });
    mocks.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "racing-alias" });
    await expect(deleteMediaAsset(deletionForm())).rejects.toThrow(/shared.*storage object/i);
    expect(mocks.findFirst).toHaveBeenCalledTimes(2);
    expect(mocks.updateMany).toHaveBeenCalledOnce();
    expect(mocks.deletePublicMediaObject).not.toHaveBeenCalled();
    expect(mocks.createAudit).not.toHaveBeenCalled();
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

  it("does not claim permanent media deletion failed after storage and database records were removed", async () => {
    const state = {
      id: "media_123", isPublic: false,
      storageKey: "2026/11111111-1111-4111-8111-111111111111.jpg",
      publicUrl: "/media/2026/11111111-1111-4111-8111-111111111111.jpg",
      updatedAt: new Date("2026-09-23T00:00:00.000Z"),
    };
    mocks.findUniqueOrThrow.mockResolvedValue(state);
    mocks.revalidatePath.mockImplementation(path => {
      if (path === "/admin/media") throw new Error("cache offline");
    });
    mocks.redirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });

    await expect(deleteMediaAsset(deletionForm())).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.deletePublicMediaObject).toHaveBeenCalledOnce();
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/media/2026/11111111-1111-4111-8111-111111111111.jpg");
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/media?saved=refresh-delayed");
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
    const auditOrder = mocks.createAudit.mock.invocationCallOrder[0];
    const deleteObjectOrder = mocks.deletePublicMediaObject.mock.invocationCallOrder[0];
    const transactionOrder = mocks.transaction.mock.invocationCallOrder[0];
    if (auditOrder === undefined || deleteObjectOrder === undefined || transactionOrder === undefined) throw new Error("Expected media deletion call ordering.");
    expect(auditOrder).toBeLessThan(deleteObjectOrder);
    expect(deleteObjectOrder).toBeLessThan(transactionOrder);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/media");
  });
});
