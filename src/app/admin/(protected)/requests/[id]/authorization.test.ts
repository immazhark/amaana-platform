import { createHash } from "node:crypto";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ cookie: vi.fn(), user: vi.fn(), privileged: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookie }) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error("Synthetic redirect: " + path); } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.privileged }));
vi.mock("@/lib/prisma-transaction", () => ({ withSerializableTransactionRetry: mocks.privileged }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findFirst: mocks.user },
  assistanceRequest: { findUniqueOrThrow: mocks.privileged, findFirst: mocks.privileged, updateMany: mocks.privileged },
  auditEvent: { create: mocks.privileged }, notification: { create: mocks.privileged },
  $transaction: mocks.privileged,
} }));
import { saveVerification, updateRequest, assignRequest, convertToAppeal, saveVerificationWithFeedback, updateRequestWithFeedback } from "./actions";
const token = Buffer.alloc(32, 0xa5).toString("base64url");
const tokenHash = createHash("sha256").update(token).digest("hex");
const user = (permissions: string[]) => ({ id: "synthetic-reviewer", status: "ACTIVE", roles: [{ role: { permissions: permissions.map(key => ({ permission: { key } })) } }] });
const actions = {
  saveVerification: () => saveVerification(new FormData()), updateRequest: () => updateRequest(new FormData()),
  assignRequest: () => assignRequest(new FormData()), convertToAppeal: () => convertToAppeal(new FormData()),
  saveVerificationWithFeedback: () => saveVerificationWithFeedback({ kind: "idle", message: "" }, new FormData()),
  updateRequestWithFeedback: () => updateRequestWithFeedback({ kind: "idle", message: "" }, new FormData()),
};
beforeEach(() => {
  vi.clearAllMocks(); mocks.cookie.mockReturnValue({ value: token }); mocks.user.mockResolvedValue(user(["content.view"]));
  mocks.privileged.mockImplementation(() => { throw new Error("Unexpected private assistance operation"); });
});
for (const [name, action] of Object.entries(actions)) {
  for (const scenario of ["anonymous", "malformed", "expired-or-revoked", "missing-permission"]) {
    it(name + " denies " + scenario + " before private effects", async () => {
      if (scenario === "anonymous") mocks.cookie.mockReturnValue(undefined);
      if (scenario === "malformed") mocks.cookie.mockReturnValue({ value: "forged-session" });
      if (scenario === "expired-or-revoked") mocks.user.mockResolvedValue(null);
      await expect(action()).rejects.toThrow("Synthetic redirect: /admin/" + (scenario === "missing-permission" ? "forbidden" : "login"));
      if (scenario === "anonymous" || scenario === "malformed") expect(mocks.user).not.toHaveBeenCalled();
      else expect(mocks.user).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "ACTIVE", sessions: { some: { tokenHash, expiresAt: { gt: expect.any(Date) } } } } }));
      expect(mocks.privileged).not.toHaveBeenCalled();
    });
  }
}
for (const missing of ["appeal.create", "assistance.view", "assistance.update"]) {
  it("conversion independently requires " + missing, async () => {
    mocks.user.mockResolvedValue(user(["appeal.create", "assistance.view", "assistance.update"].filter(key => key !== missing)));
    await expect(actions.convertToAppeal()).rejects.toThrow("Synthetic redirect: /admin/forbidden");
    expect(mocks.privileged).not.toHaveBeenCalled();
  });
}
it("authorized conversion reaches version validation without private effects", async () => {
  mocks.user.mockResolvedValue(user(["appeal.create", "assistance.view", "assistance.update"]));
  await expect(actions.convertToAppeal()).rejects.toThrow("Conversion version is missing or invalid");
  expect(mocks.privileged).not.toHaveBeenCalled();
});

for (const [name, action] of Object.entries(actions)) {
  it(name + " accepts its required permissions before version validation", async () => {
    const permissions = name === "convertToAppeal" ? ["appeal.create", "assistance.view", "assistance.update"] : [name === "assignRequest" ? "assistance.assign" : "assistance.update"];
    mocks.user.mockResolvedValue(user(permissions));
    const result = await action().then(value => value, error => error as Error);
    const message = result instanceof Error ? result.message : result?.message;
    expect(message).toMatch(/version is missing or invalid/);
    expect(mocks.user).toHaveBeenCalled();
    expect(mocks.privileged).not.toHaveBeenCalled();
  });
}
