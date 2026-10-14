import { describe, expect, it } from "vitest";
import { approvedFundDesignationSnapshot, assertFundTransition, fundNextStatuses, parseFundDraft, parseFundRevision } from "./giving-funds";

const draft = { slug: "reviewed-fund", name: "Reviewed programme", purpose: "A reviewed and restricted programme purpose.", disclosure: "The reviewed donor-facing purpose and restrictions.", accountCode: "TEST-FUND", acceptedIntents: ["GENERAL", "SADAQAH"] };
const approvedFund = {
  id: "cmf1234567890123456789012",
  slug: draft.slug, name: draft.name, purpose: draft.purpose,
  disclosure: draft.disclosure, accountCode: draft.accountCode,
  currency: "INR", acceptedIntents: ["GENERAL", "SADAQAH"] as const,
  status: "APPROVED" as const, revision: 4,
  createdById: "creator", lastEditedById: "editor",
  approvedById: "approver", approvedAt: new Date("2026-10-14T10:00:00Z"),
};

describe("approved giving fund donation designation", () => {
  it("preserves the exact reviewed purpose, restrictions and revision", () => {
    const edited = { ...approvedFund };
    const snapshot = approvedFundDesignationSnapshot(edited, 4, "SADAQAH");
    edited.purpose = "Different purpose after review.";
    expect(snapshot).toEqual({
      version: 1, kind: "FUND", fundId: approvedFund.id, fundRevision: 4,
      label: approvedFund.name, purpose: draft.purpose, disclosure: draft.disclosure,
      accountCode: draft.accountCode, givingIntent: "SADAQAH",
    });
  });

  it.each(["DRAFT", "UNDER_REVIEW", "PAUSED", "CLOSED"] as const)(
    "rejects a %s fund even when prior approval metadata is present", status => {
      expect(() => approvedFundDesignationSnapshot({ ...approvedFund, status }, 4, "GENERAL"))
        .toThrow(/not currently accepting/);
    },
  );
  it.each([3, 5, -1, Number.NaN, Number.MAX_SAFE_INTEGER + 1])(
    "rejects an expired or invalid expected revision %s", revision => {
      expect(() => approvedFundDesignationSnapshot(approvedFund, revision, "GENERAL"))
        .toThrow(/details changed/);
    },
  );
  it("rejects a missing or non-independent approval", () => {
    for (const patch of [
      { approvedById: null }, { approvedAt: null },
      { approvedAt: new Date("invalid") }, { approvedById: "creator" }, { approvedById: "editor" },
    ]) {
      expect(() => approvedFundDesignationSnapshot({ ...approvedFund, ...patch }, 4, "GENERAL"))
        .toThrow(/independent approval/);
    }
  });
  it("rejects unsupported religious intention and foreign currency", () => {
    expect(() => approvedFundDesignationSnapshot(approvedFund, 4, "ZAKAT"))
      .toThrow(/not approved/);
    expect(() => approvedFundDesignationSnapshot({ ...approvedFund, acceptedIntents: ["SADAQAH"] }, 4, "GENERAL"))
      .toThrow(/not approved/);
    expect(() => approvedFundDesignationSnapshot({ ...approvedFund, currency: "USD" }, 4, "GENERAL"))
      .toThrow(/not currently accepting/);
  });
  it("does not serialize an incomplete or invalid stored fund definition", () => {
    expect(() => approvedFundDesignationSnapshot({ ...approvedFund, purpose: "short" }, 4, "GENERAL"))
      .toThrow(/valid fund name/);
  });
});

describe("private giving fund policy", () => {
  it("normalizes supported intentions without inventing eligibility", () => {
    expect(parseFundDraft({ ...draft, acceptedIntents: ["SADAQAH", "GENERAL"] }).acceptedIntents).toEqual(["GENERAL", "SADAQAH"]);
  });
  it.each([[], ["ZAKAT"], ["GENERAL", "GENERAL"], ["SADAQAH_JARIYAH"], [null]].map(acceptedIntents => ({ acceptedIntents })))("rejects unsupported, empty or duplicate intentions %j", ({ acceptedIntents }) => {
    expect(() => parseFundDraft({ ...draft, acceptedIntents })).toThrow();
  });
  it.each([{ slug: "../private" }, { name: {} }, { purpose: "" }, { disclosure: "" }, { accountCode: "not valid" }, { purpose: "x".repeat(1001) }])("rejects malformed draft %j", changes => {
    expect(() => parseFundDraft({ ...draft, ...changes })).toThrow();
  });
  it.each(["", "-1", "1e2", "1.5", "01", null, {}, "9007199254740992"])("rejects malformed/stale revision input %j", revision => {
    expect(() => parseFundRevision(revision)).toThrow(/version/);
  });
  it("accepts the initial revision and a valid later revision", () => {
    expect(parseFundRevision("0")).toBe(0);
    expect(parseFundRevision("12")).toBe(12);
  });
  it.each(["creator", "editor"])("prevents %s approving their own fund definition", actor => {
    expect(() => assertFundTransition({ status: "UNDER_REVIEW", createdById: "creator", lastEditedById: "editor" }, "APPROVED", actor)).toThrow(/different approver/);
  });
  it("permits independent approval and urgent suspension", () => {
    expect(() => assertFundTransition({ status: "UNDER_REVIEW", createdById: "creator", lastEditedById: "editor" }, "APPROVED", "approver")).not.toThrow();
    expect(() => assertFundTransition({ status: "APPROVED", createdById: "creator", lastEditedById: "editor" }, "PAUSED", "creator")).not.toThrow();
  });
  it("never approves a draft directly or reopens a closed fund", () => {
    expect(() => assertFundTransition({ status: "DRAFT", createdById: "creator", lastEditedById: "editor" }, "APPROVED", "approver")).toThrow(/transition/);
    expect(fundNextStatuses("CLOSED")).toEqual([]);
  });
});
