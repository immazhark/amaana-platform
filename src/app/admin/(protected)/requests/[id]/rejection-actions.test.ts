import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ cookie: vi.fn(), cookieSet: vi.fn(), cookieDelete: vi.fn(), user: vi.fn(), revalidate: vi.fn(), reject: vi.fn() }));

vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookie, set: mocks.cookieSet, delete: mocks.cookieDelete }) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error("Synthetic redirect: " + path); } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findFirst: mocks.user } } }));
vi.mock("@/lib/assistance-rejection-service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/assistance-rejection-service")>("@/lib/assistance-rejection-service");
  return { ...actual, rejectAssistanceRequest: mocks.reject };
});

import { AssistanceRejectionError } from "@/lib/assistance-rejection-service";
import { rejectRequestAction } from "./rejection-actions";

const token = Buffer.alloc(32, 0x3c).toString("base64url");
const tokenHash = createHash("sha256").update(token).digest("hex");
const staff = (permissions: string[]) => ({ id: "synthetic-staff", status: "ACTIVE", roles: [{ role: { permissions: permissions.map(key => ({ permission: { key } })) } }] });
const approver = () => staff(["assistance.view", "assistance.update", "assistance.approve"]);

const ID = "synthetic-request-id";
const REQUEST_VERSION = "2026-11-22T04:00:00.000Z";
const VERIFICATION_VERSION = "2026-11-22T04:05:00.000Z";
const form = (over: Record<string, string | null> = {}) => {
  const data = new FormData();
  const fields: Record<string, string | null> = {
    id: ID, expectedRequestUpdatedAt: REQUEST_VERSION, expectedVerificationUpdatedAt: VERIFICATION_VERSION,
    reason: "Duplicate of an earlier request", confirmRejection: "on", ...over,
  };
  for (const [key, value] of Object.entries(fields)) if (value !== null) data.set(key, value);
  return data;
};
/** The address the action redirected to (it throws, as the real redirect does). */
const redirected = async (data: FormData) => {
  try { await rejectRequestAction(data); } catch (error) {
    const message = (error as Error).message;
    if (message.startsWith("Synthetic redirect: ")) return message.slice("Synthetic redirect: ".length);
    throw error;
  }
  throw new Error("Expected a redirect");
};
const base = `/admin/requests/${ID}`;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookie.mockReturnValue({ value: token });
  mocks.user.mockResolvedValue(approver());
  mocks.reject.mockResolvedValue({ outcome: "rejected", status: "REJECTED", rejectedAt: new Date("2026-11-22T04:10:00.000Z"), reviewerName: "Synthetic Approver" });
});

describe("authorization comes before everything", () => {
  it.each([
    ["anonymous", () => mocks.cookie.mockReturnValue(undefined), "/admin/login"],
    ["a forged cookie", () => mocks.cookie.mockReturnValue({ value: "forged-session" }), "/admin/login"],
    ["an expired or revoked session", () => mocks.user.mockResolvedValue(null), "/admin/login"],
    ["a signed-in user without assistance.update", () => mocks.user.mockResolvedValue(staff(["assistance.view", "assistance.approve"])), "/admin/forbidden"],
  ])("denies %s before any lookup, cookie or change", async (_name, arrange, destination) => {
    arrange();
    await expect(rejectRequestAction(form())).rejects.toThrow("Synthetic redirect: " + destination);
    expect(mocks.reject).not.toHaveBeenCalled();
    expect(mocks.cookieSet).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("looks the session up with the hashed token", async () => {
    mocks.user.mockResolvedValue(null);
    await expect(rejectRequestAction(form())).rejects.toThrow();
    expect(mocks.user).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "ACTIVE", sessions: { some: { tokenHash, expiresAt: { gt: expect.any(Date) } } } } }));
  });

  it("sends a reviewer who can edit but not approve back with the reason approval is needed, and changes nothing", async () => {
    mocks.user.mockResolvedValue(staff(["assistance.view", "assistance.update"]));
    expect(await redirected(form())).toBe(`${base}?reject=error&code=forbidden#reject-errors`);
    expect(mocks.reject).not.toHaveBeenCalled();
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });
});

describe("a rejection reads only the reason and the confirmation", () => {
  it("rejects with just a reason and the confirmation, passing the signed-in user as the actor", async () => {
    expect(await redirected(form({ reason: "  Not eligible  " }))).toBe(`${base}?reject=done&o=rejected#reject-heading`);
    expect(mocks.reject).toHaveBeenCalledOnce();
    expect(mocks.reject).toHaveBeenCalledWith({
      requestId: ID, reason: "Not eligible", actorId: "synthetic-staff",
      expectedRequestUpdatedAt: new Date(REQUEST_VERSION), expectedVerificationUpdatedAt: new Date(VERIFICATION_VERSION),
    });
    expect(mocks.revalidate).toHaveBeenCalledWith(`/admin/requests/${ID}`);
    expect(mocks.revalidate).toHaveBeenCalledWith("/admin");
  });

  it("is not blocked by invalid unsaved approval inputs, unresolved consents or an old status choice", async () => {
    const result = await redirected(form({
      verifiedNeedAmount: "not a number", approvedPublicTarget: "-5", paymentDestination: "", verificationSummary: "", decision: "PENDING",
      publicNameConsent: "UNCONFIRMED", zakatStatus: "UNREVIEWED", status: "APPROVED", markComplete: "on",
    }));
    expect(result).toContain("reject=done");
    expect(Object.keys(mocks.reject.mock.calls[0]![0]).sort()).toEqual(["actorId", "expectedRequestUpdatedAt", "expectedVerificationUpdatedAt", "reason", "requestId"]);
  });

  it("accepts a request that has no verification record yet", async () => {
    expect(await redirected(form({ expectedVerificationUpdatedAt: "" }))).toContain("reject=done");
    expect(mocks.reject.mock.calls[0]![0].expectedVerificationUpdatedAt).toBeNull();
  });

  it("clears any draft the reviewer had left, once the decision is recorded", async () => {
    await redirected(form());
    expect(mocks.cookieDelete).toHaveBeenCalledWith({ name: `amaana_rd_${ID}`, path: "/admin/requests" });
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });

  it("shows a repeat of an existing rejection as already done, not as a second decision", async () => {
    mocks.reject.mockResolvedValue({ outcome: "already_rejected", status: "REJECTED", rejectedAt: new Date("2026-11-22T03:00:00.000Z"), reviewerName: "Earlier Reviewer" });
    expect(await redirected(form())).toBe(`${base}?reject=done&o=already_rejected#reject-heading`);
  });
});

