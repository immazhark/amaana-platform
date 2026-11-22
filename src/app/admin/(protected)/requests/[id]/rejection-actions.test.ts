import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ cookie: vi.fn(), user: vi.fn(), revalidate: vi.fn(), reject: vi.fn() }));

vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookie }) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error("Synthetic redirect: " + path); } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findFirst: mocks.user } } }));
vi.mock("@/lib/assistance-rejection-service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/assistance-rejection-service")>("@/lib/assistance-rejection-service");
  return { ...actual, rejectAssistanceRequest: mocks.reject };
});

import { AssistanceRejectionError } from "@/lib/assistance-rejection-service";
import { rejectRequestAction, type RejectionFormState } from "./rejection-actions";

const token = Buffer.alloc(32, 0x3c).toString("base64url");
const tokenHash = createHash("sha256").update(token).digest("hex");
const idle: RejectionFormState = { kind: "idle", message: "" };
const staff = (permissions: string[]) => ({ id: "synthetic-staff", status: "ACTIVE", roles: [{ role: { permissions: permissions.map(key => ({ permission: { key } })) } }] });
const approver = () => staff(["assistance.view", "assistance.update", "assistance.approve"]);

const REQUEST_VERSION = "2026-11-22T04:00:00.000Z";
const VERIFICATION_VERSION = "2026-11-22T04:05:00.000Z";
const form = (over: Record<string, string | null> = {}) => {
  const data = new FormData();
  const fields: Record<string, string | null> = {
    id: "synthetic-request", expectedRequestUpdatedAt: REQUEST_VERSION, expectedVerificationUpdatedAt: VERIFICATION_VERSION,
    reason: "Duplicate of an earlier request", confirmRejection: "on", ...over,
  };
  for (const [key, value] of Object.entries(fields)) if (value !== null) data.set(key, value);
  return data;
};

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
  ])("denies %s before any lookup or change", async (_name, arrange, destination) => {
    arrange();
    await expect(rejectRequestAction(idle, form())).rejects.toThrow("Synthetic redirect: " + destination);
    expect(mocks.reject).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("looks the session up with the hashed token", async () => {
    mocks.user.mockResolvedValue(null);
    await expect(rejectRequestAction(idle, form())).rejects.toThrow();
    expect(mocks.user).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "ACTIVE", sessions: { some: { tokenHash, expiresAt: { gt: expect.any(Date) } } } } }));
  });

  it("tells a reviewer who can edit but not approve that approval authority is needed, and changes nothing", async () => {
    mocks.user.mockResolvedValue(staff(["assistance.view", "assistance.update"]));
    const state = await rejectRequestAction(idle, form());
    expect(state).toMatchObject({ kind: "error", message: "Approval permission is required to reject a request." });
    expect(mocks.reject).not.toHaveBeenCalled();
  });
});

