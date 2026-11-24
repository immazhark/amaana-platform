import { describe, expect, it } from "vitest";
import {
  REJECTION_REASON_MAX_LENGTH, REJECTION_REASON_MIN_LENGTH, parseRejectionInput, parseRejectionNotice, rejectionDraftCookieName, rejectionDraftCookieValue, rejectionDraftFromCookie,
  rejectionEligibility, rejectionProblemMessage, rejectionProblems, rejectionRedirect,
} from "./assistance-rejection";

describe("rejection reason rule", () => {
  it("is documented: 3 to 2000 characters after trimming, with at least one letter or digit", () => {
    expect(REJECTION_REASON_MIN_LENGTH).toBe(3);
    expect(REJECTION_REASON_MAX_LENGTH).toBe(2000);
  });

  it("accepts a legitimately concise reason without forcing a long minimum", () => {
    for (const reason of ["Duplicate", "Not eligible", "No need", "Fraud", "Out of scope", "عدم الأهلية", "అర్హత లేదు"]) {
      expect(parseRejectionInput({ reason, confirmRejection: "on" }), reason).toEqual({ ok: true, reason: reason.trim() });
    }
  });

  it("trims the reason it stores", () => {
    expect(parseRejectionInput({ reason: "  Duplicate of AF-2026-100000 \n", confirmRejection: "on" })).toEqual({ ok: true, reason: "Duplicate of AF-2026-100000" });
  });

  it("accepts exactly the maximum and refuses one more", () => {
    expect(parseRejectionInput({ reason: "a".repeat(REJECTION_REASON_MAX_LENGTH), confirmRejection: "on" }).ok).toBe(true);
    const over = parseRejectionInput({ reason: "a".repeat(REJECTION_REASON_MAX_LENGTH + 1), confirmRejection: "on" });
    expect(over).toEqual({ ok: false, errors: { reason: `Keep the reason to ${REJECTION_REASON_MAX_LENGTH} characters or fewer.` } });
  });

  it("refuses a missing, blank or whitespace-only reason with a field error", () => {
    for (const reason of [undefined, null, "", "   ", "\n\t "]) {
      expect(parseRejectionInput({ reason, confirmRejection: "on" }), String(reason)).toEqual({ ok: false, errors: { reason: "Enter the reason for rejecting this request." } });
    }
  });

  it("refuses a reason too short to explain anything, and one with no letter or digit in it", () => {
    for (const reason of ["no", "x", " ok ", "..", "...", "---", "?!", "   ??   "]) {
      const result = parseRejectionInput({ reason, confirmRejection: "on" });
      expect(result.ok, reason).toBe(false);
      expect(result.ok === false && result.errors.reason, reason).toBeTruthy();
    }
  });

  it("refuses a non-text reason", () => {
    for (const reason of [42, true, {}, ["Duplicate"], new File(["x"], "x.txt")]) {
      expect(parseRejectionInput({ reason, confirmRejection: "on" }).ok, String(reason)).toBe(false);
    }
  });
});

describe("explicit confirmation", () => {
  it("is required", () => {
    for (const confirmRejection of [undefined, null, "", "off", "false", "no", "ON", 1, true]) {
      expect(parseRejectionInput({ reason: "Duplicate", confirmRejection }), String(confirmRejection)).toEqual({ ok: false, errors: { confirmation: "Confirm the rejection to continue." } });
    }
  });

  it("accepts the checkbox value", () => {
    expect(parseRejectionInput({ reason: "Duplicate", confirmRejection: "on" }).ok).toBe(true);
  });

  it("reports every problem together, so the reviewer fixes them in one pass", () => {
    expect(parseRejectionInput({ reason: "  ", confirmRejection: undefined })).toEqual({
      ok: false, errors: { reason: "Enter the reason for rejecting this request.", confirmation: "Confirm the rejection to continue." },
    });
  });
});

describe("only the reason and the confirmation are read", () => {
  it("ignores approval fields, including invalid unsaved amounts and unresolved consents", () => {
    const withApprovalNoise = {
      reason: "Duplicate", confirmRejection: "on",
      verifiedNeedAmount: "not a number", approvedPublicTarget: "-5", paymentDestination: "", verificationSummary: "",
      needConfirmed: undefined, evidenceReviewed: undefined, otherFundingChecked: undefined,
      decision: "PENDING", publicNameConsent: "UNCONFIRMED", zakatStatus: "UNREVIEWED", markComplete: undefined, status: "APPROVED",
    };
    expect(parseRejectionInput(withApprovalNoise)).toEqual({ ok: true, reason: "Duplicate" });
  });

  it("returns nothing but the reason on success, so no approval value can travel with it", () => {
    const result = parseRejectionInput({ reason: "Duplicate", confirmRejection: "on", decision: "APPROVED_PUBLIC", verifiedNeedAmount: "500" });
    expect(result).toEqual({ ok: true, reason: "Duplicate" });
    expect(Object.keys(result as object).sort()).toEqual(["ok", "reason"]);
  });
});

