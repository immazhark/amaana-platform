import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ cookie: vi.fn(), user: vi.fn(), privileged: vi.fn() }));

vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookie }) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`Synthetic redirect: ${path}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.privileged }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findFirst: mocks.user },
  assistanceRequest: { findUniqueOrThrow: mocks.privileged },
} }));
vi.mock("@/lib/prisma-transaction", () => ({ withSerializableTransactionRetry: mocks.privileged }));

import { assignRequest, convertToAppeal, saveVerification, updateRequest } from "./actions";

const actions = [
  { name: "saveVerification", run: saveVerification, permissions: ["assistance.update"], invalid: /Request edit version is missing/ },
  { name: "updateRequest", run: updateRequest, permissions: ["assistance.update"], invalid: /Request edit version is missing/ },
  { name: "assignRequest", run: assignRequest, permissions: ["assistance.assign"], invalid: /Assignment version is missing/ },
  { name: "convertToAppeal", run: convertToAppeal, permissions: ["appeal.create", "assistance.view", "assistance.update"], invalid: /Conversion version is missing/ },
] as const;

function allow(permissions: readonly string[]) {
  mocks.user.mockResolvedValue({
    id: "synthetic-staff",
    status: "ACTIVE",
    roles: [{ role: { permissions: permissions.map(key => ({ permission: { key } })) } }],
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookie.mockReturnValue({ value: Buffer.alloc(32, 0xa5).toString("base64url") });
  allow(["content.update"]);
  mocks.privileged.mockImplementation(() => { throw new Error("Unexpected private request or mutation access"); });
});

for (const { name, run, permissions, invalid } of actions) {
  it(`${name} denies anonymous access before session or assistance lookup`, async () => {
    mocks.cookie.mockReturnValue(undefined);
    await expect(run(new FormData())).rejects.toThrow("Synthetic redirect: /admin/login");
    expect(mocks.cookie).toHaveBeenCalledWith("amaana_admin_session");
    expect(mocks.user).not.toHaveBeenCalled();
    expect(mocks.privileged).not.toHaveBeenCalled();
  });

  it(`${name} denies an unresolved or expired session before private access`, async () => {
    mocks.user.mockResolvedValue(null);
    await expect(run(new FormData())).rejects.toThrow("Synthetic redirect: /admin/login");
    expect(mocks.user).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        status: "ACTIVE",
        sessions: { some: { tokenHash: expect.any(String), expiresAt: { gt: expect.any(Date) } } },
      },
    }));
    expect(mocks.privileged).not.toHaveBeenCalled();
  });

  it(`${name} denies an authenticated staff member with unrelated permissions`, async () => {
    await expect(run(new FormData())).rejects.toThrow("Synthetic redirect: /admin/forbidden");
    expect(mocks.user).toHaveBeenCalledOnce();
    expect(mocks.privileged).not.toHaveBeenCalled();
  });

  it(`${name} reaches input validation with the required permissions and no private lookup`, async () => {
    allow(permissions);
    await expect(run(new FormData())).rejects.toThrow(invalid);
    expect(mocks.user).toHaveBeenCalledOnce();
    expect(mocks.privileged).not.toHaveBeenCalled();
  });
}

it("convertToAppeal also requires assistance view and update after appeal creation permission", async () => {
  allow(["appeal.create"]);
  await expect(convertToAppeal(new FormData())).rejects.toThrow("Synthetic redirect: /admin/forbidden");
  expect(mocks.privileged).not.toHaveBeenCalled();
});
