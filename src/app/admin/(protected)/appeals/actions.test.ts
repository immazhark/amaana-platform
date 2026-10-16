import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateTag: vi.fn(),
  revalidatePath: vi.fn(),
  requirePermission: vi.fn(),
  hasPermission: vi.fn(),
  appealFind: vi.fn(),
  mediaFind: vi.fn(),
  auditFind: vi.fn(),
  publicationIssues: vi.fn(),
  updateFind: vi.fn(),
  updateCreate: vi.fn(),
  updateUpdate: vi.fn(),
  updateManyUpdate: vi.fn(),
  auditCreate: vi.fn(),
  transaction: vi.fn(),
  updateAppeal: vi.fn(),
  updateManyAppeal: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requirePermission: mocks.requirePermission,
  hasPermission: mocks.hasPermission,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    appeal: { findUniqueOrThrow: mocks.appealFind, update: mocks.updateAppeal, updateMany: mocks.updateManyAppeal },
    appealUpdate: { findUniqueOrThrow: mocks.updateFind, create: mocks.updateCreate, update: mocks.updateUpdate, updateMany: mocks.updateManyUpdate },
    auditEvent: { create: mocks.auditCreate, findFirst: mocks.auditFind },
    mediaAsset: { findFirst: mocks.mediaFind },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/appeal-publication", () => ({
  getAppealConsentContentIssues: () => [],
  getAppealPublicationIssues: mocks.publicationIssues,
  goalMatchesApprovedPublicTarget: () => true,
}));
vi.mock("@/lib/prisma-transaction", () => ({ withSerializableTransactionRetry: (callback: (tx: unknown) => unknown) => callback((globalThis as typeof globalThis & { __appealTx: unknown }).__appealTx) }));
vi.mock("@/lib/appeal-update-publication", () => ({
  getAppealUpdatePublicationIssues: ({ appealStatus }: { appealStatus: string }) => appealStatus === "PUBLISHED" ? [] : ["Appeal must be actively published."],
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath, updateTag: mocks.updateTag }));

