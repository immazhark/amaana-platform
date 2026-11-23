import { describe, expect, it } from "vitest";
import { getPublicAppealVerificationIssues } from "./assistance";
import {
  APPROVAL_ROUTES, approvalProblemField, approvalProblemMessage, parseApprovalNotice, approvalIssues, approvalRequirement, parseApprovalRoute, type ApprovalFields,
} from "./assistance-approval";

const complete: ApprovalFields = {
  needConfirmed: true, evidenceReviewed: true, otherFundingChecked: true, verifiedNeedAmount: 5000, approvedPublicTarget: null,
  paymentDestination: "Hospital billing desk", verificationSummary: "Checked the bills and the hospital letter.", zakatStatus: "NOT_APPLICABLE",
  publicNameConsent: "UNCONFIRMED", photoConsent: "UNCONFIRMED", medicalDetailsConsent: "UNCONFIRMED", institutionNameConsent: "UNCONFIRMED", archiveConsent: "UNCONFIRMED",
};
const publicReady: ApprovalFields = {
  ...complete, approvedPublicTarget: 5000, publicNameConsent: "NOT_ALLOWED", photoConsent: "NOT_APPLICABLE", medicalDetailsConsent: "ALLOWED", institutionNameConsent: "NOT_ALLOWED", archiveConsent: "ALLOWED",
};
const keys = (route: Parameters<typeof approvalIssues>[0], fields: ApprovalFields, confirmed = true) => Object.keys(approvalIssues(route, fields, { confirmed })).sort();

describe("routes", () => {
  it("are exactly the three ways to approve, with plain meanings", () => {
    expect(APPROVAL_ROUTES.map(route => route.value)).toEqual(["APPROVED_PRIVATE", "APPROVED_PARTIAL", "APPROVED_PUBLIC"]);
    for (const route of APPROVAL_ROUTES) {
      expect(route.label.length).toBeGreaterThan(5);
      expect(route.meaning.length).toBeGreaterThan(30);
    }
    expect(APPROVAL_ROUTES.find(route => route.value === "APPROVED_PARTIAL")!.meaning).toMatch(/not.*public|funding and public visibility are different/i);
  });

  it("parses a route and refuses anything else, including decisions that are not approvals", () => {
    for (const route of ["APPROVED_PRIVATE", "APPROVED_PARTIAL", "APPROVED_PUBLIC"]) expect(parseApprovalRoute(route)).toBe(route);
    for (const bad of ["", "PENDING", "REFERRED", "DECLINED", "approved_public", null, undefined, 3, {}]) expect(parseApprovalRoute(bad), String(bad)).toBeNull();
  });
});

describe("private and partial approval", () => {
  it.each(["APPROVED_PRIVATE", "APPROVED_PARTIAL"] as const)("%s needs the existing substantive checks and nothing public", route => {
    expect(approvalIssues(route, complete, { confirmed: true })).toEqual({});
  });

  it.each(["APPROVED_PRIVATE", "APPROVED_PARTIAL"] as const)("%s needs no public title, story, media, target or disclosure decisions", route => {
    const noPublic = { ...complete, approvedPublicTarget: null, publicNameConsent: "UNCONFIRMED", photoConsent: "UNCONFIRMED", archiveConsent: "UNCONFIRMED" };
    expect(approvalIssues(route, noPublic, { confirmed: true })).toEqual({});
  });

  it.each([
    ["needConfirmed", { needConfirmed: false }, "Need must be confirmed."],
    ["evidenceReviewed", { evidenceReviewed: false }, "Supporting evidence must be reviewed."],
    ["verifiedNeedAmount", { verifiedNeedAmount: null }, "Verified need amount must be recorded."],
    ["paymentDestination", { paymentDestination: "  " }, "Payment destination must be confirmed."],
    ["otherFundingChecked", { otherFundingChecked: false }, "Other funding or duplicate fundraising must be checked."],
    ["verificationSummary", { verificationSummary: "" }, "Verification summary is required."],
    ["zakatStatus", { zakatStatus: "UNREVIEWED" }, "Zakat review must be recorded as eligible, not eligible, or not applicable."],
  ] as const)("names %s and uses the existing wording when it is missing", (field, change, message) => {
    expect(approvalIssues("APPROVED_PRIVATE", { ...complete, ...change }, { confirmed: true })).toEqual({ [field]: message });
  });

  it("reports every missing check together, so the reviewer fixes them in one pass", () => {
    const empty = { ...complete, needConfirmed: false, evidenceReviewed: false, verifiedNeedAmount: null, paymentDestination: "", otherFundingChecked: false, verificationSummary: "", zakatStatus: "UNREVIEWED" };
    expect(keys("APPROVED_PRIVATE", empty)).toEqual(["evidenceReviewed", "needConfirmed", "otherFundingChecked", "paymentDestination", "verificationSummary", "verifiedNeedAmount", "zakatStatus"]);
  });
});

