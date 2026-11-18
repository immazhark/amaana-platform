import assert from "node:assert/strict";
import test from "node:test";
import { scanEditorialRisks } from "./check-public-editorial-consistency.mjs";

const ids = (findings) => findings.map(item => item.id).sort();

test("editorial guard catches superseded factual values", () => {
  const findings = scanEditorialRisks("fixture.ts", `
    const oldBabyAmount = "₹107,200";
    const oldWinterTotal = "234+ beneficiaries in the winter drive";
    const roundedAlizaAmount = "₹4.82L";
  `);
  assert.deepEqual(ids(findings), [
    "aliza-rounded-amount",
    "newborn-old-amount",
    "winter-superseded-plus-total",
  ]);
});

test("editorial guard catches compliance overclaims", () => {
  const findings = scanEditorialRisks("fixture.ts", `
    Amaana Foundation is FCRA-registered.
    We have permanent 80G approval.
    We have final 12AB approval.
    We accept foreign donations.
  `);
  assert.deepEqual(ids(findings), [
    "foreign-donation-acceptance",
    "permanent-12a",
    "permanent-80g",
    "positive-fcra-registration",
    "unqualified-12a",
  ]);
});

test("editorial guard allows accurate fail-closed compliance language", () => {
  const findings = scanEditorialRisks("fixture.ts", `
    Amaana Foundation is not FCRA-registered.
    The known 80G approval is provisional.
    Provisional 12A / 12AB approval is in place.
    Amaana does not accept foreign contributions.
    The newborn medical-aid amount is ₹107,520.
    The Winter Drive distributed 234 Winter Kits to 234 beneficiaries.
  `);
  assert.deepEqual(findings, []);
});

test("editorial guard catches tax-benefit, FCRA-approval, foreign-welcome and religious-ruling claims", () => {
  const findings = scanEditorialRisks("fixture.ts", `
    Your gift earns a tax deduction under Section 80G.
    Donate now and claim a deduction next year.
    Amaana is FCRA-approved for overseas giving.
    Overseas donors are welcome.
    Giving Zakat this way is obligatory and we guarantee reward.
  `);
  assert.deepEqual(ids(findings), [
    "fcra-approval-claim",
    "foreign-donors-welcome",
    "religious-ruling-claim",
    "religious-ruling-claim",
    "tax-benefit-claim",
    "tax-benefit-claim",
  ]);
});

test("editorial guard allows those topics only inside a clear negation", () => {
  const findings = scanEditorialRisks("fixture.ts", `
    The acknowledgement is not presented as an 80G tax-deduction certificate.
    The platform does not guarantee tax deductibility for every contribution.
    No religious ruling, legal outcome or tax deduction is promised by this page.
    Amaana does not hold FCRA-approved status.
    Foreign donors are not invited and overseas donations are not accepted.
  `);
  assert.deepEqual(findings, []);
});

test("editorial guard requires the word provisional beside every 12A or 12AB mention", () => {
  assert.deepEqual(ids(scanEditorialRisks("fixture.ts", "We hold 12A registration.")), ["unqualified-12a"]);
  assert.deepEqual(scanEditorialRisks("fixture.ts", "Our 12A and 80G approvals are provisional."), []);
});

test("master-copy.json is scanned for compliance rules but not for stale-fact locks", () => {
  const file = "src/content/master-copy.json";
  assert.deepEqual(ids(scanEditorialRisks(file, "We offer a tax deduction on every gift.")), ["tax-benefit-claim"]);
  assert.deepEqual(scanEditorialRisks(file, "Superseded history: ₹107,200 was recorded earlier."), []);
});
