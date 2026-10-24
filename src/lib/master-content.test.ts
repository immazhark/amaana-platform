import assert from "node:assert/strict";
import { it } from "vitest";
import master from "@/content/master-copy.json";
import { aboutCopy, verificationCopy, transparencyCopy, governanceCopy } from "./organization-copy";

it("preserves five canonical umbrellas, unique programmes and complete parent relationships", () => {
  assert.equal(master.categories.length, 5);
  assert.equal(new Set(master.initiatives.map(programme => programme.slug)).size, master.initiatives.length);
  for (const programme of master.initiatives) {
    assert(programme.title && programme.story);
    assert(!/Codex|Implementation note|Option [AB]|Recommended Website|\*\*/i.test(programme.story), programme.slug);
    if (programme.parentSlug) assert(master.initiatives.some(parent => parent.slug === programme.parentSlug));
  }
});

it("retains the reviewed debt-support figure and private-case boundary", () => {
  const debt = master.initiatives.find(programme => programme.slug === "jewellery-loan-intervention");
  assert(debt);
  assert(!/Hussain|thalassemia/i.test(JSON.stringify(debt)));
  assert.equal(debt.primaryMetric, "₹138,300");
});

it("publishes complete organisation copy without editing instructions or empty headings", () => {
  for (const [name, page] of Object.entries({ aboutCopy, verificationCopy, transparencyCopy, governanceCopy })) {
    assert(page.title && page.intro, name);
    assert(!/Codex|\*\*|---|##|Alternative|Implementation/i.test(JSON.stringify(page)), name);
    for (const block of page.blocks) assert(block.title.trim(), `${name}: empty block heading`);
  }
});
