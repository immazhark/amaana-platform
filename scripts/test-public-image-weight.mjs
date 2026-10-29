import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateImageWeights, MAX_ARTWORK_BYTES, readHeroImageInventory } from "./check-public-image-weight.mjs";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

test("rejects aggregate bytes outside the safe integer range", () => {
  assert.throws(() => evaluateImageWeights([
    { path: "public/hero/a.webp", bytes: Number.MAX_SAFE_INTEGER },
    { path: "public/hero/b.webp", bytes: 1 },
  ]), /Invalid aggregate image byte size/);
  const atLimit = evaluateImageWeights([
    { path: "public/hero/a.webp", bytes: Number.MAX_SAFE_INTEGER - 1 },
    { path: "public/hero/b.webp", bytes: 1 },
  ]);
  assert.equal(atLimit.totalBytes, Number.MAX_SAFE_INTEGER);
});

test("rejects malformed paths and null entries before reporting artwork", () => {
  for (const bad of [null, { path: 42, bytes: 100 }, { path: {}, bytes: 100 }, { path: "  ", bytes: 100 }]) {
    assert.throws(() => evaluateImageWeights([bad]), /Invalid image inventory entry/);
  }
  assert.throws(() => evaluateImageWeights(null), /Invalid image inventory/);
});


test("includes nested checked-in raster artwork and still excludes unrelated files", () => {
  const root = mkdtempSync(join(tmpdir(), "amaana-artwork-guard-"));
  try {
    const hero = join(root, "public/hero/seasonal");
    const programme = join(root, "public/programme-artwork/2026");
    const unrelated = join(root, "public/unreviewed");
    mkdirSync(hero, { recursive: true });
    mkdirSync(programme, { recursive: true });
    mkdirSync(unrelated, { recursive: true });
    writeFileSync(join(hero, "safe.webp"), Buffer.alloc(7));
    writeFileSync(join(programme, "huge.PNG"), Buffer.alloc(MAX_ARTWORK_BYTES + 1));
    writeFileSync(join(programme, "provenance.json"), "{}");
    writeFileSync(join(unrelated, "ignore.webp"), Buffer.alloc(MAX_ARTWORK_BYTES + 100));
    const report = evaluateImageWeights(readHeroImageInventory(root));
    assert.equal(report.imageCount, 2);
    assert.deepEqual(report.violations.map(file => file.path), ["public/programme-artwork/2026/huge.PNG"]);
    assert.equal(report.totalBytes, MAX_ARTWORK_BYTES + 8);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
