import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateImageWeights, MAX_ARTWORK_BYTES } from "./check-public-image-weight.mjs";

test("accepts assets at or below the per-image cap", () => {
  const report = evaluateImageWeights([
    { path: "public/hero/a.webp", bytes: 120_000 },
    { path: "public/programme-artwork/b.webp", bytes: MAX_ARTWORK_BYTES },
  ]);
  assert.equal(report.imageCount, 2);
  assert.equal(report.totalBytes, 120_000 + MAX_ARTWORK_BYTES);
  assert.deepEqual(report.violations, []);
});
test("detects individual oversized images even if the average is low", () => {
  const report = evaluateImageWeights([
    { path: "public/hero/huge.webp", bytes: MAX_ARTWORK_BYTES + 1 },
    { path: "public/hero/tiny.webp", bytes: 2 },
  ]);
  assert.deepEqual(report.violations.map(asset => asset.path), ["public/hero/huge.webp"]);
});
test("rejects invalid image metadata and invalid limits", () => {
  assert.throws(() => evaluateImageWeights([{ path: "x", bytes: -1 }]), /Invalid image inventory/);
  assert.throws(() => evaluateImageWeights([{ path: "", bytes: 1 }]), /Invalid image inventory/);
  assert.throws(() => evaluateImageWeights([], 0), /Invalid image weight budget/);
});
