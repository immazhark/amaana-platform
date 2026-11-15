import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { collectDatedDocumentBacklinks } from "./draft-dated-doc-retention.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "amaana-doc-retention-"));
  const docs = join(root, "docs");
  const nested = join(docs, "mission-control");
  mkdirSync(nested, { recursive: true });
  writeFileSync(join(root, "README.md"), "[Archived audit](docs/AUDIT_2026-10-25.md)\n");
  writeFileSync(join(docs, "AUDIT_2026-10-25.md"), "# Preserve historical evidence\n");
  writeFileSync(join(nested, "2026-11-12-checkpoint.md"), "# Keep under review\n");
  writeFileSync(join(nested, "current.md"), "[Previous audit](../AUDIT_2026-10-25.md#section)\n");
  writeFileSync(join(docs, "AUDIT_2026-19-88.md"), "# Invalid date is not a dated candidate\n");
  return { root, docs, nested, dispose: () => rmSync(root, { recursive: true, force: true }) };
}

test("AF-R078 reports referenced and statically unreferenced dated docs without approving deletion", () => {
  const f = fixture();
  try {
    const before = readdirSync(f.docs).sort();
    const original = readFileSync(join(f.docs, "AUDIT_2026-10-25.md"), "utf8");
    const report = collectDatedDocumentBacklinks(f.root);
    assert.equal(report.source, "local-markdown-reference-inventory");
    assert.equal(report.deletionApproved, false);
    assert.equal(report.documents.length, 2);
    const linked = report.documents.find(d => d.path === "docs/AUDIT_2026-10-25.md");
    const other = report.documents.find(d => d.path === "docs/mission-control/2026-11-12-checkpoint.md");
    assert.deepEqual(linked?.referencedBy, ["README.md", "docs/mission-control/current.md"]);
    assert.equal(linked?.disposition, "REVIEW_LINKED");
    assert.equal(other?.disposition, "REVIEW_UNLINKED_STATIC_ONLY");
    assert.deepEqual(other?.referencedBy, []);
    assert.deepEqual(readdirSync(f.docs).sort(), before);
    assert.equal(readFileSync(join(f.docs, "AUDIT_2026-10-25.md"), "utf8"), original);
  } finally { f.dispose(); }
});

test("AF-R078 refuses symbolic links rather than scanning unknown private destinations", () => {
  const f = fixture();
  const outside = mkdtempSync(join(tmpdir(), "amaana-private-outside-"));
  try {
    writeFileSync(join(outside, "private-2026-10-25.md"), "private synthetic data\n");
    symlinkSync(outside, join(f.docs, "external"), "dir");
    assert.throws(() => collectDatedDocumentBacklinks(f.root), /symbolic link/i);
  } finally {
    f.dispose();
    rmSync(outside, { recursive: true, force: true });
  }
});

test("AF-R078 treats no static backlinks as review-only, never a safe-to-delete decision", () => {
  const f = fixture();
  try {
    const report = collectDatedDocumentBacklinks(f.root);
    assert.match(report.limitation, /not proof.*unused|cannot prove.*unused/i);
    assert.ok(report.documents.every(d => !Object.hasOwn(d, "delete") && !Object.hasOwn(d, "safeToDelete")));
    assert.ok(report.documents.every(d => d.disposition.startsWith("REVIEW_")));
  } finally { f.dispose(); }
});

test("AF-R078 treats Markdown reference-style definitions as conservative historical backlinks", () => {
  const f = fixture();
  try {
    // In Markdown this resolves [Checkpoint][historical] through a definition,
    // not through an inline ](...) link.
    writeFileSync(join(f.nested, "current.md"),
      "[Checkpoint][historical]\n\n[historical]: <2026-11-12-checkpoint.md> \"Reviewed document\"\n");
    const report = collectDatedDocumentBacklinks(f.root);
    const checkpoint = report.documents.find(d =>
      d.path === "docs/mission-control/2026-11-12-checkpoint.md");
    assert.deepEqual(checkpoint?.referencedBy, ["docs/mission-control/current.md"]);
    assert.equal(checkpoint?.disposition, "REVIEW_LINKED");
    assert.equal(report.deletionApproved, false);
  } finally { f.dispose(); }
});

test("AF-R078 counts HTML anchors in Markdown conservatively as document backlinks", () => {
  const f = fixture();
  try {
    writeFileSync(join(f.nested, "current.md"),
      '<a class="audit" href="./2026-11-12-checkpoint.md#summary">Earlier checkpoint</a>\n');
    const report = collectDatedDocumentBacklinks(f.root);
    const checkpoint = report.documents.find(d =>
      d.path === "docs/mission-control/2026-11-12-checkpoint.md");
    assert.deepEqual(checkpoint?.referencedBy, ["docs/mission-control/current.md"]);
    assert.equal(checkpoint?.disposition, "REVIEW_LINKED");
    assert.equal(report.deletionApproved, false);
  } finally { f.dispose(); }
});
