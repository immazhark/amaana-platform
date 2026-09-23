import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  hasPermission: vi.fn(),
  appealFind: vi.fn(),
  updateFind: vi.fn(),
  updateCreate: vi.fn(),
  updateUpdate: vi.fn(),
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
    appealUpdate: { findUniqueOrThrow: mocks.updateFind, create: mocks.updateCreate, update: mocks.updateUpdate },
    auditEvent: { create: mocks.auditCreate },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/appeal-publication", () => ({
  getAppealConsentContentIssues: () => [],
  getFirstPublicationIssues: () => [],
  goalMatchesApprovedPublicTarget: () => true,
}));
vi.mock("@/lib/prisma-transaction", () => ({ withSerializableTransactionRetry: (callback: (tx: unknown) => unknown) => callback((globalThis as typeof globalThis & { __appealTx: unknown }).__appealTx) }));
vi.mock("@/lib/appeal-update-publication", () => ({
  getAppealUpdatePublicationIssues: () => [],
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { publishAppealUpdate, transitionAppeal, unpublishAppealUpdate, updateFeaturing } from "./actions";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("appeal concurrent mutation guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "approver" });
    mocks.hasPermission.mockReturnValue(true);
    mocks.auditCreate.mockResolvedValue({ id: "audit" });
    mocks.updateManyAppeal.mockResolvedValue({ count: 1 });
    (globalThis as typeof globalThis & { __appealTx: unknown }).__appealTx = { appeal: { findUniqueOrThrow: mocks.appealFind, update: mocks.updateAppeal, updateMany: mocks.updateManyAppeal }, auditEvent: { create: mocks.auditCreate } };
  });

  it("rejects a status transition when the appeal changed after review", async () => {
    mocks.appealFind
      .mockResolvedValueOnce({ status: "UNDER_REVIEW", goalAmount: 1000, reviewedById: null, publishedAt: null, beneficiaryDisplayName: null, coverImageUrl: null, assistanceRequest: null })
      .mockResolvedValueOnce({ status: "DRAFT", goalAmount: 1000, reviewedById: null, publishedAt: null, beneficiaryDisplayName: null, coverImageUrl: null, assistanceRequest: null });

    await expect(transitionAppeal(form({ id: "appeal-1", status: "PUBLISHED" }))).rejects.toThrow(/changed while you were reviewing/i);
    expect(mocks.updateManyAppeal).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("rechecks publication state before featuring", async () => {
    mocks.appealFind
      .mockResolvedValueOnce({ status: "PUBLISHED" })
      .mockResolvedValueOnce({ status: "PAUSED", isFeatured: false, featuredOrder: null });

    await expect(updateFeaturing(form({ id: "appeal-1", isFeatured: "on", featuredOrder: "1" }))).rejects.toThrow(/no longer actively published/i);
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
    mocks.hasPermission.mockReturnValue(true);
    (globalThis as typeof globalThis & { __appealTx: unknown }).__appealTx = { appeal: { findUniqueOrThrow: mocks.appealFind, update: mocks.updateAppeal, updateMany: mocks.updateManyAppeal }, auditEvent: { create: mocks.auditCreate } };
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

    expect(mocks.updateUpdate).toHaveBeenCalledWith({ where: { id: "update-1" }, data: { isPublic: false, publishedAt: null } });
    expect(mocks.auditCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "appeal.update_unpublished", entityId: "appeal-1" }) });
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });

  it("rejects repeat unpublication of an internal update", async () => {
    mocks.updateFind.mockResolvedValue({ appealId: "appeal-1", isPublic: false });

    await expect(unpublishAppealUpdate(form({ appealId: "appeal-1", updateId: "update-1" })))
      .rejects.toThrow("already internal");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
