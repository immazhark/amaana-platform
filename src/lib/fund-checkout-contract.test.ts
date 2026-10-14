import { describe, expect, it } from "vitest";
import { isMatchingFundOrder, isSameReviewedFundSnapshot, type DonorFund } from "./fund-checkout-contract";
const fund: DonorFund = { id: "fund", revision: 4, name: "Reviewed fund", purpose: "Reviewed purpose", disclosure: "Reviewed restrictions", acceptedIntents: ["GENERAL"] };
const order = { givingIntent: "GENERAL", designationKind: "FUND", fundId: "fund", fundRevision: 4, fundName: fund.name, fundPurpose: fund.purpose, fundDisclosure: fund.disclosure };
describe("donor order original-purpose binding", () => {
  it("matches the entire reviewed definition", () => expect(isMatchingFundOrder(order, fund, "GENERAL")).toBe(true));
  it.each([null, [], {}, { ...order, fundId: "other" }, { ...order, fundRevision: 5 },
    { ...order, fundName: "Changed" }, { ...order, fundPurpose: "Changed" }, { ...order, fundDisclosure: "Changed" },
    { ...order, designationKind: "APPEAL" }, { ...order, givingIntent: "SADAQAH" },
  ])("rejects unverified response %#", value => expect(isMatchingFundOrder(value, fund, "GENERAL")).toBe(false));
});

describe("approved fund revision and purpose UI safety", () => {
  it("preserves checkout only for the complete identical reviewed fund snapshot", () => {
    expect(isSameReviewedFundSnapshot(fund, { ...fund })).toBe(true);
  });
  it.each([
    { revision: 5 }, { name: "Rewritten" }, { purpose: "Different purpose" },
    { disclosure: "No restrictions" }, { acceptedIntents: ["SADAQAH"] as const },
    { id: "fund-elsewhere" },
  ])("stops stale donor checkouts when a reviewed field changes %#", change => {
    const current = { ...fund, ...change } as DonorFund;
    expect(isSameReviewedFundSnapshot(fund, current)).toBe(false);
  });
  it("does not silently accept changed intent ordering or newly expanded donation uses", () => {
    const previous = { ...fund, acceptedIntents: ["GENERAL", "SADAQAH"] as const };
    expect(isSameReviewedFundSnapshot(previous,
      { ...previous, acceptedIntents: ["SADAQAH", "GENERAL"] })).toBe(false);
    expect(isSameReviewedFundSnapshot(previous,
      { ...previous, acceptedIntents: ["GENERAL"] })).toBe(false);
  });
});
