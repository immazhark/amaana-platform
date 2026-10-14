import { describe, expect, it } from "vitest";
import { assertFundTransition, fundNextStatuses, parseFundDraft, parseFundRevision } from "./giving-funds";

const draft = { slug: "reviewed-fund", name: "Reviewed programme", purpose: "A reviewed and restricted programme purpose.", disclosure: "The reviewed donor-facing purpose and restrictions.", accountCode: "TEST-FUND", acceptedIntents: ["GENERAL", "SADAQAH"] };
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