describe("public fundraising approval", () => {
  it("accepts a fully prepared public case", () => {
    expect(approvalIssues("APPROVED_PUBLIC", publicReady, { confirmed: true })).toEqual({});
  });

  it("also needs everything private approval needs", () => {
    expect(keys("APPROVED_PUBLIC", { ...publicReady, needConfirmed: false, verificationSummary: "" })).toEqual(["needConfirmed", "verificationSummary"]);
  });

  it("needs an approved target that does not exceed the verified need", () => {
    expect(approvalIssues("APPROVED_PUBLIC", { ...publicReady, approvedPublicTarget: null }, { confirmed: true })).toEqual({ approvedPublicTarget_missing: "Approved public target must be recorded." });
    expect(approvalIssues("APPROVED_PUBLIC", { ...publicReady, approvedPublicTarget: 5000.01 }, { confirmed: true })).toEqual({ approvedPublicTarget_exceeds: "Approved public target cannot exceed the verified need amount." });
    expect(approvalIssues("APPROVED_PUBLIC", { ...publicReady, approvedPublicTarget: 4000 }, { confirmed: true })).toEqual({});
  });

  it("needs each disclosure permission resolved, where NOT_ALLOWED and NOT_APPLICABLE are real answers but UNCONFIRMED is unfinished", () => {
    for (const field of ["publicNameConsent", "photoConsent", "medicalDetailsConsent", "institutionNameConsent", "archiveConsent"] as const) {
      expect(keys("APPROVED_PUBLIC", { ...publicReady, [field]: "UNCONFIRMED" }), field).toEqual([field]);
      for (const answer of ["ALLOWED", "NOT_ALLOWED", "NOT_APPLICABLE"]) expect(keys("APPROVED_PUBLIC", { ...publicReady, [field]: answer }), `${field}=${answer}`).toEqual([]);
    }
  });

  it("does not let a target be entered for a route that is not public", () => {
    expect(keys("APPROVED_PRIVATE", { ...complete, approvedPublicTarget: 100 })).toEqual(["approvedPublicTarget_notPublic"]);
    expect(keys("APPROVED_PARTIAL", { ...complete, approvedPublicTarget: 100 }, true)).toEqual(["approvedPublicTarget_notPublic"]);
  });
});

describe("explicit confirmation", () => {
  it("is required for every route and is reported with the other errors", () => {
    for (const route of ["APPROVED_PRIVATE", "APPROVED_PARTIAL", "APPROVED_PUBLIC"] as const) {
      expect(approvalIssues(route, route === "APPROVED_PUBLIC" ? publicReady : complete, { confirmed: false })).toEqual({ confirmation: "Confirm the approval to continue." });
    }
    expect(keys("APPROVED_PRIVATE", { ...complete, needConfirmed: false }, false)).toEqual(["confirmation", "needConfirmed"]);
  });
});

