import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ cookie: vi.fn(), cookieSet: vi.fn(), cookieDelete: vi.fn(), user: vi.fn(), revalidate: vi.fn(), approve: vi.fn(), draft: vi.fn() }));

vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.cookie, set: mocks.cookieSet, delete: mocks.cookieDelete }) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error("Synthetic redirect: " + path); } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findFirst: mocks.user } } }));
vi.mock("@/lib/assistance-approval-service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/assistance-approval-service")>("@/lib/assistance-approval-service");
  return { ...actual, approveAssistanceRequest: mocks.approve, saveApprovalDraft: mocks.draft };
});

import { AssistanceApprovalError } from "@/lib/assistance-approval-service";
import { approveRequestAction, approveRequestWithFeedback, saveReviewProgressWithFeedback } from "./approval-actions";

const token = Buffer.alloc(32, 0x3c).toString("base64url");
const staff = (permissions: string[]) => ({ id: "synthetic-staff", status: "ACTIVE", roles: [{ role: { permissions: permissions.map(key => ({ permission: { key } })) } }] });
const approver = () => staff(["assistance.view", "assistance.update", "assistance.approve"]);

const ID = "synthetic-request-id";
const REQUEST_VERSION = "2026-11-22T04:00:00.000Z";
const VERIFICATION_VERSION = "2026-11-22T04:05:00.000Z";
const complete: Record<string, string | null> = {
  id: ID, expectedRequestUpdatedAt: REQUEST_VERSION, expectedVerificationUpdatedAt: VERIFICATION_VERSION, decision: "APPROVED_PRIVATE",
  needConfirmed: "on", evidenceReviewed: "on", otherFundingChecked: "on", verifiedNeedAmount: "5000", approvedPublicTarget: "",
  paymentDestination: "Hospital billing desk", otherFundingNotes: "None found", verificationSummary: "Checked the bills and the letter.",
  confidentialityLevel: "CONFIDENTIAL", publicNameConsent: "UNCONFIRMED", photoConsent: "UNCONFIRMED", medicalDetailsConsent: "UNCONFIRMED",
  institutionNameConsent: "UNCONFIRMED", archiveConsent: "UNCONFIRMED", zakatStatus: "NOT_APPLICABLE", confirmApproval: "on",
};
const form = (over: Record<string, string | null> = {}) => {
  const data = new FormData();
  for (const [key, value] of Object.entries({ ...complete, ...over })) if (value !== null) data.set(key, value);
  return data;
};
const redirected = async (data: FormData) => {
  try { await approveRequestAction(data); } catch (error) {
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
  mocks.approve.mockResolvedValue({ outcome: "approved", status: "APPROVED", route: "APPROVED_PRIVATE", approvedAt: new Date("2026-11-22T05:00:00Z"), reviewerName: "Synthetic Approver" });
  mocks.draft.mockResolvedValue("saved");
});

describe("authorization comes before everything", () => {
  it.each([
    ["anonymous", () => mocks.cookie.mockReturnValue(undefined), "/admin/login"],
    ["a forged cookie", () => mocks.cookie.mockReturnValue({ value: "forged" }), "/admin/login"],
    ["an expired or revoked session", () => mocks.user.mockResolvedValue(null), "/admin/login"],
    ["a signed-in user without assistance.update", () => mocks.user.mockResolvedValue(staff(["assistance.view", "assistance.approve"])), "/admin/forbidden"],
  ])("denies %s before any change", async (_name, arrange, destination) => {
    arrange();
    await expect(approveRequestAction(form())).rejects.toThrow("Synthetic redirect: " + destination);
    expect(mocks.approve).not.toHaveBeenCalled();
    expect(mocks.draft).not.toHaveBeenCalled();
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });

  it("sends an editor who is not an approver back with the reason approval is needed, saving and changing nothing", async () => {
    mocks.user.mockResolvedValue(staff(["assistance.view", "assistance.update"]));
    expect(await redirected(form())).toBe(`${base}?approve=error&code=forbidden#approve-errors`);
    expect(mocks.approve).not.toHaveBeenCalled();
    expect(mocks.draft).not.toHaveBeenCalled();
  });
});