describe("a correctable error keeps what was typed, privately, and lists every problem", () => {
  const draft = (reason: string) => ({ name: `amaana_rd_${ID}`, value: encodeURIComponent(reason) });

  it("lists every problem together and holds the typed reason in a short-lived, httpOnly, same-site cookie", async () => {
    expect(await redirected(form({ reason: "  ", confirmRejection: null }))).toBe(`${base}?reject=error&e=reason-missing%2Cconfirmation#reject-errors`);
    expect(mocks.cookieSet).toHaveBeenCalledWith(draft("  ").name, draft("  ").value, expect.objectContaining({ httpOnly: true, sameSite: "strict", path: "/admin/requests", maxAge: 300 }));
    expect(mocks.reject).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("keeps a reason that is only too short, so it can be extended instead of retyped", async () => {
    expect(await redirected(form({ reason: "no" }))).toBe(`${base}?reject=error&e=reason-short#reject-errors`);
    expect(mocks.cookieSet).toHaveBeenCalledWith(draft("no").name, "no", expect.any(Object));
  });

  it("keeps an oversized reason for editing", async () => {
    const long = "a".repeat(2001);
    expect(await redirected(form({ reason: long }))).toBe(`${base}?reject=error&e=reason-long#reject-errors`);
    expect(mocks.cookieSet).toHaveBeenCalledWith(draft(long).name, long, expect.any(Object));
  });

  it("drops a draft too large for a cookie instead of failing the redirect", async () => {
    expect(await redirected(form({ reason: "అ".repeat(2001) }))).toContain("e=reason-long");
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });

  it("refuses a repeated field rather than guessing which value was meant", async () => {
    const data = form();
    data.append("reason", "A second reason field");
    expect(await redirected(data)).toBe(`${base}?reject=error&code=form#reject-errors`);
    expect(mocks.reject).not.toHaveBeenCalled();
  });

  it("refuses a missing or invalid version before touching the request, and tells the reviewer to refresh", async () => {
    for (const value of [null, "", "yesterday", "2026-13-45T99:00:00Z"]) {
      expect(await redirected(form({ expectedRequestUpdatedAt: value })), String(value)).toBe(`${base}?reject=error&code=version#reject-errors`);
    }
    expect(await redirected(form({ expectedVerificationUpdatedAt: "not a date" }))).toContain("code=version");
    expect(mocks.reject).not.toHaveBeenCalled();
  });

  it("sends a missing request id to the queue, with no cookie and no change", async () => {
    expect(await redirected(form({ id: "" }))).toBe("/admin");
    expect(mocks.reject).not.toHaveBeenCalled();
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });

  it("holds no draft for a request id that is not a plain identifier, so a crafted id cannot shape a cookie name", async () => {
    expect(await redirected(form({ id: "a b;c=d", reason: "no" }))).toContain("reject=error");
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });
});

describe("a refused decision", () => {
  it.each(["linked_appeal", "closed", "stale_request", "stale_verification", "not_found", "not_eligible"] as const)("sends %s back with its code and keeps the reason", async code => {
    mocks.reject.mockRejectedValue(new AssistanceRejectionError(code, "Safe message."));
    expect(await redirected(form({ reason: "Keep this text" }))).toBe(`${base}?reject=error&code=${code}#reject-errors`);
    expect(mocks.cookieSet).toHaveBeenCalledWith(`amaana_rd_${ID}`, "Keep%20this%20text", expect.any(Object));
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("never turns an unexpected failure into a message, so internals cannot leak", async () => {
    mocks.reject.mockRejectedValue(new Error("connection string postgres://secret"));
    await expect(rejectRequestAction(form())).rejects.toThrow("connection string postgres://secret");
    expect(mocks.revalidate).not.toHaveBeenCalled();
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });
});

describe("the private reason never appears in an address", () => {
  it("is absent from the redirect for every outcome, even when the reason is long and unusual", async () => {
    const secret = "PRIVATE-REASON-" + "x".repeat(40);
    const addresses: string[] = [];
    addresses.push(await redirected(form({ reason: secret })));
    mocks.reject.mockRejectedValue(new AssistanceRejectionError("stale_request", "Changed."));
    addresses.push(await redirected(form({ reason: secret })));
    addresses.push(await redirected(form({ reason: secret, confirmRejection: null })));
    addresses.push(await redirected(form({ reason: secret, expectedRequestUpdatedAt: "bad" })));
    mocks.user.mockResolvedValue(staff(["assistance.update"]));
    addresses.push(await redirected(form({ reason: secret })));
    for (const address of addresses) {
      expect(address).not.toContain("PRIVATE");
      expect(decodeURIComponent(address)).not.toContain("PRIVATE");
    }
    expect(addresses).toHaveLength(5);
  });
});
