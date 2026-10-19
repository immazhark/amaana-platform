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
  uploadPublicMediaFile: vi.fn(),
  revalidatePath: vi.fn(),
  parseReview: vi.fn<(formData: FormData) => unknown>(() => ({})),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth", () => ({
  hasPermission: () => true,
  requirePermission: mocks.requirePermission,
}));
vi.mock("@/lib/prisma-transaction", () => ({ withSerializableTransactionRetry: mocks.serializableTransaction }));
vi.mock("@/lib/media-governance", () => ({
  mediaPublicationIssues: () => [],
  parseMediaPublicationReview: mocks.parseReview,
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
  formData.set("expectedUpdatedAt", "2026-09-23T00:00:00.000Z");
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

  it("rejects repeated and file-valued content targets before any storage or database work", async () => {
    for (const change of [
      (form: FormData) => form.append("target", "story:story_2"),
      (form: FormData) => form.set("target", new File(["fake"], "target.txt")),
    ]) {
      const form = new FormData();
      form.set("target", "initiative:initiative_1");
      form.set("publicUrl", "https://cdn.example/identity.jpg");
      form.set("altText", "Reviewed image");
      change(form);
      await expect(createMediaAsset(form)).rejects.toThrow(/single text target|single valid content target/i);
    }
    expect(mocks.uploadPublicMediaFile).not.toHaveBeenCalled();
    expect(mocks.createRecord).not.toHaveBeenCalled();
    expect(mocks.serializableTransaction).not.toHaveBeenCalled();
  });

  it.each([
    "initiative:initiative_1:unexpected",
    "initiative:",
    "initiative: ",
    "unknown:initiative_1",
  ])("rejects malformed content target %s", async target => {
    const form = new FormData();
    form.set("target", target);
    form.set("publicUrl", "https://cdn.example/identity.jpg");
    form.set("altText", "Reviewed image");
    await expect(createMediaAsset(form)).rejects.toThrow(/valid content target|unsupported content target/i);
    expect(mocks.createRecord).not.toHaveBeenCalled();
  });

  it("rejects duplicate or file-valued media kind before creating a record", async () => {
    for (const change of [
      (form: FormData) => form.append("kind", "DOCUMENT"),
      (form: FormData) => form.set("kind", new File(["fake"], "kind.txt")),
      (form: FormData) => form.set("kind", "VIDEO"),
    ]) {
      const form = new FormData();
      form.set("target", "initiative:initiative_1");
      form.set("kind", "IMAGE");
      form.set("publicUrl", "https://cdn.example/identity.jpg");
      form.set("altText", "Reviewed image");
      change(form);
      await expect(createMediaAsset(form)).rejects.toThrow(/single text kind|media type/i);
    }
    expect(mocks.uploadPublicMediaFile).not.toHaveBeenCalled();
    expect(mocks.createRecord).not.toHaveBeenCalled();
  });

  it("rejects ambiguous public URL, file, and alt text before storage or database effects", async () => {
    const cases: Array<(form: FormData) => void> = [
      form => form.append("publicUrl", "https://cdn.example/another.jpg"),
      form => form.set("publicUrl", new File(["fake"], "url.txt")),
      form => form.set("altText", new File(["fake"], "alt.txt")),
      form => form.append("altText", "Different alt"),
      form => form.set("file", "not-a-file"),
      form => {
        form.set("file", new File(["synthetic"], "photo.png", { type: "image/png" }));
        form.append("file", new File(["synthetic"], "other.png", { type: "image/png" }));
      },
    ];
    for (const change of cases) {
      const form = new FormData();
      form.set("target", "initiative:initiative_1");
      form.set("kind", "IMAGE");
      form.set("publicUrl", "https://cdn.example/identity.jpg");
      form.set("altText", "Reviewed image");
      change(form);
      await expect(createMediaAsset(form)).rejects.toThrow(/single (text|file)/i);
    }
    expect(mocks.uploadPublicMediaFile).not.toHaveBeenCalled();
    expect(mocks.serializableTransaction).not.toHaveBeenCalled();
    expect(mocks.createRecord).not.toHaveBeenCalled();
  });

  it.each(["title", "caption", "sourcePath", "sourceYear", "sortOrder"])(
    "rejects ambiguous managed-upload %s metadata before uploading",
    async field => {
      const form = new FormData();
      form.set("target", "initiative:initiative_1");
      form.set("kind", "IMAGE");
      form.set("file", new File(["synthetic"], "image.png", { type: "image/png" }));
      form.set("altText", "Documentary photograph");
      form.set(field, "original");
      form.append(field, "altered");
      await expect(createMediaAsset(form)).rejects.toThrow(new RegExp(`single text ${field}`, "i"));
      expect(mocks.uploadPublicMediaFile).not.toHaveBeenCalled();
      expect(mocks.serializableTransaction).not.toHaveBeenCalled();
      expect(mocks.createRecord).not.toHaveBeenCalled();
    },
  );

  it("does not silently reinterpret an uploaded PDF as a document when Image was selected", async () => {
    const form = new FormData();
    form.set("target", "initiative:initiative_1");
    form.set("kind", "IMAGE");
    form.set("file", new File(["synthetic"], "private.pdf", { type: "application/pdf" }));
    form.set("altText", "Documentary photograph");
    await expect(createMediaAsset(form)).rejects.toThrow(/image media must use JPEG, PNG or WebP/i);
    expect(mocks.uploadPublicMediaFile).not.toHaveBeenCalled();
    expect(mocks.createRecord).not.toHaveBeenCalled();
  });

  it("rejects an ambiguous hero checkbox instead of silently applying a hero change", async () => {
    const form = new FormData();
    form.set("target", "initiative:initiative_1");
    form.set("publicUrl", "https://cdn.example/identity.jpg");
    form.set("altText", "Reviewed image");
    form.set("identityImage", "on");
    form.append("identityImage", "on");
    await expect(createMediaAsset(form)).rejects.toThrow(/single text identityImage/i);
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.createRecord).not.toHaveBeenCalled();
  });

  it.each(["1999", "2101", "-1", "2026.5", "NaN", "2026junk"])(
    "rejects invalid source year %s before managed storage or database effects",
    async sourceYear => {
      const form = new FormData();
      form.set("target", "initiative:initiative_1");
      form.set("kind", "IMAGE");
      form.set("file", new File(["synthetic"], "image.png", { type: "image/png" }));
      form.set("altText", "Reviewed photograph");
      form.set("sourceYear", sourceYear);

      await expect(createMediaAsset(form)).rejects.toThrow(/valid sourceYear/i);
      expect(mocks.uploadPublicMediaFile).not.toHaveBeenCalled();
      expect(mocks.serializableTransaction).not.toHaveBeenCalled();
      expect(mocks.createRecord).not.toHaveBeenCalled();
    },
  );

  it.each(["-1", "1.5", "2147483648", "Infinity", "invalid"])(
    "rejects invalid supporting image order %s instead of silently resetting it",
    async sortOrder => {
      const form = new FormData();
      form.set("target", "story:story_1");
      form.set("publicUrl", "https://cdn.example/record.jpg");
      form.set("altText", "Reviewed documentary photograph");
      form.set("sortOrder", sortOrder);

      await expect(createMediaAsset(form)).rejects.toThrow(/valid sortOrder/i);
      expect(mocks.uploadPublicMediaFile).not.toHaveBeenCalled();
      expect(mocks.serializableTransaction).not.toHaveBeenCalled();
      expect(mocks.createRecord).not.toHaveBeenCalled();
    },
  );

  it("preserves valid source year and sort order at their supported boundaries", async () => {
    const form = new FormData();
    form.set("target", "story:story_1");
    form.set("publicUrl", "https://cdn.example/record.jpg");
    form.set("altText", "Reviewed documentary photograph");
    form.set("sourceYear", "2100");
    form.set("sortOrder", "2147483647");

    await createMediaAsset(form);

    expect(mocks.createRecord).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ sourceYear: 2100, sortOrder: 2147483647, isPublic: false }),
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

describe("media publication command input", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "approver_123" });
    mocks.findUniqueOrThrow.mockResolvedValue({
      id: "media_123", kind: "IMAGE", isPublic: true,
      publicUrl: "/media/photo.jpg", altText: "Reviewed photograph", sortOrder: 0,
      updatedAt: new Date("2026-10-19T00:00:00.000Z"),
    });
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.serializableTransaction.mockImplementation(async callback => callback({
      mediaAsset: { findUniqueOrThrow: mocks.findUniqueOrThrow, updateMany: mocks.updateMany },
      auditEvent: { create: mocks.createAudit },
    }));
  });

  function publicationForm() {
    const form = new FormData();
    form.set("id", "media_123");
    form.set("publish", "false");
    form.set("expectedUpdatedAt", "2026-10-19T00:00:00.000Z");
    return form;
  }

  async function expectRejected(form: FormData) {
    await expect(setMediaPublication(form)).rejects.toThrow(/single.*media ID.*publication decision/i);
    expect(mocks.requirePermission).toHaveBeenCalledWith("content.approve");
    expect(mocks.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(mocks.serializableTransaction).not.toHaveBeenCalled();
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.createAudit).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  }

  it.each(["id", "publish"])("rejects repeated %s even when values agree", async field => {
    const form = publicationForm();
    form.append(field, field === "id" ? "media_123" : "false");
    await expectRejected(form);
  });

  it.each(["id", "publish"])("rejects conflicting %s values", async field => {
    const form = publicationForm();
    form.append(field, field === "id" ? "another_media" : "true");
    await expectRejected(form);
  });

  it.each(["id", "publish"])("rejects a file-valued %s", async field => {
    const form = publicationForm();
    form.set(field, new File(["invalid"], "command.txt"));
    await expectRejected(form);
  });

  it.each(["id", "publish"])("rejects missing %s", async field => {
    const form = publicationForm();
    form.delete(field);
    await expectRejected(form);
  });

  it.each(["", " ", "TRUE", " false ", "yes", "0"])(
    "rejects unsupported decision %j instead of unpublishing", async decision => {
      const form = publicationForm();
      form.set("publish", decision);
      await expectRejected(form);
    },
  );

  it.each(["", "   "])("rejects an empty media ID %j", async id => {
    const form = publicationForm();
    form.set("id", id);
    await expectRejected(form);
  });

  it.each(["duplicate consent", "file sensitivity", "invalid checkbox"])(
    "rejects %s through the real review parser before publication", async scenario => {
      const actual = await vi.importActual<typeof import("@/lib/media-governance")>("@/lib/media-governance");
      mocks.parseReview.mockImplementationOnce(actual.parseMediaPublicationReview);
      const form = publicationForm();
      form.set("publish", "true");
      form.set("privacyClass", "GREEN_PUBLIC");
      form.set("consentStatus", "DOCUMENTED");
      form.set("websiteApproved", "on");
      form.set("provenanceConfirmed", "on");
      if (scenario === "duplicate consent") form.append("consentStatus", "NOT_APPROVED");
      else if (scenario === "file sensitivity") form.set("containsPrivateDocument", new File(["invalid"], "review.txt"));
      else form.set("containsMinor", "false");

      await expect(setMediaPublication(form)).rejects.toThrow(/single text|checkbox/i);
      expect(mocks.serializableTransaction).not.toHaveBeenCalled();
      expect(mocks.updateMany).not.toHaveBeenCalled();
      expect(mocks.createAudit).not.toHaveBeenCalled();
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    },
  );
});