describe("a complete approval", () => {
  it("approves with the fields as entered, the signed-in user as the actor and the versions the page showed", async () => {
    expect(await redirected(form())).toBe(`${base}?approve=done&o=approved&r=APPROVED_PRIVATE#approve-heading`);
    expect(mocks.approve).toHaveBeenCalledOnce();
    const call = mocks.approve.mock.calls[0]![0];
    expect(call).toMatchObject({
      requestId: ID, route: "APPROVED_PRIVATE", actorId: "synthetic-staff",
      expectedRequestUpdatedAt: new Date(REQUEST_VERSION), expectedVerificationUpdatedAt: new Date(VERIFICATION_VERSION),
    });
    expect(call.fields).toEqual({
      needConfirmed: true, evidenceReviewed: true, otherFundingChecked: true, verifiedNeedAmount: 5000, approvedPublicTarget: null,
      paymentDestination: "Hospital billing desk", otherFundingNotes: "None found", verificationSummary: "Checked the bills and the letter.",
      confidentialityLevel: "CONFIDENTIAL", zakatStatus: "NOT_APPLICABLE", publicNameConsent: "UNCONFIRMED", photoConsent: "UNCONFIRMED",
      medicalDetailsConsent: "UNCONFIRMED", institutionNameConsent: "UNCONFIRMED", archiveConsent: "UNCONFIRMED",
    });
    expect(mocks.revalidate).toHaveBeenCalledWith(base);
    expect(mocks.revalidate).toHaveBeenCalledWith("/admin");
    expect(mocks.draft).not.toHaveBeenCalled();
  });

  it("approves a public case with the target, and clears any held amount text", async () => {
    mocks.approve.mockResolvedValue({ outcome: "approved", status: "APPROVED", route: "APPROVED_PUBLIC", approvedAt: new Date(), reviewerName: "Synthetic Approver" });
    const result = await redirected(form({ decision: "APPROVED_PUBLIC", approvedPublicTarget: "4500", publicNameConsent: "NOT_ALLOWED", photoConsent: "NOT_APPLICABLE", medicalDetailsConsent: "ALLOWED", institutionNameConsent: "NOT_ALLOWED", archiveConsent: "ALLOWED" }));
    expect(result).toBe(`${base}?approve=done&o=approved&r=APPROVED_PUBLIC#approve-heading`);
    expect(mocks.approve.mock.calls[0]![0].fields.approvedPublicTarget).toBe(4500);
    expect(mocks.cookieDelete).toHaveBeenCalledWith({ name: `amaana_ad_${ID}`, path: "/admin/requests" });
  });

  it("shows a repeat of an existing approval as already done", async () => {
    mocks.approve.mockResolvedValue({ outcome: "already_approved", status: "APPROVED", route: "APPROVED_PARTIAL", approvedAt: null, reviewerName: null });
    expect(await redirected(form())).toBe(`${base}?approve=done&o=already_approved&r=APPROVED_PARTIAL#approve-heading`);
  });

  it("accepts a request that has no verification record yet", async () => {
    expect(await redirected(form({ expectedVerificationUpdatedAt: "" }))).toContain("approve=done");
    expect(mocks.approve.mock.calls[0]![0].expectedVerificationUpdatedAt).toBeNull();
  });
});