describe("requirement labels shown before submission", () => {
  it("say Required to approve, Required to publish, Optional or Not needed for this action, never by colour alone", () => {
    expect(approvalRequirement("needConfirmed", "reject")).toBe("Not needed for this action");
    expect(approvalRequirement("needConfirmed", "APPROVED_PRIVATE")).toBe("Required to approve");
    expect(approvalRequirement("approvedPublicTarget", "APPROVED_PRIVATE")).toBe("Not needed for this action");
    expect(approvalRequirement("approvedPublicTarget", "APPROVED_PUBLIC")).toBe("Required to approve");
    expect(approvalRequirement("publicNameConsent", "APPROVED_PRIVATE")).toBe("Not needed for this action");
    expect(approvalRequirement("publicNameConsent", "APPROVED_PUBLIC")).toBe("Required to approve");
    expect(approvalRequirement("otherFundingNotes", "APPROVED_PUBLIC")).toBe("Optional");
    expect(approvalRequirement("assignment", "reject")).toBe("Optional");
    expect(approvalRequirement("publicTitle", "APPROVED_PUBLIC")).toBe("Required to publish");
    expect(approvalRequirement("coverImage", "APPROVED_PUBLIC")).toBe("Optional");
  });
});

describe("one rule set, no drifting second checklist", () => {
  const publicMessages = (fields: ApprovalFields) => [...new Set(getPublicAppealVerificationIssues({
    ...fields, decision: "APPROVED_PUBLIC", completedAt: new Date(),
  }))].sort();
  const approvalMessages = (fields: ApprovalFields) => Object.entries(approvalIssues("APPROVED_PUBLIC", fields, { confirmed: true })).filter(([key]) => key !== "confirmation").map(([, message]) => message).sort();

  it("matches the messages the publication gate raises for the same public case, for every field it checks", () => {
    const variants: Partial<ApprovalFields>[] = [
      {}, { needConfirmed: false }, { evidenceReviewed: false }, { verifiedNeedAmount: null }, { approvedPublicTarget: null }, { approvedPublicTarget: 9999 },
      { paymentDestination: "" }, { otherFundingChecked: false }, { verificationSummary: "" }, { publicNameConsent: "UNCONFIRMED" }, { photoConsent: "UNCONFIRMED" },
      { medicalDetailsConsent: "UNCONFIRMED" }, { institutionNameConsent: "UNCONFIRMED" }, { archiveConsent: "UNCONFIRMED" }, { zakatStatus: "UNREVIEWED" },
      { needConfirmed: false, evidenceReviewed: false, paymentDestination: "", zakatStatus: "UNREVIEWED" },
    ];
    for (const variant of variants) {
      const fields = { ...publicReady, ...variant };
      expect(approvalMessages(fields), JSON.stringify(variant)).toEqual(publicMessages(fields));
    }
  });
});


describe("approval notice field links", () => {
  it("links a missing support route to the decision control with a useful message", () => {
    expect(approvalProblemField("route")).toBe("decision");
    expect(approvalProblemMessage("route")).toBe("Choose how this request is to be supported.");
  });

  it("preserves the specific target error and links it to the target control", () => {
    expect(approvalProblemField("approvedPublicTarget_exceeds")).toBe("approvedPublicTarget");
    expect(approvalProblemMessage("approvedPublicTarget_exceeds")).toBe("Approved public target cannot exceed the verified need amount.");
    expect(approvalProblemField("confirmation")).toBe("confirmApproval");
  });

  it.each(["verifiedNeedAmount_format", "approvedPublicTarget_format", "paymentDestination_long", "verificationSummary_long", "otherFundingNotes_long"])("describes %s without falling back to a generic error", token => {
    expect(approvalProblemMessage(token)).not.toBe(approvalProblemMessage("unknown"));
    expect(approvalProblemField(token)).toBe(token.split("_")[0]);
  });

  it("discards unknown tokens so a crafted link cannot add broken field anchors", () => {
    expect(parseApprovalNotice({ approve: "error", e: "route,unknown,approvedPublicTarget_exceeds,<script>" })).toEqual({ kind: "error", problems: ["route", "approvedPublicTarget_exceeds"], code: null });
  });
});
