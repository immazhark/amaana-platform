import { describe, expect, it } from "vitest";
import { isMatchingFundOrder, type DonorFund } from "./fund-checkout-contract";
const fund: DonorFund = { id: "fund", revision: 4, name: "Reviewed fund", purpose: "Reviewed purpose", disclosure: "Reviewed restrictions", acceptedIntents: ["GENERAL"] };
const order = { givingIntent: "GENERAL", designationKind: "FUND", fundId: "fund", fundRevision: 4, fundName: fund.name, fundPurpose: fund.purpose, fundDisclosure: fund.disclosure };
describe("donor order original-purpose binding", () => {
  it("matches the entire reviewed definition", () => expect(isMatchingFundOrder(order, fund, "GENERAL")).toBe(true));
  it.each([null, [], {}, { ...order, fundId: "other" }, { ...order, fundRevision: 5 },
    { ...order, fundName: "Changed" }, { ...order, fundPurpose: "Changed" }, { ...order, fundDisclosure: "Changed" },
    { ...order, designationKind: "APPEAL" }, { ...order, givingIntent: "SADAQAH" },
  ])("rejects unverified response %#", value => expect(isMatchingFundOrder(value, fund, "GENERAL")).toBe(false));
});
