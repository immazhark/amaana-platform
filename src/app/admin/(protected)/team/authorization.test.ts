import { createHash } from "node:crypto";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ cookie: vi.fn(), user: vi.fn(), privileged: vi.fn() }));

vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookie }) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error("Synthetic redirect: " + path); } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.privileged }));
vi.mock("sharp", () => ({ default: mocks.privileged }));
vi.mock("@/lib/storage", () => ({
  deletePublicMediaObject: mocks.privileged,
  uploadPublicMediaFile: mocks.privileged,
}));
vi.mock("@/lib/server-log", () => ({ logServerError: mocks.privileged }));
vi.mock("@/lib/prisma-transaction", () => ({ withSerializableTransactionRetry: mocks.privileged }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findFirst: mocks.user },
  teamMember: { findUnique: mocks.privileged, updateMany: mocks.privileged, findMany: mocks.privileged },
  teamGroup: { findUnique: mocks.privileged, updateMany: mocks.privileged, findMany: mocks.privileged },
  auditEvent: { create: mocks.privileged },
  $transaction: mocks.privileged,
} }));

import {
  createTeamMember, updateTeamMember, deleteTeamMember, reorderTeamMember,
  createTeamGroup, updateTeamGroup, reorderTeamGroup,
} from "./actions";

const token = Buffer.alloc(32, 0xa5).toString("base64url");
const tokenHash = createHash("sha256").update(token).digest("hex");
const actions = {
  createTeamMember, updateTeamMember, deleteTeamMember, reorderTeamMember,
  createTeamGroup, updateTeamGroup, reorderTeamGroup,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookie.mockReturnValue({ value: token });
  mocks.user.mockResolvedValue({
    id: "synthetic-editor", status: "ACTIVE",
    roles: [{ role: { permissions: [{ permission: { key: "assistance.view" } }] } }],
  });
  mocks.privileged.mockImplementation(() => { throw new Error("Unexpected team administration operation"); });
});

for (const [name, action] of Object.entries(actions)) {
  it(name + " denies an anonymous caller before user or team data lookup", async () => {
    mocks.cookie.mockReturnValue(undefined);
    await expect(action(new FormData())).rejects.toThrow("Synthetic redirect: /admin/login");
    expect(mocks.user).not.toHaveBeenCalled();
    expect(mocks.privileged).not.toHaveBeenCalled();
  });

  it(name + " denies an invalid session token before database lookup", async () => {
    mocks.cookie.mockReturnValue({ value: "forged-session" });
    await expect(action(new FormData())).rejects.toThrow("Synthetic redirect: /admin/login");
    expect(mocks.user).not.toHaveBeenCalled();
    expect(mocks.privileged).not.toHaveBeenCalled();
  });

  it(name + " denies a revoked or expired session before team effects", async () => {
    mocks.user.mockResolvedValue(null);
    await expect(action(new FormData())).rejects.toThrow("Synthetic redirect: /admin/login");
    expect(mocks.user).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: "ACTIVE", sessions: { some: { tokenHash, expiresAt: { gt: expect.any(Date) } } } },
    }));
    expect(mocks.privileged).not.toHaveBeenCalled();
  });

  it(name + " denies an active user without content.update", async () => {
    await expect(action(new FormData())).rejects.toThrow("Synthetic redirect: /admin/forbidden");
    expect(mocks.user).toHaveBeenCalledOnce();
    expect(mocks.privileged).not.toHaveBeenCalled();
  });
}
