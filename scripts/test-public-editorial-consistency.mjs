import assert from "node:assert/strict";
import test from "node:test";
import { scanEditorialRisks } from "./check-public-editorial-consistency.mjs";

test("editorial guard catches superseded factual values", () => {
  const findings = scanEditorialRisks("fixture.ts", `
    const oldBabyAmount = "₹107,200";
    const oldWinterTotal = "234+ beneficiaries in the winter drive";
    const roundedAlizaAmount = "₹4.82L";
  `);
  assert.deepEqual(findings.map(item => item.id).sort(), [
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
  assert.deepEqual(findings.map(item => item.id).sort(), [
    "foreign-donation-acceptance",
    "permanent-12a",
    "permanent-80g",
    "positive-fcra-registration",
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