import { addAppealUpdate, publishAppealUpdate, transitionAppeal, unpublishAppealUpdate, updateAppeal, updateFeaturing } from "./actions";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("appeal concurrent mutation guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "approver" });
    mocks.publicationIssues.mockReturnValue([]);
    mocks.hasPermission.mockReturnValue(true);
    mocks.auditCreate.mockResolvedValue({ id: "audit" });
    mocks.updateManyAppeal.mockResolvedValue({ count: 1 });
    (globalThis as typeof globalThis & { __appealTx: unknown }).__appealTx = { appeal: { findUniqueOrThrow: mocks.appealFind, update: mocks.updateAppeal, updateMany: mocks.updateManyAppeal }, appealUpdate: { findUniqueOrThrow: mocks.updateFind, create: mocks.updateCreate, update: mocks.updateUpdate, updateMany: mocks.updateManyUpdate }, mediaAsset: { findFirst: mocks.mediaFind }, auditEvent: { create: mocks.auditCreate, findFirst: mocks.auditFind } };
  });

  it.each(["PAUSED", "CLOSED", "FUNDED"])("expires promotional data immediately after a committed %s transition", async status => {
    const appeal = { status: "PUBLISHED", slug: "appeal-slug", updatedAt: new Date("2026-09-23T04:00:00.000Z"), goalAmount: 1000, reviewedById: null, publishedAt: new Date(), assistanceRequest: null };
    mocks.appealFind.mockResolvedValue(appeal);
    await transitionAppeal(form({ id: "appeal-1", status, expectedUpdatedAt: appeal.updatedAt.toISOString() }));
    expect(mocks.updateTag).toHaveBeenCalledExactlyOnceWith("appeals");
    expect(mocks.updateTag.mock.invocationCallOrder[0]).toBeGreaterThan(mocks.auditCreate.mock.invocationCallOrder[0]!);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/appeals");
  });

  it("does not invalidate promotional data when the workflow write fails", async () => {
    const appeal = { status: "PUBLISHED", updatedAt: new Date("2026-09-23T04:00:00.000Z"), goalAmount: 1000, assistanceRequest: null };
    mocks.appealFind.mockResolvedValue(appeal);
    mocks.updateManyAppeal.mockResolvedValue({ count: 0 });
    await expect(transitionAppeal(form({ id: "appeal-1", status: "PAUSED", expectedUpdatedAt: appeal.updatedAt.toISOString() }))).rejects.toThrow(/changed while you were reviewing/i);
    expect(mocks.updateTag).not.toHaveBeenCalled();
  });

  it("rejects a stale same-status content edit using the rendered appeal version", async () => {
    const renderedAt = new Date("2026-09-23T04:00:00.000Z");
    const newerAt = new Date("2026-09-23T04:01:00.000Z");
    mocks.appealFind
      .mockResolvedValueOnce({ status: "DRAFT", updatedAt: newerAt, assistanceRequest: null })
      .mockResolvedValueOnce({ status: "DRAFT", updatedAt: newerAt, assistanceRequest: null });

    await expect(updateAppeal(form({
      id: "appeal-1",
      expectedUpdatedAt: renderedAt.toISOString(),
      title: "Verified medical support",
      slug: "verified-medical-support",
      summary: "A sufficiently detailed verified appeal summary.",
      story: "A sufficiently detailed verified public appeal story for review.",
      goalAmount: "1000",
      category: "MEDICAL",
    }))).rejects.toThrow(/changed while you were reviewing/i);
    expect(mocks.updateManyAppeal).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("rejects a status transition when the appeal changed after review", async () => {
    mocks.appealFind
      .mockResolvedValueOnce({ status: "UNDER_REVIEW", updatedAt: new Date("2026-09-23T04:00:00.000Z"), goalAmount: 1000, reviewedById: null, publishedAt: null, beneficiaryDisplayName: null, coverImageUrl: null, assistanceRequest: null })
      .mockResolvedValueOnce({ status: "DRAFT", updatedAt: new Date("2026-09-23T04:01:00.000Z"), goalAmount: 1000, reviewedById: null, publishedAt: null, beneficiaryDisplayName: null, coverImageUrl: null, assistanceRequest: null });

    await expect(transitionAppeal(form({ id: "appeal-1", status: "PUBLISHED", expectedUpdatedAt: "2026-09-23T04:00:00.000Z" }))).rejects.toThrow(/changed while you were reviewing/i);
    expect(mocks.updateManyAppeal).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("rejects same-status workflow transition when the rendered appeal version is stale", async () => {
    const renderedAt = new Date("2026-09-23T04:00:00.000Z");
    const newerAt = new Date("2026-09-23T04:01:00.000Z");
    mocks.appealFind
      .mockResolvedValueOnce({ status: "UNDER_REVIEW", updatedAt: newerAt, goalAmount: 1000, reviewedById: null, publishedAt: null, beneficiaryDisplayName: null, coverImageUrl: null, assistanceRequest: null })
      .mockResolvedValueOnce({ status: "UNDER_REVIEW", updatedAt: newerAt, goalAmount: 1000, reviewedById: null, publishedAt: null, beneficiaryDisplayName: null, coverImageUrl: null, assistanceRequest: null });

    await expect(transitionAppeal(form({ id: "appeal-1", status: "PUBLISHED", expectedUpdatedAt: renderedAt.toISOString() })))
      .rejects.toThrow(/changed while you were reviewing/i);
    expect(mocks.updateManyAppeal).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("passes current linked-assistance review details to both resume checks", async () => {
    const reviewedAt = new Date("2026-09-23T04:00:00.000Z");
    const verification = { decision: "APPROVED_PUBLIC", publicNameConsent: "ALLOWED" };
    const appeal = {
      status: "PAUSED", slug: "appeal-slug", updatedAt: reviewedAt, goalAmount: 1000,
      reviewedById: "staff-1", publishedAt: reviewedAt, beneficiaryDisplayName: "Approved name",
      coverImageUrl: null, assistanceRequest: { id: "request-1", verification },
    };
    mocks.appealFind.mockResolvedValue(appeal);

    await transitionAppeal(form({ id: "appeal-1", status: "PUBLISHED", expectedUpdatedAt: reviewedAt.toISOString() }));

    expect(mocks.publicationIssues).toHaveBeenCalledTimes(2);
    expect(mocks.publicationIssues).toHaveBeenCalledWith(expect.objectContaining({
      fromStatus: "PAUSED", toStatus: "PUBLISHED", hasAssistanceRequest: true,
      verification, beneficiaryDisplayName: "Approved name",
    }));
    expect(mocks.updateManyAppeal).toHaveBeenCalledTimes(1);
  });

  it("blocks resumption if linked assistance review is no longer eligible", async () => {
    const reviewedAt = new Date("2026-09-23T04:00:00.000Z");
    const appeal = {
      status: "PAUSED", updatedAt: reviewedAt, goalAmount: 1000,
      beneficiaryDisplayName: "Previously shown", coverImageUrl: null,
      assistanceRequest: { verification: { publicNameConsent: "NOT_ALLOWED" } },
    };
    mocks.appealFind.mockResolvedValue(appeal);
    mocks.publicationIssues.mockReturnValue(["A public beneficiary name requires explicit public-name consent."]);

    await expect(transitionAppeal(form({ id: "appeal-1", status: "PUBLISHED", expectedUpdatedAt: reviewedAt.toISOString() })))
      .rejects.toThrow(/requires explicit public-name consent/i);
    expect(mocks.updateManyAppeal).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
    expect(mocks.updateTag).not.toHaveBeenCalled();
  });

  it("rejects a paused appeal when its formerly approved cover image is withdrawn", async () => {
    const reviewedAt = new Date("2026-09-23T04:00:00.000Z");
    mocks.appealFind.mockResolvedValue({
      status: "PAUSED", updatedAt: reviewedAt, goalAmount: 1000,
      beneficiaryDisplayName: null, coverImageUrl: "/media/withdrawn.jpg",
      assistanceRequest: null,
    });
    mocks.mediaFind.mockResolvedValue(null);

    await expect(transitionAppeal(form({ id: "appeal-1", status: "PUBLISHED", expectedUpdatedAt: reviewedAt.toISOString() })))
      .rejects.toThrow(/approved Media review library/i);
    expect(mocks.updateManyAppeal).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("restores a paused appeal with still-approved media without resetting its first publication", async () => {
    const reviewedAt = new Date("2026-09-23T04:00:00.000Z");
    const firstPublishedAt = new Date("2026-09-01T04:00:00.000Z");
    const cover = {
      id: "media-1", kind: "IMAGE", isPublic: true, privacyApprovedAt: reviewedAt,
      publicUrl: "/media/reviewed.jpg",
    };
    mocks.appealFind.mockResolvedValue({
      status: "PAUSED", updatedAt: reviewedAt, goalAmount: 1000,
      publishedAt: firstPublishedAt, reviewedById: "reviewer-1",
      beneficiaryDisplayName: null, coverImageUrl: cover.publicUrl, assistanceRequest: null,
    });
    mocks.mediaFind.mockResolvedValue(cover);
    mocks.auditFind.mockResolvedValue({ metadata: {
      privacyClass: "GREEN_PUBLIC", websiteApproved: true, provenanceConfirmed: true,
      containsPrivateDocument: false, consentStatus: "DOCUMENTED", heroEligible: true,
    } });

    await transitionAppeal(form({ id: "appeal-1", status: "PUBLISHED", expectedUpdatedAt: reviewedAt.toISOString() }));

    expect(mocks.mediaFind).toHaveBeenCalledTimes(2);
    expect(mocks.updateManyAppeal).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "PUBLISHED", publishedAt: firstPublishedAt }),
    }));
    expect(mocks.updateTag).toHaveBeenCalledExactlyOnceWith("appeals");
  });

  it("rechecks cover approval inside the transaction before restoring a paused appeal", async () => {
    const reviewedAt = new Date("2026-09-23T04:00:00.000Z");
    const cover = {
      id: "media-1", kind: "IMAGE", isPublic: true, privacyApprovedAt: reviewedAt,
      publicUrl: "/media/reviewed.jpg",
    };
    mocks.appealFind.mockResolvedValue({
      status: "PAUSED", updatedAt: reviewedAt, goalAmount: 1000,
      beneficiaryDisplayName: null, coverImageUrl: cover.publicUrl, assistanceRequest: null,
    });
    mocks.mediaFind.mockResolvedValueOnce(cover).mockResolvedValueOnce(null);
    mocks.auditFind.mockResolvedValueOnce({ metadata: {
      privacyClass: "GREEN_PUBLIC", websiteApproved: true, provenanceConfirmed: true,
      containsPrivateDocument: false, consentStatus: "DOCUMENTED", heroEligible: true,
    } });

    await expect(transitionAppeal(form({ id: "appeal-1", status: "PUBLISHED", expectedUpdatedAt: reviewedAt.toISOString() })))
      .rejects.toThrow(/approved Media review library/i);
    expect(mocks.mediaFind).toHaveBeenCalledTimes(2);
    expect(mocks.updateManyAppeal).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("rechecks publication state before featuring", async () => {
    mocks.appealFind
      .mockResolvedValueOnce({ status: "PUBLISHED" })
      .mockResolvedValueOnce({ status: "PAUSED", isFeatured: false, featuredOrder: null, updatedAt: new Date("2026-09-23T04:00:00.000Z") });

    await expect(updateFeaturing(form({ id: "appeal-1", isFeatured: "on", featuredOrder: "1", expectedUpdatedAt: "2026-09-23T04:00:00.000Z" }))).rejects.toThrow(/no longer actively published/i);
    expect(mocks.updateAppeal).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });
});

describe("appeal update publication recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "approver" });
    mocks.appealFind.mockResolvedValue({ slug: "appeal-slug", status: "PUBLISHED", assistanceRequest: null });
    mocks.transaction.mockResolvedValue([]);
    mocks.updateManyUpdate.mockResolvedValue({ count: 1 });
    mocks.hasPermission.mockReturnValue(true);
    (globalThis as typeof globalThis & { __appealTx: unknown }).__appealTx = { appeal: { findUniqueOrThrow: mocks.appealFind, update: mocks.updateAppeal, updateMany: mocks.updateManyAppeal }, appealUpdate: { findUniqueOrThrow: mocks.updateFind, create: mocks.updateCreate, update: mocks.updateUpdate, updateMany: mocks.updateManyUpdate }, auditEvent: { create: mocks.auditCreate } };
  });

  it("rechecks public-update eligibility at creation inside the serialized boundary", async () => {
    mocks.hasPermission.mockReturnValue(true);
    mocks.appealFind
      .mockResolvedValueOnce({ slug: "appeal-slug", status: "PUBLISHED", assistanceRequest: null })
      .mockResolvedValueOnce({ status: "PAUSED", assistanceRequest: null });

    await expect(addAppealUpdate(form({
      id: "appeal-1",
      updateTitle: "A verified update",
      updateContent: "This is a sufficiently detailed privacy-safe campaign update.",
      isPublic: "on",
      privacyReviewed: "on",
    }))).rejects.toThrow(/cannot be published/i);
    expect(mocks.updateCreate).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("rechecks appeal publication eligibility inside the serialized publish boundary", async () => {
    mocks.appealFind
      .mockResolvedValueOnce({ slug: "appeal-slug", status: "PUBLISHED", assistanceRequest: null })
      .mockResolvedValueOnce({ status: "PAUSED", assistanceRequest: null });
    mocks.updateFind
      .mockResolvedValueOnce({ appealId: "appeal-1", isPublic: false })
      .mockResolvedValueOnce({ appealId: "appeal-1", isPublic: false });

    await expect(publishAppealUpdate(form({ appealId: "appeal-1", updateId: "update-1", privacyReviewed: "on" }))).rejects.toThrow(/cannot be published/i);
    expect(mocks.updateManyUpdate).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("fails closed when an update publication claim loses a race", async () => {
    mocks.updateFind.mockResolvedValue({ appealId: "appeal-1", isPublic: false });
    mocks.updateManyUpdate.mockResolvedValue({ count: 0 });

    await expect(publishAppealUpdate(form({ appealId: "appeal-1", updateId: "update-1", privacyReviewed: "on" }))).rejects.toThrow(/changed while you were reviewing/i);
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("rejects repeat publication instead of resetting the publication timestamp", async () => {
    mocks.updateFind.mockResolvedValue({ appealId: "appeal-1", isPublic: true });

    await expect(publishAppealUpdate(form({ appealId: "appeal-1", updateId: "update-1", privacyReviewed: "on" })))
      .rejects.toThrow("already public");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects an update that does not belong to the selected appeal", async () => {
    mocks.updateFind.mockResolvedValue({ appealId: "appeal-2", isPublic: false });

    await expect(publishAppealUpdate(form({ appealId: "appeal-1", updateId: "update-1", privacyReviewed: "on" })))
      .rejects.toThrow("does not belong");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("unpublishes a public update and records the action atomically", async () => {
    mocks.updateFind.mockResolvedValue({ appealId: "appeal-1", isPublic: true });

    await unpublishAppealUpdate(form({ appealId: "appeal-1", updateId: "update-1" }));

    expect(mocks.updateManyUpdate).toHaveBeenCalledWith({ where: { id: "update-1", appealId: "appeal-1", isPublic: true }, data: { isPublic: false, publishedAt: null } });
    expect(mocks.auditCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "appeal.update_unpublished", entityId: "appeal-1" }) });
    expect(mocks.updateManyUpdate).toHaveBeenCalledTimes(1);
  });

  it("rejects repeat unpublication of an internal update", async () => {
    mocks.updateFind.mockResolvedValue({ appealId: "appeal-1", isPublic: false });

    await expect(unpublishAppealUpdate(form({ appealId: "appeal-1", updateId: "update-1" })))
      .rejects.toThrow("already internal");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
