import { describe, expect, it } from "vitest";
import {
  REJECTION_REASON_MAX_LENGTH, REJECTION_REASON_MIN_LENGTH, parseRejectionInput, rejectionEligibility,
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
