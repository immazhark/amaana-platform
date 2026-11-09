import { describe, expect, it } from "vitest";
import { createDesignationSnapshot } from "./giving-designation";

const proposal = {
  fund: { id: "fund-general", status: "ACTIVE" as const, eligibleIntents: ["GENERAL"] as const },
  policy: { id: "policy-v1", fundId: "fund-general", status: "ACTIVE" as const, evidenceRef: "reviewed-policy" },
  price: { id: "offer-v1", policyId: "policy-v1", amountPaise: 10000, status: "ACTIVE" as const },
  intent: "GENERAL",
  amountPaise: 10000,
};

const fundDraft = {
  targetKind: "FUND", fundId: "fund-general", appealId: null,
  resolvedFundId: "fund-general", policyVersionId: "policy-v1",
  amountPaise: 10000, currency: "INR", givingIntent: "GENERAL",
};

const appealDraft = {
  ...fundDraft,
  targetKind: "APPEAL",
  fundId: null,
  appealId: "reviewed-appeal",
};

const mapping = {
  appealId: "reviewed-appeal",
  fundId: "fund-general",
  policyVersionId: "policy-v1",
  status: "APPROVED",
  evidenceRef: "synthetic-appeal-review",
};

describe("offline giving destination snapshot", () => {
  it("accepts an exact direct FUND designation and freezes its snapshot", () => {
    const snapshot = createDesignationSnapshot(fundDraft, proposal);
    expect(snapshot).toEqual(fundDraft);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(snapshot).not.toBe(fundDraft);
  });

  it("accepts a reviewed APPEAL mapping only when its fund and policy match", () => {
    expect(createDesignationSnapshot(appealDraft, proposal, mapping)).toEqual(appealDraft);
    expect(createDesignationSnapshot(appealDraft, proposal)).toBeNull();
  });

  it.each([
    ["both destinations", { ...fundDraft, appealId: "another" }],
    ["neither destination", { ...fundDraft, fundId: null }],
    ["fund identity mismatch", { ...fundDraft, fundId: "another" }],
    ["resolved fund mismatch", { ...fundDraft, resolvedFundId: "another" }],
    ["policy version mismatch", { ...fundDraft, policyVersionId: "policy-v2" }],
    ["changed amount", { ...fundDraft, amountPaise: 10001 }],
    ["non-INR currency", { ...fundDraft, currency: "USD" }],
    ["unreviewed giving intent", { ...fundDraft, givingIntent: "ZAKAT" }],
    ["unrecognized target", { ...fundDraft, targetKind: "OTHER" }],
    ["extraneous destination", { ...fundDraft, beneficiaryId: "private-id" }],
    ["blank identifier", { ...fundDraft, fundId: " " }],
  ])("rejects %s", (_, draft) => {
    expect(createDesignationSnapshot(draft, proposal)).toBeNull();
  });

  it.each([null, undefined, [], "", { ...fundDraft, amountPaise: "10000" }])(
    "rejects malformed draft %#",
    draft => expect(createDesignationSnapshot(draft, proposal)).toBeNull(),
  );

  it("fails closed when fund, policy or price loses active evidence", () => {
    expect(createDesignationSnapshot(fundDraft, { ...proposal, policy: { ...proposal.policy, evidenceRef: "" } })).toBeNull();
    expect(createDesignationSnapshot(fundDraft, { ...proposal, fund: { ...proposal.fund, status: "PAUSED" } })).toBeNull();
    expect(createDesignationSnapshot(fundDraft, { ...proposal, price: { ...proposal.price, status: "CLOSED" } })).toBeNull();
  });

  it.each([
    ["appeal identity", { ...mapping, appealId: "wrong" }],
    ["fund destination", { ...mapping, fundId: "wrong" }],
    ["policy version", { ...mapping, policyVersionId: "wrong" }],
    ["unreviewed mapping", { ...mapping, status: "DRAFT" }],
    ["missing evidence", { ...mapping, evidenceRef: "" }],
  ])("rejects mismatched %s", (_, mappingCandidate) => {
    expect(createDesignationSnapshot(appealDraft, proposal, mappingCandidate)).toBeNull();
  });

  it("does not let an appeal mapping replace a direct fund target", () => {
    expect(createDesignationSnapshot(fundDraft, proposal, mapping)).toBeNull();
  });

  it("never treats a historical unmapped appeal as general fund giving", () => {
    expect(createDesignationSnapshot({ ...appealDraft, appealId: "legacy-unmapped" }, proposal, mapping)).toBeNull();
  });
});