describe("media publication review version", () => {
  const reviewedAt = new Date("2026-10-19T00:00:00.000Z");
  const reviewedAsset = {
    id: "media_123", kind: "IMAGE", isPublic: false,
    publicUrl: "/media/reviewed.jpg", altText: "Reviewed photograph",
    sortOrder: 0, updatedAt: reviewedAt,
  };

  function form() {
    const data = new FormData();
    data.set("id", reviewedAsset.id);
    data.set("publish", "true");
    data.set("expectedUpdatedAt", reviewedAt.toISOString());
    return data;
  }

  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "approver_123" });
    mocks.findUniqueOrThrow.mockResolvedValue(reviewedAsset);
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.serializableTransaction.mockImplementation(async callback => callback({
      mediaAsset: { findUniqueOrThrow: mocks.findUniqueOrThrow, updateMany: mocks.updateMany },
      auditEvent: { create: mocks.createAudit },
    }));
  });

  it.each(["missing", "duplicate", "file", "invalid", "noncanonical"])(
    "rejects a %s review version before asset lookup", async scenario => {
      const data = form();
      if (scenario === "missing") data.delete("expectedUpdatedAt");
      else if (scenario === "duplicate") data.append("expectedUpdatedAt", reviewedAt.toISOString());
      else if (scenario === "file") data.set("expectedUpdatedAt", new File(["invalid"], "version.txt"));
      else data.set("expectedUpdatedAt", scenario === "invalid" ? "not-a-date" : "2026-10-19");
      await expect(setMediaPublication(data)).rejects.toThrow(/review version/i);
      expect(mocks.findUniqueOrThrow).not.toHaveBeenCalled();
      expect(mocks.serializableTransaction).not.toHaveBeenCalled();
      expect(mocks.createAudit).not.toHaveBeenCalled();
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    },
  );

  it("rejects metadata changed since the review form was rendered", async () => {
    mocks.findUniqueOrThrow.mockResolvedValue({ ...reviewedAsset, updatedAt: new Date(reviewedAt.getTime() + 1000) });
    await expect(setMediaPublication(form())).rejects.toThrow(/changed.*review/i);
    expect(mocks.serializableTransaction).not.toHaveBeenCalled();
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.createAudit).not.toHaveBeenCalled();
  });

  it("rejects a safe-looking image swap between lookup and transaction", async () => {
    mocks.findUniqueOrThrow.mockResolvedValueOnce(reviewedAsset).mockResolvedValueOnce({
      ...reviewedAsset, publicUrl: "/media/replacement.jpg", updatedAt: new Date(reviewedAt.getTime() + 1000),
    });
    await expect(setMediaPublication(form())).rejects.toThrow(/changed.*review/i);
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.createAudit).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("publishes and audits an unchanged reviewed version", async () => {
    await setMediaPublication(form());
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: reviewedAsset.id, isPublic: false, updatedAt: reviewedAt },
      data: { isPublic: true, privacyApprovedAt: expect.any(Date) },
    });
    expect(mocks.createAudit).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "media.published" }) });
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

  it("refuses publication of a managed file pointing to an unreviewed CDN", async () => {
    mocks.findUniqueOrThrow.mockResolvedValueOnce({
      id: "media_123",
      kind: "IMAGE",
      isPublic: false,
      storageKey: "2026/123e4567-e89b-12d3-a456-426614174000.webp",
      publicUrl: "https://cdn.example.org/123e4567-e89b-12d3-a456-426614174000.webp",
      altText: "Synthetic documentary photo",
      sortOrder: 0, updatedAt: new Date("2026-09-23T00:00:00.000Z"),
    });
    const form = new FormData();
    form.set("id", "media_123");
    form.set("publish", "true");
    form.set("expectedUpdatedAt", "2026-09-23T00:00:00.000Z");

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
        altText: "Synthetic documentary photo", sortOrder: 0, updatedAt: new Date("2026-09-23T00:00:00.000Z"),
      })
      .mockResolvedValueOnce({
        id: "media_123", kind: "IMAGE", isPublic: false,
        storageKey: key, publicUrl: "https://cdn.example.org/photo.webp",
        altText: "Synthetic documentary photo", sortOrder: 0, updatedAt: new Date("2026-09-23T00:00:00.000Z"),
      });
    const form = new FormData();
    form.set("id", "media_123");
    form.set("publish", "true");
    form.set("expectedUpdatedAt", "2026-09-23T00:00:00.000Z");

    await expect(setMediaPublication(form)).rejects.toThrow(/delivery changed.*consent-gated/i);
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.createAudit).not.toHaveBeenCalled();
  });

  it("revalidates the asset inside the serialized privacy-publication boundary", async () => {
    mocks.findUniqueOrThrow
      .mockResolvedValueOnce({ id: "media_123", kind: "IMAGE", isPublic: false, publicUrl: "https://cdn.example/media.jpg", altText: "Documentary image", sortOrder: 0, updatedAt: new Date("2026-09-23T00:00:00.000Z") })
      .mockResolvedValueOnce({ id: "media_123", kind: "IMAGE", isPublic: true, publicUrl: "https://cdn.example/media.jpg", altText: "Documentary image", sortOrder: 0, updatedAt: new Date() });
    const formData = new FormData();
    formData.set("id", "media_123");
    formData.set("publish", "true");
    formData.set("expectedUpdatedAt", "2026-09-23T00:00:00.000Z");

    await expect(setMediaPublication(formData)).rejects.toThrow(/already published/i);
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.createAudit).not.toHaveBeenCalled();
  });

  it("atomically unpublishes and audits a currently public asset", async () => {
    const updatedAt = new Date("2026-09-23T00:00:00.000Z");
    mocks.findUniqueOrThrow
      .mockResolvedValueOnce({ id: "media_123", kind: "IMAGE", isPublic: true, publicUrl: "https://cdn.example/media.jpg", altText: "Documentary image", sortOrder: 0, updatedAt: new Date("2026-09-23T00:00:00.000Z") })
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
      .mockResolvedValueOnce({ id: "media_123", kind: "IMAGE", isPublic: true, publicUrl: "https://cdn.example/media.jpg", altText: "Documentary image", sortOrder: 0, updatedAt: new Date("2026-09-23T00:00:00.000Z") })
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
      .mockResolvedValueOnce({ id: "media_123", kind: "IMAGE", isPublic: false, publicUrl: "https://cdn.example/media.jpg", altText: "Documentary image", sortOrder: 0, updatedAt: new Date("2026-09-23T00:00:00.000Z") })
      .mockResolvedValueOnce({ id: "media_123", kind: "IMAGE", isPublic: false, publicUrl: "https://cdn.example/media.jpg", altText: "Documentary image", sortOrder: 0, updatedAt });
    mocks.updateMany.mockResolvedValueOnce({ count: 0 });
    const formData = new FormData();
    formData.set("id", "media_123");
    formData.set("publish", "true");
    formData.set("expectedUpdatedAt", "2026-09-23T00:00:00.000Z");

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

  it("requires the delete review version before reading or deleting", async () => {
    const data = deletionForm();
    data.delete("expectedUpdatedAt");
    await expect(deleteMediaAsset(data)).rejects.toThrow(/review version/i);
    expect(mocks.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(mocks.deletePublicMediaObject).not.toHaveBeenCalled();
    expect(mocks.createAudit).not.toHaveBeenCalled();
  });

  it("rejects a stale delete review version after the displayed image was replaced", async () => {
    mocks.findUniqueOrThrow.mockResolvedValue({
      id: "media_123", isPublic: false, storageKey: "2026/replacement.jpg",
      publicUrl: "/media/2026/replacement.jpg", updatedAt: new Date("2026-09-23T00:01:00.000Z"),
    });
    await expect(deleteMediaAsset(deletionForm())).rejects.toThrow(/changed.*review/i);
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.deletePublicMediaObject).not.toHaveBeenCalled();
    expect(mocks.deleteRecord).not.toHaveBeenCalled();
    expect(mocks.createAudit).not.toHaveBeenCalled();
  });

  it.each(["id", "confirm"])("rejects repeated deletion %s fields before touching records or storage", async field => {
    for (const alternative of [field === "id" ? "media_123" : "DELETE", "different-instruction"]) {
      const data = deletionForm();
      data.append(field, alternative);
      await expect(deleteMediaAsset(data)).rejects.toThrow(/single text.*media ID.*DELETE confirmation/i);
    }
    expect(mocks.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.deletePublicMediaObject).not.toHaveBeenCalled();
    expect(mocks.deleteRecord).not.toHaveBeenCalled();
    expect(mocks.createAudit).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it.each(["id", "confirm"])("rejects a file-valued deletion %s field", async field => {
    const data = deletionForm();
    data.set(field, new File(["not-a-command"], "delete.txt"));
    await expect(deleteMediaAsset(data)).rejects.toThrow(/single text.*media ID.*DELETE confirmation/i);
    expect(mocks.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(mocks.deletePublicMediaObject).not.toHaveBeenCalled();
    expect(mocks.createAudit).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
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
    const auditOrder = mocks.createAudit.mock.invocationCallOrder[0];
    const deleteObjectOrder = mocks.deletePublicMediaObject.mock.invocationCallOrder[0];
    const transactionOrder = mocks.transaction.mock.invocationCallOrder[0];
    if (auditOrder === undefined || deleteObjectOrder === undefined || transactionOrder === undefined) throw new Error("Expected media deletion call ordering.");
    expect(auditOrder).toBeLessThan(deleteObjectOrder);
    expect(deleteObjectOrder).toBeLessThan(transactionOrder);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/media");
  });
});
