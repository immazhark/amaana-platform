import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  userFind: vi.fn(),
  attemptCount: vi.fn(),
  advisoryLock: vi.fn(),
  attemptCreate: vi.fn(),
  attemptUpdate: vi.fn(),
  transaction: vi.fn(),
  verifyPassword: vi.fn(),
  passwordNeedsRehash: vi.fn(),
  hashPassword: vi.fn(),
  credentialUpdateMany: vi.fn(),
  createSession: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-real-ip": "192.0.2.1" }) }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
vi.mock("@/lib/auth", () => ({ createSession: mocks.createSession, destroySession: vi.fn(), getCurrentUser: vi.fn() }));
vi.mock("@/lib/password", () => ({
  verifyPassword: mocks.verifyPassword,
  passwordNeedsRehash: mocks.passwordNeedsRehash,
  hashPassword: mocks.hashPassword,
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findUnique: mocks.userFind },
  loginAttempt: { count: mocks.attemptCount, create: mocks.attemptCreate, update: mocks.attemptUpdate },
  passwordCredential: { updateMany: mocks.credentialUpdateMany },
  auditEvent: { create: mocks.auditCreate },
  $transaction: mocks.transaction,
} }));

import { login } from "./actions";
import { AUTH_FAILURE_LIMIT, AUTH_FAILURE_WINDOW_MS } from "@/lib/auth-rate-limit";

type Attempt = { id: string; subjectHash: string; succeeded: boolean; createdAt: Date };
const attempts: Attempt[] = [];
const tx = {
  $queryRaw: mocks.advisoryLock,
  loginAttempt: { count: mocks.attemptCount, create: mocks.attemptCreate },
  passwordCredential: { updateMany: mocks.credentialUpdateMany },
  auditEvent: { create: mocks.auditCreate },
};

function form(email = "admin@example.invalid", password = "synthetic-password") {
  const data = new FormData();
  data.set("email", email);
  data.set("password", password);
  return data;
}

beforeEach(() => {
  vi.resetAllMocks();
  attempts.length = 0;
  vi.stubEnv("AUTH_RATE_LIMIT_PEPPER", "synthetic-test-pepper");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
  mocks.userFind.mockResolvedValue({ id: "admin", status: "ACTIVE", credential: { passwordHash: "synthetic-hash" } });
  mocks.verifyPassword.mockResolvedValue(false);
  mocks.credentialUpdateMany.mockResolvedValue({ count: 1 });
  mocks.advisoryLock.mockResolvedValue([{ acquired: "" }]);
  mocks.attemptCount.mockImplementation(async ({ where }: {
    where: { subjectHash: string; succeeded: boolean; createdAt: { gte: Date } };
  }) => attempts.filter(row => row.subjectHash === where.subjectHash && row.succeeded === where.succeeded && row.createdAt >= where.createdAt.gte).length);
  mocks.attemptCreate.mockImplementation(async ({ data }: {
    data: { subjectHash: string; succeeded?: boolean };
  }) => {
    const row = { id: `attempt-${attempts.length + 1}`, succeeded: false, createdAt: new Date(), ...data };
    attempts.push(row);
    return row;
  });
  mocks.attemptUpdate.mockImplementation(async ({ where, data }: {
    where: { id: string }; data: { succeeded: boolean };
  }) => {
    const row = attempts.find(item => item.id === where.id);
    if (!row) throw new Error("Attempt not found");
    Object.assign(row, data);
    return row;
  });
  // The production createSession performs the session and reservation write
  // atomically. Reproduce only its successful committed outcome at this mock
  // boundary; a rejected session creation must leave the reservation charged.
  mocks.createSession.mockImplementation(async (userId: string, attemptId: string) => {
    await mocks.attemptUpdate({ where: { id: attemptId }, data: { succeeded: true } });
    await mocks.auditCreate({
      data: { actorId: userId, action: "session.login", entityType: "User", entityId: userId },
    });
  });
  // Serialize the fake database boundary to model advisory-lock admission.
  // Password work deliberately remains outside the transaction.
  let tail: Promise<unknown> = Promise.resolve();
  mocks.transaction.mockImplementation((operation: (db: typeof tx) => Promise<unknown>) => {
    const result = tail.then(() => operation(tx));
    tail = result.catch(() => undefined);
    return result;
  });
});

afterEach(() => vi.unstubAllEnvs());

