import assert from "node:assert/strict";
import { test } from "node:test";
import master from "../prisma/master-programmes.json" with { type: "json" };
import { eligibleMasterInitiatives } from "../prisma/master-content-publication.mjs";

test("the two owner-approved medical cases are imported; any other unreviewed record stays out", () => {
  const eligible = eligibleMasterInitiatives(master.initiatives);
  assert.equal(master.initiatives.filter(record => record.causeSlug === "medical-financial-relief").length, 8);
  assert.equal(eligible.filter(record => record.causeSlug === "medical-financial-relief").length, 8);
  assert.equal(eligible.length, 32);
  for (const slug of ["accident-recovery-support-2026", "medical-recovery-relief-2026"]) {
    assert.equal(master.initiatives.find(record => record.slug === slug).publicationReviewStatus, "APPROVED");
  }
});

test("publication review fails closed on unknown states while preserving existing approved source", () => {
  const records = [
    { slug: "existing", title: "Existing" },
    { slug: "pending", publicationReviewStatus: "PENDING" },
    { slug: "unknown", publicationReviewStatus: "UNREVIEWED" },
    { slug: "typo", publicationReviewStatus: "APPROVE" },
    { slug: "approved", publicationReviewStatus: "APPROVED" },
  ];
  assert.deepEqual(eligibleMasterInitiatives(records).map(record => record.slug), ["existing", "approved"]);
});
