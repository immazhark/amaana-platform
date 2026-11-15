import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ cookie: vi.fn(), user: vi.fn(), privileged: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookie }) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error("Synthetic redirect: " + path); } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.privileged, revalidateTag: mocks.privileged }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findFirst: mocks.user },
  appeal: { findUniqueOrThrow: mocks.privileged, updateMany: mocks.privileged },
  appealUpdate: { findUniqueOrThrow: mocks.privileged, create: mocks.privileged, updateMany: mocks.privileged },
  auditEvent: { create: mocks.privileged },
  $transaction: mocks.privileged,
} }));
import { addAppealUpdate, publishAppealUpdate, transitionAppeal, unpublishAppealUpdate, updateAppeal, updateFeaturing } from "./actions";
const actions = { addAppealUpdate, publishAppealUpdate, transitionAppeal, unpublishAppealUpdate, updateAppeal, updateFeaturing };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookie.mockReturnValue({ value: Buffer.alloc(32, 0xa5).toString("base64url") });
  mocks.user.mockResolvedValue({ id: "synthetic-reader", status: "ACTIVE", roles: [] });
  mocks.privileged.mockImplementation(() => { throw new Error("Unexpected privileged work"); });
});
for (const [name, action] of Object.entries(actions)) {
  it(name + " rejects an authenticated user without permissions before data access", async () => {
    await expect(action(new FormData())).rejects.toThrow("Synthetic redirect: /admin/forbidden");
    expect(mocks.user).toHaveBeenCalledOnce();
    expect(mocks.privileged).not.toHaveBeenCalled();
  });
  it(name + " rejects anonymous access before any database lookup", async () => {
    mocks.cookie.mockReturnValue(undefined);
    await expect(action(new FormData())).rejects.toThrow("Synthetic redirect: /admin/login");
    expect(mocks.user).not.toHaveBeenCalled();
    expect(mocks.privileged).not.toHaveBeenCalled();
  });
}

const unrelatedPermissionsByAction = {
  updateAppeal: "appeal.approve",
  transitionAppeal: "appeal.approve",
  updateFeaturing: "appeal.update",
  addAppealUpdate: "appeal.approve",
  publishAppealUpdate: "appeal.update",
  unpublishAppealUpdate: "appeal.update",
} satisfies Record<keyof typeof actions, string>;

function userWithSeparateRoles(...rolePermissions: string[][]) {
  return {
    id: "synthetic-cross-role-user",
    status: "ACTIVE",
    roles: rolePermissions.map(permissions => ({
      role: { permissions: permissions.map(key => ({ permission: { key } })) },
    })),
  };
}

for (const [name, action] of Object.entries(actions) as [keyof typeof actions, (formData: FormData) => Promise<unknown>][]) {
  it(name + " denies plausible but unrelated cross-role grants before private effects", async () => {
    mocks.user.mockResolvedValue(userWithSeparateRoles(
      ["content.view", "donation.reconcile"],
      [unrelatedPermissionsByAction[name]],
    ));
    await expect(action(new FormData())).rejects.toThrow("Synthetic redirect: /admin/forbidden");
    expect(mocks.user).toHaveBeenCalledOnce();
    expect(mocks.privileged).not.toHaveBeenCalled();
  });
}

it("appeal.update alone reaches edit version validation but cannot grant featuring", async () => {
  mocks.user.mockResolvedValue(userWithSeparateRoles(["appeal.update"]));
  await expect(updateAppeal(new FormData())).rejects.toThrow("Appeal edit version is missing or invalid");
  expect(mocks.user).toHaveBeenCalledOnce();
  expect(mocks.privileged).not.toHaveBeenCalled();
  vi.clearAllMocks();
  mocks.cookie.mockReturnValue({ value: Buffer.alloc(32, 0xa5).toString("base64url") });
  mocks.user.mockResolvedValue(userWithSeparateRoles(["appeal.update"]));
  await expect(updateFeaturing(new FormData())).rejects.toThrow("Synthetic redirect: /admin/forbidden");
  expect(mocks.privileged).not.toHaveBeenCalled();
});

it("appeal.approve alone reaches featuring validation but cannot edit an appeal", async () => {
  mocks.user.mockResolvedValue(userWithSeparateRoles(["appeal.approve"]));
  await expect(updateFeaturing(new FormData())).rejects.toThrow("Appeal featuring version is missing or invalid");
  expect(mocks.user).toHaveBeenCalledOnce();
  expect(mocks.privileged).not.toHaveBeenCalled();
  vi.clearAllMocks();
  mocks.cookie.mockReturnValue({ value: Buffer.alloc(32, 0xa5).toString("base64url") });
  mocks.user.mockResolvedValue(userWithSeparateRoles(["appeal.approve"]));
  await expect(updateAppeal(new FormData())).rejects.toThrow("Synthetic redirect: /admin/forbidden");
  expect(mocks.privileged).not.toHaveBeenCalled();
});

it("appeal.update without appeal.approve cannot publish an appeal even after a valid versioned read", async () => {
  mocks.user.mockResolvedValue(userWithSeparateRoles(["appeal.update"]));
  mocks.privileged.mockResolvedValueOnce({ status: "UNDER_REVIEW" });
  const form = new FormData();
  form.set("id", "synthetic-appeal");
  form.set("status", "PUBLISHED");
  form.set("expectedUpdatedAt", "2026-11-15T00:00:00.000Z");

  await expect(transitionAppeal(form)).rejects.toThrow("Approval permission is required");
  expect(mocks.user).toHaveBeenCalledOnce();
  expect(mocks.privileged).toHaveBeenCalledOnce();
  expect(mocks.privileged).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: "synthetic-appeal" },
  }));
});