describe("admin login admission", () => {
  it.each(["email", "password"])("charges a rate-limit reservation for duplicated %s and never authenticates", async field => {
    const request = form();
    request.append(field, "alternate-value");
    await expect(login(request)).rejects.toThrow("redirect:/admin/login?error=invalid");
    expect(attempts).toHaveLength(1);
    expect(mocks.userFind).not.toHaveBeenCalled();
    expect(mocks.verifyPassword).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it.each(["email", "password"])("charges a reservation and rejects file-valued %s before lookup", async field => {
    const request = form();
    request.set(field, new File(["invalid"], "credential.txt"));
    await expect(login(request)).rejects.toThrow("redirect:/admin/login?error=invalid");
    expect(attempts).toHaveLength(1);
    expect(mocks.userFind).not.toHaveBeenCalled();
    expect(mocks.verifyPassword).not.toHaveBeenCalled();
  });


  it("admits only the remaining quota while concurrent password checks are pending", async () => {
    let finishPasswordChecks!: (matches: boolean) => void;
    const pendingCheck = new Promise<boolean>(resolve => { finishPasswordChecks = resolve; });
    mocks.verifyPassword.mockReturnValue(pendingCheck);
    const results = Promise.allSettled(Array.from({ length: AUTH_FAILURE_LIMIT + 5 }, () => login(form())));
    await new Promise(resolve => setImmediate(resolve));
    const inFlightChecks = mocks.verifyPassword.mock.calls.length;
    const reserved = attempts.length;
    finishPasswordChecks(false);
    const outcomes = await results;

    expect(inFlightChecks).toBe(AUTH_FAILURE_LIMIT);
    expect(reserved).toBe(AUTH_FAILURE_LIMIT);
    expect(mocks.userFind).toHaveBeenCalledTimes(AUTH_FAILURE_LIMIT);
    expect(outcomes.filter(result => result.status === "rejected" && result.reason.message === "redirect:/admin/login?error=locked")).toHaveLength(5);
    expect(outcomes.filter(result => result.status === "rejected" && result.reason.message === "redirect:/admin/login?error=invalid")).toHaveLength(AUTH_FAILURE_LIMIT);
    expect(mocks.createSession).not.toHaveBeenCalled();
    expect(attempts.every(row => /^[a-f0-9]{64}$/.test(row.subjectHash))).toBe(true);
  });

  it("keeps an interrupted password check charged against the quota", async () => {
    mocks.verifyPassword.mockRejectedValue(new Error("Synthetic verifier failure"));
    await expect(login(form())).rejects.toThrow("Synthetic verifier failure");
    expect(attempts).toHaveLength(1);
    expect(attempts[0]?.succeeded).toBe(false);
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("does not read credentials or verify a password when admission persistence fails", async () => {
    mocks.transaction.mockRejectedValue(new Error("Synthetic ledger outage"));
    await expect(login(form())).rejects.toThrow("Synthetic ledger outage");
    expect(mocks.userFind).not.toHaveBeenCalled();
    expect(mocks.verifyPassword).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("keeps a failed reservation when session persistence fails", async () => {
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.createSession.mockRejectedValueOnce(new Error("Synthetic session persistence failure"));

    await expect(login(form())).rejects.toThrow("Synthetic session persistence failure");

    expect(attempts).toHaveLength(1);
    expect(attempts[0]?.succeeded).toBe(false);
    expect(mocks.attemptUpdate).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("marks only its successful reservation without erasing earlier failures", async () => {
    await expect(login(form())).rejects.toThrow("redirect:/admin/login?error=invalid");
    mocks.verifyPassword.mockResolvedValueOnce(true);
    await expect(login(form())).rejects.toThrow("redirect:/admin");
    expect(attempts.map(row => row.succeeded)).toEqual([false, true]);
    expect(mocks.attemptUpdate).toHaveBeenCalledWith({ where: { id: "attempt-2" }, data: { succeeded: true } });
    expect(mocks.createSession).toHaveBeenCalledWith("admin", "attempt-2");
  });

  it("waits for the per-subject lock before reading the admission ledger", async () => {
    let releaseLock!: (value: { acquired: string }[]) => void;
    mocks.advisoryLock.mockReturnValueOnce(new Promise(resolve => { releaseLock = resolve; }));
    const pending = login(form());
    await new Promise(resolve => setImmediate(resolve));
    expect(mocks.advisoryLock).toHaveBeenCalledOnce();
    expect(mocks.attemptCount).not.toHaveBeenCalled();
    expect(mocks.userFind).not.toHaveBeenCalled();

    releaseLock([{ acquired: "" }]);
    await expect(pending).rejects.toThrow("redirect:/admin/login?error=invalid");
    expect(attempts).toHaveLength(1);
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "ReadCommitted" });
    expect(mocks.verifyPassword).toHaveBeenCalledOnce();
  });

  it("fails closed without password work when the per-subject lock is unavailable", async () => {
    mocks.advisoryLock.mockRejectedValueOnce(new Error("Synthetic advisory lock failure"));
    await expect(login(form())).rejects.toThrow("Synthetic advisory lock failure");
    expect(mocks.attemptCount).not.toHaveBeenCalled();
    expect(mocks.userFind).not.toHaveBeenCalled();
    expect(mocks.verifyPassword).not.toHaveBeenCalled();
    expect(attempts).toHaveLength(0);
  });

  it("does not authenticate or retry blindly when the admission transaction conflicts", async () => {
    mocks.transaction.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("Synthetic conflict", {
      code: "P2034", clientVersion: "test",
    }));
    await expect(login(form())).rejects.toThrow("Synthetic conflict");
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.userFind).not.toHaveBeenCalled();
    expect(mocks.verifyPassword).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("preserves password upgrading and login auditing for a successful reservation", async () => {
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.passwordNeedsRehash.mockReturnValue(true);
    mocks.hashPassword.mockResolvedValue("upgraded-synthetic-hash");
    await expect(login(form())).rejects.toThrow("redirect:/admin");
    expect(mocks.credentialUpdateMany).toHaveBeenCalledWith({
      where: { userId: "admin", passwordHash: "synthetic-hash" },
      data: { passwordHash: "upgraded-synthetic-hash" },
    });
    expect(mocks.auditCreate.mock.calls.map(([input]) => input.data.action)).toEqual(["credential.password_rehashed", "session.login"]);
    expect(attempts.map(row => row.succeeded)).toEqual([true]);
  });

  it("does not restore an old password after a concurrent credential change", async () => {
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.passwordNeedsRehash.mockReturnValue(true);
    mocks.hashPassword.mockResolvedValue("upgraded-synthetic-hash");
    // A concurrent password reset or different login has changed the
    // credential since the old digest was fetched and verified.
    mocks.credentialUpdateMany.mockResolvedValueOnce({ count: 0 });

    await expect(login(form())).rejects.toThrow("redirect:/admin/login?error=invalid");
    expect(mocks.credentialUpdateMany).toHaveBeenCalledWith({
      where: { userId: "admin", passwordHash: "synthetic-hash" },
      data: { passwordHash: "upgraded-synthetic-hash" },
    });
    expect(mocks.auditCreate).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
    expect(attempts.map(attempt => attempt.succeeded)).toEqual([false]);
  });

  it("does not issue a session when the password-upgrade audit transaction fails", async () => {
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.passwordNeedsRehash.mockReturnValue(true);
    mocks.hashPassword.mockResolvedValue("upgraded-synthetic-hash");
    mocks.auditCreate.mockRejectedValueOnce(new Error("synthetic credential audit failure"));

    await expect(login(form())).rejects.toThrow("synthetic credential audit failure");
    expect(mocks.credentialUpdateMany).toHaveBeenCalledWith({
      where: { userId: "admin", passwordHash: "synthetic-hash" },
      data: { passwordHash: "upgraded-synthetic-hash" },
    });
    expect(mocks.createSession).not.toHaveBeenCalled();
    expect(attempts.map(attempt => attempt.succeeded)).toEqual([false]);
  });

  it("keeps malformed input within the quota without password work", async () => {
    await expect(login(form("not-an-email"))).rejects.toThrow("redirect:/admin/login?error=invalid");
    expect(attempts).toHaveLength(1);
    expect(mocks.userFind).not.toHaveBeenCalled();
    expect(mocks.verifyPassword).not.toHaveBeenCalled();
  });

  it("allows a fresh attempt after the rolling failure window expires", async () => {
    for (let i = 0; i < AUTH_FAILURE_LIMIT; i++) {
      await expect(login(form())).rejects.toThrow("redirect:/admin/login?error=invalid");
    }
    await expect(login(form())).rejects.toThrow("redirect:/admin/login?error=locked");
    for (const row of attempts) row.createdAt = new Date(Date.now() - AUTH_FAILURE_WINDOW_MS - 1_000);
    await expect(login(form())).rejects.toThrow("redirect:/admin/login?error=invalid");
    expect(mocks.verifyPassword).toHaveBeenCalledTimes(AUTH_FAILURE_LIMIT + 1);
  });

  it.each([null, { id: "disabled-admin", status: "DISABLED", credential: { passwordHash: "synthetic-hash" } }])("retains a failed reservation for an unknown or disabled account", async user => {
    mocks.userFind.mockResolvedValue(user);
    mocks.verifyPassword.mockResolvedValue(true);
    await expect(login(form())).rejects.toThrow("redirect:/admin/login?error=invalid");
    expect(attempts).toHaveLength(1);
    expect(attempts[0]?.succeeded).toBe(false);
    expect(mocks.createSession).not.toHaveBeenCalled();
  });
});
