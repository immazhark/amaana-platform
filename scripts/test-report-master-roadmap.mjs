import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { summarizeMasterRoadmap } from "./report-master-roadmap.mjs";

test("real master register is counted once per canonical item", () => {
  const file = fileURLToPath(new URL("../docs/AMAANA_MASTER_RECONCILED_EXECUTION_PLAN.md", import.meta.url));
  const report = summarizeMasterRoadmap(readFileSync(file, "utf8"));
  assert.equal(report.total, 149);
  assert.equal(report.byType.Enhancement, 51);
  assert.equal(report.byType.Innovation, 8);
  assert.equal(report.byImplementation.Implemented, 60);
  assert.equal(report.byImplementation.Partial, 61);
  assert.equal(report.byImplementation["Not started"], 26);
  assert.equal(report.byImplementation.Superseded, 1);
  assert.equal(report.byImplementation["Not applicable"], 1);
  assert.equal(Object.values(report.byImplementation).reduce((a, b) => a + b, 0), report.total);
});

test("rejects duplicate canonical IDs, not just duplicate descriptions", () => {
  const row = "| AF-TEST | Enhancement | W1 | Example | test | P1 | I=Partial; V=Not tested; G=PR open; P=Not deployed; D=Open |";
  assert.throws(() => summarizeMasterRoadmap(row + "\n" + row), /duplicate/i);
});

test("requires explicit implementation states rather than inventing completed work", () => {
  assert.throws(
    () => summarizeMasterRoadmap("| AF-TEST | Innovation | W1 | Example | test | P1 | V=Not tested; G=PR open; P=Not deployed |"),
    /implementation/i,
  );
});