describe("an approval that is not ready keeps what was entered, as saved progress, and lists every problem", () => {
  it("lists every missing check together and saves the entered fields as progress, deciding nothing", async () => {
    const result = await redirected(form({ needConfirmed: null, evidenceReviewed: null, verifiedNeedAmount: "", verificationSummary: "Half written", confirmApproval: null }));
    expect(result).toBe(`${base}?approve=error&e=needConfirmed%2CevidenceReviewed%2CverifiedNeedAmount%2Cconfirmation#approve-errors`);
    expect(mocks.approve).not.toHaveBeenCalled();
    expect(mocks.draft).toHaveBeenCalledOnce();
    expect(mocks.draft.mock.calls[0]![0]).toMatchObject({ requestId: ID, route: "APPROVED_PRIVATE", actorId: "synthetic-staff" });
    expect(mocks.draft.mock.calls[0]![0].fields).toMatchObject({ needConfirmed: false, evidenceReviewed: false, verifiedNeedAmount: null, verificationSummary: "Half written" });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("asks for a route when none or a non-approval decision is chosen, and saves without one", async () => {
    for (const decision of ["", "PENDING", "REFERRED", "DECLINED", "SOMETHING"]) {
      mocks.draft.mockClear();
      expect(await redirected(form({ decision })), decision).toContain("e=route");
      expect(mocks.draft.mock.calls[0]![0].route, decision).toBeNull();
    }
    expect(mocks.approve).not.toHaveBeenCalled();
  });

  it("holds the text of an amount that is not a valid amount in a small private cookie, and saves the rest", async () => {
    const result = await redirected(form({ verifiedNeedAmount: "five thousand", decision: "APPROVED_PUBLIC", approvedPublicTarget: "4,5oo" }));
    expect(result).toContain("e=");
    expect(decodeURIComponent(result)).toMatch(/verifiedNeedAmount_format/);
    expect(decodeURIComponent(result)).toMatch(/approvedPublicTarget_format/);
    expect(mocks.cookieSet).toHaveBeenCalledWith(`amaana_ad_${ID}`, encodeURIComponent(JSON.stringify({ v: "five thousand", t: "4,5oo" })), expect.objectContaining({ httpOnly: true, sameSite: "strict", path: "/admin/requests", maxAge: 300 }));
    expect(mocks.draft.mock.calls[0]![0].fields).toMatchObject({ verifiedNeedAmount: null, approvedPublicTarget: null });
  });

  it("names an overlong destination, summary or notes, and saves them trimmed to the limit", async () => {
    const result = await redirected(form({ paymentDestination: "d".repeat(501), verificationSummary: "s".repeat(5001), otherFundingNotes: "n".repeat(2001) }));
    for (const token of ["paymentDestination_long", "verificationSummary_long", "otherFundingNotes_long"]) expect(decodeURIComponent(result)).toContain(token);
    const saved = mocks.draft.mock.calls[0]![0].fields;
    expect(saved.paymentDestination.length).toBe(500);
    expect(saved.verificationSummary.length).toBe(5000);
    expect(saved.otherFundingNotes.length).toBe(2000);
  });

  it("names a target above the verified need on the public route, and a target on a route that is not public", async () => {
    expect(decodeURIComponent(await redirected(form({ decision: "APPROVED_PUBLIC", approvedPublicTarget: "9999", publicNameConsent: "NOT_ALLOWED", photoConsent: "NOT_APPLICABLE", medicalDetailsConsent: "ALLOWED", institutionNameConsent: "NOT_ALLOWED", archiveConsent: "ALLOWED" })))).toContain("approvedPublicTarget_exceeds");
    expect(decodeURIComponent(await redirected(form({ decision: "APPROVED_PARTIAL", approvedPublicTarget: "100" })))).toContain("approvedPublicTarget_notPublic");
  });

  it("names each unresolved disclosure permission on the public route", async () => {
    const result = decodeURIComponent(await redirected(form({ decision: "APPROVED_PUBLIC", approvedPublicTarget: "4000" })));
    for (const token of ["publicNameConsent", "photoConsent", "medicalDetailsConsent", "institutionNameConsent", "archiveConsent"]) expect(result).toContain(token);
  });

  it("never lets a failed progress save stop the redirect with its errors", async () => {
    mocks.draft.mockRejectedValue(new AssistanceApprovalError("stale_request", "Changed."));
    expect(await redirected(form({ needConfirmed: null }))).toContain("e=needConfirmed");
    mocks.draft.mockRejectedValue(new Error("connection string postgres://secret"));
    expect(await redirected(form({ needConfirmed: null }))).toContain("e=needConfirmed");
  });
});

describe("a manipulated or malformed submission fails safely", () => {
  it.each([
    ["an unknown consent value", { publicNameConsent: "SOMETHING" }],
    ["an unknown zakat value", { zakatStatus: "MAYBE" }],
    ["an unknown confidentiality value", { confidentialityLevel: "PUBLIC" }],
  ])("refuses %s as a malformed form, saving nothing", async (_name, over) => {
    expect(await redirected(form(over))).toBe(`${base}?approve=error&code=form#approve-errors`);
    expect(mocks.draft).not.toHaveBeenCalled();
    expect(mocks.approve).not.toHaveBeenCalled();
  });

  it("refuses a repeated field rather than guessing", async () => {
    const data = form();
    data.append("verificationSummary", "A second summary");
    expect(await redirected(data)).toBe(`${base}?approve=error&code=form#approve-errors`);
    expect(mocks.approve).not.toHaveBeenCalled();
  });

  it("refuses a missing or invalid version and tells the reviewer to refresh", async () => {
    for (const value of [null, "", "yesterday"]) expect(await redirected(form({ expectedRequestUpdatedAt: value })), String(value)).toBe(`${base}?approve=error&code=version#approve-errors`);
    expect(await redirected(form({ expectedVerificationUpdatedAt: "nope" }))).toContain("code=version");
    expect(mocks.approve).not.toHaveBeenCalled();
  });

  it("sends a missing request id to the queue", async () => {
    expect(await redirected(form({ id: "" }))).toBe("/admin");
    expect(mocks.approve).not.toHaveBeenCalled();
  });

  it("ignores rejection and status fields entirely", async () => {
    expect(await redirected(form({ status: "REJECTED", reason: "Duplicate", confirmRejection: "on", markComplete: "on" }))).toContain("approve=done");
    expect(Object.keys(mocks.approve.mock.calls[0]![0]).sort()).toEqual(["actorId", "capacityExceptionNote", "expectedRequestUpdatedAt", "expectedVerificationUpdatedAt", "fields", "requestId", "route"]);
  });
});

describe("a refused approval", () => {
  it.each(["linked_appeal", "rejected", "closed", "stale_request", "stale_verification", "not_found", "not_eligible"] as const)("sends %s back with its code and saves nothing further", async code => {
    mocks.approve.mockRejectedValue(new AssistanceApprovalError(code, "Safe message."));
    expect(await redirected(form())).toBe(`${base}?approve=error&code=${code}#approve-errors`);
    expect(mocks.revalidate).not.toHaveBeenCalled();
    expect(mocks.draft).not.toHaveBeenCalled();
  });

  it("turns the service's own list of unmet checks into the same tokens", async () => {
    mocks.approve.mockRejectedValue(new AssistanceApprovalError("incomplete", "Complete the checks.", { needConfirmed: "Need must be confirmed.", approvedPublicTarget_missing: "Approved public target must be recorded." }));
    expect(decodeURIComponent(await redirected(form()))).toContain("e=needConfirmed,approvedPublicTarget_missing");
  });

  it("never turns an unexpected failure into a message, so internals cannot leak", async () => {
    mocks.approve.mockRejectedValue(new Error("connection string postgres://secret"));
    await expect(approveRequestAction(form())).rejects.toThrow("connection string postgres://secret");
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});

describe("private text never appears in an address", () => {
  it("is absent from every redirect, whatever the outcome", async () => {
    const secret = "LEAKCHECK-SUMMARY-" + "x".repeat(40);
    const addresses = [
      await redirected(form({ verificationSummary: secret })),
      await redirected(form({ verificationSummary: secret, needConfirmed: null })),
      await redirected(form({ verificationSummary: secret, paymentDestination: "LEAKCHECK-DEST", verifiedNeedAmount: "LEAKCHECK-AMOUNT" })),
      await redirected(form({ verificationSummary: secret, expectedRequestUpdatedAt: "bad" })),
    ];
    mocks.approve.mockRejectedValue(new AssistanceApprovalError("stale_request", "Changed."));
    addresses.push(await redirected(form({ verificationSummary: secret })));
    mocks.user.mockResolvedValue(staff(["assistance.update"]));
    addresses.push(await redirected(form({ verificationSummary: secret })));
    for (const address of addresses) {
      expect(decodeURIComponent(address)).not.toContain("LEAKCHECK");
    }
    expect(addresses).toHaveLength(6);
  });
});


describe("Save review progress uses the guarded draft contract", () => {
  it("saves incomplete progress without deciding or requiring approval permission", async () => {
    mocks.user.mockResolvedValue(staff(["assistance.view", "assistance.update"]));
    const result = await saveReviewProgressWithFeedback({ kind: "idle", message: "" }, form({ decision: "PENDING", confirmApproval: null, verifiedNeedAmount: "", verificationSummary: "Half written" }));
    expect(result.kind).toBe("success");
    expect(mocks.draft).toHaveBeenCalledOnce();
    expect(mocks.approve).not.toHaveBeenCalled();
  });
  it("does not report a terminal case as saved", async () => {
    mocks.draft.mockResolvedValue("skipped");
    const result = await saveReviewProgressWithFeedback({ kind: "idle", message: "" }, form());
    expect(result.kind).toBe("error");
    expect(mocks.approve).not.toHaveBeenCalled();
  });
  it("does not report failed saving as saved", async () => {
    mocks.draft.mockRejectedValue(new AssistanceApprovalError("stale_verification", "Review changed"));
    const result = await saveReviewProgressWithFeedback({ kind: "idle", message: "" }, form());
    expect(result.kind).toBe("error");
    expect(result.message).toContain("Refresh");
  });
});


describe("inline approval failures preserve the current form", () => {
  it("returns field errors instead of redirecting after a draft conflict", async () => {
    mocks.draft.mockRejectedValue(new AssistanceApprovalError("stale_verification", "Synthetic conflict"));
    const result = await approveRequestWithFeedback({ kind: "idle", message: "" }, form({ needConfirmed: null }));
    expect(result.kind).toBe("error");
    expect(result.message).toContain("entered values are still on this page");
    expect(result.fields).toContainEqual({ field: "needConfirmed", message: "Need must be confirmed." });
    expect(mocks.approve).not.toHaveBeenCalled();
  });
  it("returns an approval conflict without discarding the entered work", async () => {
    mocks.approve.mockRejectedValue(new AssistanceApprovalError("stale_verification", "Synthetic conflict"));
    const result = await approveRequestWithFeedback({ kind: "idle", message: "" }, form());
    expect(result.kind).toBe("error");
    expect(result.message).toContain("Refresh");
    expect(mocks.draft).not.toHaveBeenCalled();
  });
});


describe("saving a draft support choice", () => {
  it.each(["PENDING", "REFERRED"])("retains the explicit %s selection", async decision => {
    await saveReviewProgressWithFeedback({ kind: "idle", message: "" }, form({ decision }));
    expect(mocks.draft.mock.calls[0]![0]).toMatchObject({ route: null, draftDecision: decision });
  });
});

describe("completed verification reopening authority", () => {
  it.each([false, true])("derives reopening permission from the authenticated actor, never form input (%s)", async allowed => {
    mocks.user.mockResolvedValue(allowed ? approver() : staff(["assistance.view", "assistance.update"]));
    const result = await saveReviewProgressWithFeedback({ kind: "idle", message: "" }, form({
      decision: "PENDING", confirmApproval: null, canReopenCompletedVerification: allowed ? "false" : "true",
    }));
    expect(result.kind).toBe("success");
    expect(mocks.draft).toHaveBeenCalledWith(expect.objectContaining({ canReopenCompletedVerification: allowed }));
  });

  it("passes server-derived approver authority to incomplete approval progress saves", async () => {
    await redirected(form({ needConfirmed: null }));
    expect(mocks.draft).toHaveBeenCalledWith(expect.objectContaining({ canReopenCompletedVerification: true }));
  });
});
