import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evaluateImageWeights, MAX_ARTWORK_BYTES, readHeroImageInventory } from "./check-public-image-weight.mjs";

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

test("duplicate image inventory paths must not inflate checked-in artwork totals", () => {
  for (const images of [
    [{ path: "public/hero/scene.webp", bytes: 30 }, { path: "public/hero/scene.webp", bytes: 30 }],
    [{ path: "public/programme-artwork/banner.png", bytes: 30 }, { path: "public/programme-artwork/banner.png", bytes: 90 }],
  ]) {
    assert.throws(() => evaluateImageWeights(images), /Duplicate image inventory path/);
  }
  const unique = evaluateImageWeights([
    { path: "public/hero/scene.webp", bytes: 30 },
    { path: "public/hero/scene-2.webp", bytes: 90 },
  ]);
  assert.equal(unique.totalBytes, 120);
  assert.equal(unique.imageCount, 2);
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

test("rejects a symlinked artwork image file instead of silently skipping its byte budget", () => {
  const root = mkdtempSync(join(tmpdir(), "amaana-artwork-file-"));
  try {
    mkdirSync(join(root, "public", "hero"), { recursive: true });
    mkdirSync(join(root, "public", "programme-artwork"), { recursive: true });
    writeFileSync(join(root, "public", "hero", "approved.webp"), Buffer.alloc(16));
    symlinkSync(join(root, "public", "hero", "approved.webp"),
      join(root, "public", "hero", "linked.webp"));
    assert.throws(() => readHeroImageInventory(root), /Symlinked artwork entry/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects a symlinked artwork source folder before reading outside the repository", () => {
  const root = mkdtempSync(join(tmpdir(), "amaana-artwork-folder-"));
  try {
    mkdirSync(join(root, "public", "programme-artwork"), { recursive: true });
    mkdirSync(join(root, "outside"), { recursive: true });
    writeFileSync(join(root, "outside", "approved.webp"), Buffer.alloc(16));
    symlinkSync(join(root, "outside"), join(root, "public", "hero"), "dir");
    assert.throws(() => readHeroImageInventory(root), /Symlinked artwork folder/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects a symlink at the public parent before following either artwork folder", () => {
  const root = mkdtempSync(join(tmpdir(), "amaana-artwork-public-"));
  try {
    mkdirSync(join(root, "outside", "hero"), { recursive: true });
    mkdirSync(join(root, "outside", "programme-artwork"), { recursive: true });
    writeFileSync(join(root, "outside", "hero", "approved.webp"), Buffer.alloc(16));
    symlinkSync(join(root, "outside"), join(root, "public"), "dir");
    assert.throws(() => readHeroImageInventory(root), /Symlinked artwork parent/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("includes nested checked-in raster artwork in the same 400 KiB budget", () => {
  const root = mkdtempSync(join(tmpdir(), "amaana-artwork-nested-"));
  try {
    mkdirSync(join(root, "public", "hero", "seasonal"), { recursive: true });
    mkdirSync(join(root, "public", "programme-artwork", "2026"), { recursive: true });
    mkdirSync(join(root, "public", "unreviewed"), { recursive: true });
    writeFileSync(join(root, "public", "hero", "seasonal", "safe.webp"), Buffer.alloc(7));
    writeFileSync(join(root, "public", "programme-artwork", "2026", "large.PNG"),
      Buffer.alloc(MAX_ARTWORK_BYTES + 1));
    writeFileSync(join(root, "public", "programme-artwork", "2026", "provenance.json"), "{}");
    writeFileSync(join(root, "public", "unreviewed", "excluded.webp"),
      Buffer.alloc(MAX_ARTWORK_BYTES + 3));
    const report = evaluateImageWeights(readHeroImageInventory(root));
    assert.equal(report.imageCount, 2);
    assert.equal(report.totalBytes, MAX_ARTWORK_BYTES + 8);
    assert.deepEqual(report.violations.map(file => file.path),
      ["public/programme-artwork/2026/large.PNG"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects nested artwork symlinks instead of skipping linked subtrees", () => {
  const root = mkdtempSync(join(tmpdir(), "amaana-artwork-nested-link-"));
  try {
    mkdirSync(join(root, "public", "hero", "seasonal"), { recursive: true });
    mkdirSync(join(root, "public", "programme-artwork"), { recursive: true });
    mkdirSync(join(root, "elsewhere"), { recursive: true });
    writeFileSync(join(root, "elsewhere", "linked.webp"), Buffer.alloc(16));
    symlinkSync(join(root, "elsewhere"),
      join(root, "public", "hero", "seasonal", "linked-folder"), "dir");
    assert.throws(() => readHeroImageInventory(root), /Symlinked artwork entry/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
