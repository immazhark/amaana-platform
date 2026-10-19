import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  redirect: vi.fn((location: string) => { throw new Error(`MOCK_REDIRECT:${location}`); }),
  revalidatePath: vi.fn(),
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  audit: vi.fn(),
  serializableTransaction: vi.fn(),
  deleteObject: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requirePermission: mocks.requirePermission }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/prisma", () => ({ prisma: { teamMember: { findUnique: mocks.findUnique } } }));
vi.mock("@/lib/prisma-transaction", () => ({ withSerializableTransactionRetry: mocks.serializableTransaction }));
vi.mock("@/lib/storage", () => ({
  deletePublicMediaObject: mocks.deleteObject,
  uploadPublicMediaFile: vi.fn(),
}));
vi.mock("@/lib/server-log", () => ({ logServerError: vi.fn() }));

import { deleteTeamMember } from "./actions";

const originalVersion = "2026-10-19T09:00:00.000Z";

function deletionForm(confirm = "DELETE") {
  const form = new FormData();
  form.set("id", "team_member_1");
  form.set("expectedUpdatedAt", originalVersion);
  form.set("confirm", confirm);
  return form;
}

describe("team member deletion and production seed safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "admin_1" });
    mocks.findUnique.mockResolvedValue({
      id: "team_member_1",
      slug: "mohammed-ismail-khan-ca",
      updatedAt: new Date(originalVersion),
      deletedAt: null,
      photoStorageKey: "2026/123e4567-e89b-42d3-a456-426614174000.webp",
    });
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.audit.mockResolvedValue({ id: "audit_1" });
    mocks.deleteObject.mockResolvedValue(undefined);
    mocks.serializableTransaction.mockImplementation(async callback => callback({
      teamMember: { findUnique: mocks.findUnique, updateMany: mocks.updateMany },
      auditEvent: { create: mocks.audit },
    }));
  });

  it("retains a non-public tombstone so re-running the slug-based seed cannot restore a removed member", async () => {
    await expect(deleteTeamMember(deletionForm())).rejects.toThrow(/MOCK_REDIRECT/);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "team_member_1", updatedAt: new Date(originalVersion), deletedAt: null },
      data: expect.objectContaining({
        deletedAt: expect.any(Date),
        isPublished: false,
        fullName: "Removed team member",
        bio: null,
        email: null,
        linkedinUrl: null,
        photoStorageKey: null,
        photoConsentAt: null,
      }),
    });
    expect(mocks.deleteObject).toHaveBeenCalledWith("2026/123e4567-e89b-42d3-a456-426614174000.webp");
    expect(mocks.audit).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "team.member_deleted", entityId: "team_member_1" }),
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/team");
  });

  it("refuses an invalid delete confirmation before any database access", async () => {
    await expect(deleteTeamMember(deletionForm("NO"))).rejects.toThrow(/MOCK_REDIRECT/);
    expect(mocks.serializableTransaction).not.toHaveBeenCalled();
    expect(mocks.deleteObject).not.toHaveBeenCalled();
  });

  it("rejects deletion after another admin has already changed the member", async () => {
    mocks.findUnique.mockResolvedValueOnce({
      id: "team_member_1",
      updatedAt: new Date("2026-10-19T09:01:00.000Z"),
      deletedAt: null,
      photoStorageKey: null,
    });
    await expect(deleteTeamMember(deletionForm())).rejects.toThrow(/MOCK_REDIRECT/);
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });
});
