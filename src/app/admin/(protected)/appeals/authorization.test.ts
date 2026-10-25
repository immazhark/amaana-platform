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
