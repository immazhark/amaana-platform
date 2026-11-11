import { createHash } from "node:crypto";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ cookie: vi.fn(), user: vi.fn(), privileged: vi.fn(), appeal: vi.fn(), asset: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookie }) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error("Synthetic redirect: " + path); } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.privileged }));
vi.mock("@/lib/storage", () => ({ deletePublicMediaObject: mocks.privileged, uploadPublicMediaFile: mocks.privileged, validatePublicMediaFile: mocks.privileged }));
vi.mock("@/lib/server-log", () => ({ logServerError: mocks.privileged }));
vi.mock("@/lib/prisma-transaction", () => ({ withSerializableTransactionRetry: mocks.privileged }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findFirst: mocks.user },
  mediaAsset: { findUniqueOrThrow: mocks.asset, create: mocks.privileged, updateMany: mocks.privileged, delete: mocks.privileged },
  appeal: { findUnique: mocks.appeal },
  auditEvent: { create: mocks.privileged }, notification: { create: mocks.privileged },
  $transaction: mocks.privileged,
} }));
import { createMediaAsset, updateMediaAsset, setMediaPublication, deleteMediaAsset } from "./actions";
const token = Buffer.alloc(32, 0xa5).toString("base64url");
const tokenHash = createHash("sha256").update(token).digest("hex");
const user = (permissions: string[]) => ({ id: "synthetic-reviewer", status: "ACTIVE", roles: [{ role: { permissions: permissions.map(key => ({ permission: { key } })) } }] });
const actions = { createMediaAsset, updateMediaAsset, setMediaPublication, deleteMediaAsset };
const permissions = { createMediaAsset: "content.update", updateMediaAsset: "content.update", setMediaPublication: "content.approve", deleteMediaAsset: "content.approve" };
const errors = { createMediaAsset: "Choose a single valid content target", updateMediaAsset: "Media record is required", setMediaPublication: "Use a single media ID", deleteMediaAsset: "Use a single text media ID" };
beforeEach(() => {
  vi.clearAllMocks(); mocks.asset.mockResolvedValue(null); mocks.appeal.mockResolvedValue(null); mocks.cookie.mockReturnValue({ value: token }); mocks.user.mockResolvedValue(user(["content.view"]));
  mocks.privileged.mockImplementation(() => { throw new Error("Unexpected private assistance operation"); });
});
for (const [name, action] of Object.entries(actions)) {
  for (const scenario of ["anonymous", "malformed", "expired-or-revoked", "missing-permission"]) {
    it(name + " denies " + scenario + " before private effects", async () => {
      if (scenario === "anonymous") mocks.cookie.mockReturnValue(undefined);
      if (scenario === "malformed") mocks.cookie.mockReturnValue({ value: "forged-session" });
      if (scenario === "expired-or-revoked") mocks.user.mockResolvedValue(null);
      await expect(action(new FormData())).rejects.toThrow("Synthetic redirect: /admin/" + (scenario === "missing-permission" ? "forbidden" : "login"));
      if (scenario === "anonymous" || scenario === "malformed") expect(mocks.user).not.toHaveBeenCalled();
      else expect(mocks.user).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "ACTIVE", sessions: { some: { tokenHash, expiresAt: { gt: expect.any(Date) } } } } }));
      expect(mocks.appeal).not.toHaveBeenCalled();
    expect(mocks.asset).not.toHaveBeenCalled();
    expect(mocks.privileged).not.toHaveBeenCalled();
    });
  }
}
for (const [name, action] of Object.entries(actions)) {
  it(name + " accepts its least-privilege permission before input validation", async () => {
    mocks.user.mockResolvedValue(user([permissions[name as keyof typeof permissions]]));
    await expect(action(new FormData())).rejects.toThrow(errors[name as keyof typeof errors]);
    expect(mocks.user).toHaveBeenCalled();
    expect(mocks.appeal).not.toHaveBeenCalled();
    expect(mocks.asset).not.toHaveBeenCalled();
    expect(mocks.privileged).not.toHaveBeenCalled();
  });
}
for (const canView of [false, true]) {
  it("appeal-target creation requires independent appeal.view=" + canView, async () => {
    mocks.user.mockResolvedValue(user(canView ? ["content.update", "appeal.view"] : ["content.update"]));
    const form = new FormData(); form.set("target", "appeal:synthetic-appeal");
    await expect(createMediaAsset(form)).rejects.toThrow(canView ? "Appeal is not available" : "Synthetic redirect: /admin/forbidden");
    if (canView) expect(mocks.appeal).toHaveBeenCalledWith({ where: { id: "synthetic-appeal" }, select: { id: true, status: true } });
    else expect(mocks.appeal).not.toHaveBeenCalled();
    expect(mocks.asset).not.toHaveBeenCalled();
    expect(mocks.privileged).not.toHaveBeenCalled();
  });
}

for (const canApprove of [false, true]) {
  it("published media edit independently requires content.approve=" + canApprove, async () => {
    mocks.user.mockResolvedValue(user(canApprove ? ["content.update", "content.approve"] : ["content.update"]));
    mocks.asset.mockResolvedValue({ isPublic: true, storageKey: null, kind: "IMAGE" });
    const form = new FormData(); form.set("id", "synthetic-published"); form.set("expectedUpdatedAt", "2026-11-10T00:00:00.000Z");
    await expect(updateMediaAsset(form)).rejects.toThrow(canApprove ? "Media must retain an approved public URL" : "Published media requires approval permission to edit");
    expect(mocks.asset).toHaveBeenCalledWith({ where: { id: "synthetic-published" } });
    expect(mocks.privileged).not.toHaveBeenCalled();
  });
}
it("draft media editing does not require publication approval", async () => {
  mocks.user.mockResolvedValue(user(["content.update"]));
  mocks.asset.mockResolvedValue({ isPublic: false, storageKey: null, kind: "IMAGE" });
  const form = new FormData(); form.set("id", "synthetic-draft"); form.set("expectedUpdatedAt", "2026-11-10T00:00:00.000Z");
  await expect(updateMediaAsset(form)).rejects.toThrow("Media must retain an approved public URL");
  expect(mocks.asset).toHaveBeenCalledWith({ where: { id: "synthetic-draft" } });
  expect(mocks.privileged).not.toHaveBeenCalled();
});
