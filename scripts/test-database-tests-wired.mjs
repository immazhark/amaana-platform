import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import test from "node:test";

// A *.database.test.ts file that CI never runs gives false comfort: it can be red or wrong and nothing notices. The CI
// database job once selected tests from a hand-kept list, and new files were silently skipped. This guard fails when a
// database test exists that the job would not run, and when a database test is missing the checks that make it safe to
// run by a broad selection (opt-in switch, loopback host, isolated database name).

const root = join(import.meta.dirname, "..");

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

export function databaseCommand(ciText) {
  return ciText.split("\n").find(line => /npx vitest run/.test(line) && /database\.test\.ts/.test(line)) ?? null;
}

/** Files the CI command would not run. A bare `.database.test.ts` argument selects every file with that suffix. */
export function unselected(command, files) {
  if (command === null) return files;
  if (/\s\.database\.test\.ts(\s|$)/.test(command)) return [];
  return files.filter(file => !command.includes(file));
}

/** Database tests missing a safety check, given each file's text. */
export function unguarded(texts) {
  return Object.entries(texts)
    .filter(([, text]) => !(text.includes("AMAANA_DATABASE_TESTS") && text.includes("localhost") && text.includes('"/amaana"')))
    .map(([file]) => file);
}

const files = walk(join(root, "src"))
  .filter(file => file.endsWith(".database.test.ts"))
  .map(file => relative(root, file).split(sep).join("/"))
  .sort();
const ci = readFileSync(join(root, ".github", "workflows", "ci.yml"), "utf8");

test("the repository has database tests, so the guard is not vacuous", () => {
  assert.ok(files.length >= 7, `expected at least 7 database test files, found ${files.length}`);
});

test("the CI database job selects every database test file", () => {
  assert.notEqual(databaseCommand(ci), null, "no vitest database command found in ci.yml");
  assert.deepEqual(unselected(databaseCommand(ci), files), []);
});

test("every database test is opt-in, loopback-only and bound to the isolated database", () => {
  const texts = Object.fromEntries(files.map(file => [file, readFileSync(join(root, file), "utf8")]));
  assert.deepEqual(unguarded(texts), []);
});

test("the selection check fails for a hand-kept list that omits a file, and passes for the suffix selection", () => {
  const list = "npx vitest run src/a.database.test.ts src/b.database.test.ts";
  assert.deepEqual(unselected(list, ["src/a.database.test.ts", "src/b.database.test.ts", "src/c.database.test.ts"]), ["src/c.database.test.ts"]);
  assert.deepEqual(unselected("npx vitest run .database.test.ts", ["src/c.database.test.ts"]), []);
  assert.deepEqual(unselected(null, ["src/c.database.test.ts"]), ["src/c.database.test.ts"]);
});

test("the guard check fails for a database test without the loopback or opt-in checks", () => {
  const safe = 'process.env.AMAANA_DATABASE_TESTS; ["localhost"]; "/amaana"';
  assert.deepEqual(unguarded({ ok: safe }), []);
  assert.deepEqual(unguarded({ noOptIn: '["localhost"]; "/amaana"' }), ["noOptIn"]);
  assert.deepEqual(unguarded({ noLoopback: 'AMAANA_DATABASE_TESTS; "/amaana"' }), ["noLoopback"]);
  assert.deepEqual(unguarded({ noName: 'AMAANA_DATABASE_TESTS; localhost' }), ["noName"]);
});

// The annual-capacity predicate and temporary audit triggers span records in a shared database.
// File-level concurrency is not business-operation concurrency: Promise.all races inside tests remain enabled.
test("the shared database job isolates file fixtures without dropping any database test", () => {
  assert.equal(databaseCommand(ci)?.trim(), "npx vitest run .database.test.ts --no-file-parallelism");
});