describe("rejectionEligibility", () => {
  it("allows an unconverted case that is still in review or approved", () => {
    for (const status of ["SUBMITTED", "DOCUMENTS_REQUESTED", "UNDER_VERIFICATION", "APPROVED"]) expect(rejectionEligibility(status, false), status).toBe("eligible");
  });

  it("recognises a case that is already rejected, so a repeat is safe", () => {
    expect(rejectionEligibility("REJECTED", false)).toBe("already_rejected");
  });

  it("keeps a converted case with its linked appeal, whatever its status says", () => {
    expect(rejectionEligibility("CONVERTED_TO_APPEAL", true)).toBe("linked_appeal");
    expect(rejectionEligibility("CONVERTED_TO_APPEAL", false)).toBe("linked_appeal");
    expect(rejectionEligibility("APPROVED", true)).toBe("linked_appeal");
    expect(rejectionEligibility("REJECTED", true)).toBe("linked_appeal");
  });

  it("does not reject a closed case, which must be reopened first", () => {
    expect(rejectionEligibility("CLOSED", false)).toBe("closed");
  });

  it("refuses a status it does not know", () => {
    expect(rejectionEligibility("SOMETHING_ELSE", false)).toBe("unknown");
  });
});

describe("the outcome travels in the address, but the reason never does", () => {
  it("builds a redirect that names the outcome and the fields in error, never any private text", () => {
    const url = rejectionRedirect("req-1", { kind: "error", problems: ["reason-short", "confirmation"], code: null });
    expect(url).toBe("/admin/requests/req-1?reject=error&e=reason-short%2Cconfirmation#reject-errors");
    expect(rejectionRedirect("req-1", { kind: "error", problems: [], code: "stale_request" })).toBe("/admin/requests/req-1?reject=error&code=stale_request#reject-errors");
    expect(rejectionRedirect("req-1", { kind: "done", outcome: "rejected" })).toBe("/admin/requests/req-1?reject=done&o=rejected#reject-heading");
    expect(rejectionRedirect("req-1", { kind: "done", outcome: "already_rejected" })).toBe("/admin/requests/req-1?reject=done&o=already_rejected#reject-heading");
  });

  it("encodes an unusual request id so it cannot break out of the path or the query", () => {
    const url = rejectionRedirect("a/b?c=d#e", { kind: "done", outcome: "rejected" });
    expect(url.startsWith("/admin/requests/a%2Fb%3Fc%3Dd%23e?")).toBe(true);
  });

  it("reads a notice back from the address, accepting only values it wrote", () => {
    expect(parseRejectionNotice({ reject: "error", e: "reason-missing,confirmation" })).toEqual({ kind: "error", problems: ["reason-missing", "confirmation"], code: null });
    expect(parseRejectionNotice({ reject: "error", code: "linked_appeal" })).toEqual({ kind: "error", problems: [], code: "linked_appeal" });
    expect(parseRejectionNotice({ reject: "done", o: "already_rejected" })).toEqual({ kind: "done", outcome: "already_rejected" });
    expect(parseRejectionNotice({ reject: "done", o: "rejected" })).toEqual({ kind: "done", outcome: "rejected" });
  });

  it("ignores anything it did not write, so a crafted link cannot put words on the page", () => {
    expect(parseRejectionNotice({})).toBeNull();
    expect(parseRejectionNotice({ reject: "maybe" })).toBeNull();
    expect(parseRejectionNotice({ reject: "error", e: "<script>,reason-short,\"x\"" })).toEqual({ kind: "error", problems: ["reason-short"], code: null });
    expect(parseRejectionNotice({ reject: "error", code: "<b>owned</b>" })).toEqual({ kind: "error", problems: [], code: null });
    expect(parseRejectionNotice({ reject: "done", o: "anything-else" })).toEqual({ kind: "done", outcome: "rejected" });
    expect(parseRejectionNotice({ reject: ["error", "done"] })).toBeNull();
  });

  it("turns a problem token into the same message the parser gives", () => {
    expect(rejectionProblemMessage("reason-missing")).toBe("Enter the reason for rejecting this request.");
    expect(rejectionProblemMessage("reason-short")).toContain("at least 3 characters");
    expect(rejectionProblemMessage("reason-long")).toContain("2000");
    expect(rejectionProblemMessage("confirmation")).toBe("Confirm the rejection to continue.");
    expect(rejectionProblems({ reason: "no", confirmRejection: "on" })).toEqual(["reason-short"]);
  });

  it("names which problems a submission has, in the same pass", () => {
    expect(rejectionProblems({ reason: "  ", confirmRejection: undefined })).toEqual(["reason-missing", "confirmation"]);
    expect(rejectionProblems({ reason: "a".repeat(2001), confirmRejection: "on" })).toEqual(["reason-long"]);
    expect(rejectionProblems({ reason: "Duplicate", confirmRejection: "on" })).toEqual([]);
  });

  it("keeps a draft only when it fits comfortably in a cookie", () => {
    expect(rejectionDraftCookieValue("Duplicate")).toBe("Duplicate");
    expect(rejectionDraftCookieValue("అర్హత లేదు")).toBe(encodeURIComponent("అర్హత లేదు"));
    expect(rejectionDraftCookieValue("a".repeat(2000))).toBe("a".repeat(2000));
    expect(rejectionDraftCookieValue("అ".repeat(2000))).toBeNull();
    expect(rejectionDraftFromCookie(rejectionDraftCookieValue("Duplicate of AF-2026-100000, see note")!)).toBe("Duplicate of AF-2026-100000, see note");
    expect(rejectionDraftFromCookie("%E0%A4%A")).toBe("");
    expect(rejectionDraftFromCookie(undefined)).toBe("");
  });
});

describe("the draft cookie name", () => {
  it("is built only from a plain identifier", () => {
    expect(rejectionDraftCookieName("cmxyz1234567890")).toBe("amaana_rd_cmxyz1234567890");
    for (const bad of ["", "short", "has space here", "semi;colon-id1", "eq=ual-id-12", "a".repeat(41), "unicode-ఐడీ-12345"]) expect(rejectionDraftCookieName(bad), bad).toBeNull();
  });
});
