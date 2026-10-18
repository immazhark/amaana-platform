import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  cookieSet: vi.fn(),
  expiredSessions: vi.fn(),
  newSession: vi.fn(),
  updateLoginAttempt: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    session: { deleteMany: mocks.expiredSessions, create: mocks.newSession },
    loginAttempt: { update: mocks.updateLoginAttempt },
    $transaction: mocks.transaction,
  },
}));

import { createSession } from "./auth";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.cookies.mockResolvedValue({ set: mocks.cookieSet });
  mocks.expiredSessions.mockReturnValue({ op: "delete-expired" });
  mocks.newSession.mockReturnValue({ op: "create-session" });
  mocks.updateLoginAttempt.mockReturnValue({ op: "release-login-reservation" });
  mocks.transaction.mockResolvedValue([]);
});

describe("atomic admin session admission", () => {
  it("persists the session and successful login reservation in one transaction before issuing the cookie", async () => {
    await createSession("synthetic-admin", "synthetic-attempt");

    expect(mocks.updateLoginAttempt).toHaveBeenCalledWith({
      where: { id: "synthetic-attempt" },
      data: { succeeded: true },
    });
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.transaction.mock.calls[0]?.[0]).toEqual([
      { op: "delete-expired" },
      { op: "create-session" },
      { op: "release-login-reservation" },
    ]);
    expect(mocks.cookieSet).toHaveBeenCalledOnce();
    expect(mocks.cookieSet.mock.calls[0]?.[2]).toEqual(expect.objectContaining({
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    }));
  });

  it("does not issue a valid session cookie if the atomic persistence operation fails", async () => {
    mocks.transaction.mockRejectedValueOnce(new Error("Synthetic session or admission ledger failure"));

    await expect(createSession("synthetic-admin", "synthetic-attempt"))
      .rejects.toThrow("Synthetic session or admission ledger failure");

    expect(mocks.transaction.mock.calls[0]?.[0]).toHaveLength(3);
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });

  it("preserves standalone session creation without changing unrelated callers", async () => {
    await createSession("synthetic-admin");

    expect(mocks.transaction.mock.calls[0]?.[0]).toHaveLength(2);
    expect(mocks.updateLoginAttempt).not.toHaveBeenCalled();
    expect(mocks.cookieSet).toHaveBeenCalledOnce();
  });
});
