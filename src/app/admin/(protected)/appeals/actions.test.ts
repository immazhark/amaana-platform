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
}));

vi.mock("@/lib/auth", () => ({
  requirePermission: mocks.requirePermission,
  hasPermission: mocks.hasPermission,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    appeal: { findUniqueOrThrow: mocks.appealFind },
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
vi.mock("@/lib/appeal-update-publication", () => ({
  getAppealUpdatePublicationIssues: () => [],
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { publishAppealUpdate, unpublishAppealUpdate } from "./actions";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("appeal update publication recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "approver" });
    mocks.appealFind.mockResolvedValue({ slug: "appeal-slug", status: "PUBLISHED", assistanceRequest: null });
    mocks.transaction.mockResolvedValue([]);
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