describe("a rejection reads only the reason and the confirmation", () => {
  it("rejects with just a reason and the confirmation, passing the signed-in user as the actor", async () => {
    const state = await rejectRequestAction(idle, form({ reason: "  Not eligible  " }));
    expect(state).toMatchObject({ kind: "success", result: { outcome: "rejected", rejectedAt: "2026-11-22T04:10:00.000Z", reviewerName: "Synthetic Approver" } });
    expect(mocks.reject).toHaveBeenCalledOnce();
    expect(mocks.reject).toHaveBeenCalledWith({
      requestId: "synthetic-request", reason: "Not eligible", actorId: "synthetic-staff",
      expectedRequestUpdatedAt: new Date(REQUEST_VERSION), expectedVerificationUpdatedAt: new Date(VERIFICATION_VERSION),
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/admin/requests/synthetic-request");
    expect(mocks.revalidate).toHaveBeenCalledWith("/admin");
  });

  it("is not blocked by invalid unsaved approval inputs, unresolved consents or an old status choice", async () => {
    const state = await rejectRequestAction(idle, form({
      verifiedNeedAmount: "not a number", approvedPublicTarget: "-5", paymentDestination: "", verificationSummary: "", decision: "PENDING",
      publicNameConsent: "UNCONFIRMED", zakatStatus: "UNREVIEWED", status: "APPROVED", markComplete: "on",
    }));
    expect(state.kind).toBe("success");
    expect(Object.keys(mocks.reject.mock.calls[0]![0]).sort()).toEqual(["actorId", "expectedRequestUpdatedAt", "expectedVerificationUpdatedAt", "reason", "requestId"]);
  });

  it("accepts a request that has no verification record yet", async () => {
    const state = await rejectRequestAction(idle, form({ expectedVerificationUpdatedAt: "" }));
    expect(state.kind).toBe("success");
    expect(mocks.reject.mock.calls[0]![0].expectedVerificationUpdatedAt).toBeNull();
  });
});

describe("field errors", () => {
  it("returns every actionable error together, keeps what the reviewer typed, and changes nothing", async () => {
    const state = await rejectRequestAction(idle, form({ reason: "  ", confirmRejection: null }));
    expect(state).toEqual({
      kind: "error", message: "Fix the highlighted fields to reject this request.",
      fieldErrors: { reason: "Enter the reason for rejecting this request.", confirmation: "Confirm the rejection to continue." },
      // Exactly what was typed, including the spaces, so the field comes back as the reviewer left it.
      values: { reason: "  " },
    });
    expect(mocks.reject).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("keeps a reason that is only too short, so it can be extended instead of retyped", async () => {
    const state = await rejectRequestAction(idle, form({ reason: "no" }));
    expect(state).toMatchObject({ kind: "error", fieldErrors: { reason: expect.stringContaining("at least 3") }, values: { reason: "no" } });
  });

  it("keeps an oversized reason intact for editing", async () => {
    const long = "a".repeat(2001);
    const state = await rejectRequestAction(idle, form({ reason: long }));
    expect(state).toMatchObject({ kind: "error", fieldErrors: { reason: expect.stringContaining("2000") }, values: { reason: long } });
    expect(mocks.reject).not.toHaveBeenCalled();
  });

  it("refuses a repeated field rather than guessing which value was meant", async () => {
    const data = form();
    data.append("reason", "A second reason field");
    const state = await rejectRequestAction(idle, data);
    expect(state.kind).toBe("error");
    expect(mocks.reject).not.toHaveBeenCalled();
  });

  it("refuses a missing or invalid version before touching the request, and tells the reviewer to refresh", async () => {
    for (const value of [null, "", "yesterday", "2026-13-45T99:00:00Z"]) {
      const state = await rejectRequestAction(idle, form({ expectedRequestUpdatedAt: value }));
      expect(state, String(value)).toMatchObject({ kind: "error", message: expect.stringContaining("Refresh") });
    }
    expect(await rejectRequestAction(idle, form({ expectedVerificationUpdatedAt: "not a date" }))).toMatchObject({ kind: "error" });
    expect(mocks.reject).not.toHaveBeenCalled();
  });

  it("refuses a missing request id", async () => {
    expect((await rejectRequestAction(idle, form({ id: "" }))).kind).toBe("error");
    expect(mocks.reject).not.toHaveBeenCalled();
  });
});

describe("outcomes of the decision itself", () => {
  it("shows a repeat of an existing rejection as already done, not as a second decision", async () => {
    mocks.reject.mockResolvedValue({ outcome: "already_rejected", status: "REJECTED", rejectedAt: new Date("2026-11-22T03:00:00.000Z"), reviewerName: "Earlier Reviewer" });
    const state = await rejectRequestAction(idle, form());
    expect(state).toMatchObject({ kind: "success", result: { outcome: "already_rejected", reviewerName: "Earlier Reviewer" } });
  });

  it("never invents a time or reviewer for a legacy rejection that has no recorded decision", async () => {
    mocks.reject.mockResolvedValue({ outcome: "already_rejected", status: "REJECTED", rejectedAt: null, reviewerName: null });
    expect(await rejectRequestAction(idle, form())).toMatchObject({ kind: "success", result: { outcome: "already_rejected", rejectedAt: null, reviewerName: null } });
  });

  it.each(["linked_appeal", "closed", "stale_request", "stale_verification", "not_found", "not_eligible"] as const)("shows the safe message for %s and keeps the reason", async code => {
    mocks.reject.mockRejectedValue(new AssistanceRejectionError(code, "Safe " + code + " message."));
    const state = await rejectRequestAction(idle, form({ reason: "Keep this text" }));
    expect(state).toEqual({ kind: "error", message: "Safe " + code + " message.", values: { reason: "Keep this text" }, code });
  });

  it("never turns an unexpected failure into a message, so internals cannot leak", async () => {
    mocks.reject.mockRejectedValue(new Error("connection string postgres://secret"));
    await expect(rejectRequestAction(idle, form())).rejects.toThrow("connection string postgres://secret");
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("does not report success, or revalidate, when the decision did not commit", async () => {
    mocks.reject.mockRejectedValue(new AssistanceRejectionError("stale_request", "Changed."));
    await rejectRequestAction(idle, form());
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
