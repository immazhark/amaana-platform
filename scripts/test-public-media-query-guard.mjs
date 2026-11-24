import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";

// AF-PROMOTION guard: every public (non-admin) source file that queries media assets must carry
// BOTH publication filters, so withdrawn or unreviewed media cannot reach a public surface.
// A new public query without them fails here; admin tooling and tests are exempt.
const ROOT = new URL("../", import.meta.url).pathname.replace(/^[/]([A-Za-z]:)/, "$1");
const QUERY = /mediaAsset[.](?:findMany|findFirst|findUnique)|mediaAssets:\s*[{]/;

function sources(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /[.]tsx?$/.test(name) && !/[.](?:test|spec)[.]tsx?$/.test(name) ? [path] : [];
  });
}

export function missingFilters(source) {
  if (!QUERY.test(source)) return [];
  return ["isPublic", "privacyApprovedAt"].filter((token) => !source.includes(token));
}

test("the checker flags a media query without both publication filters", () => {
  assert.deepEqual(missingFilters("const x = await prisma.mediaAsset.findMany({ where: { kind: 'IMAGE' } });"), ["isPublic", "privacyApprovedAt"]);
  assert.deepEqual(missingFilters("prisma.mediaAsset.findMany({ where: { isPublic: true, privacyApprovedAt: { not: null } } })"), []);
  assert.deepEqual(missingFilters("const nothing = 1;"), []);
});

test("every public source file that queries media applies isPublic and privacyApprovedAt", () => {
  const offenders = [];
  for (const file of sources(join(ROOT, "src"))) {
    const key = relative(ROOT, file).replaceAll("\\", "/");
    if (key.includes("/admin/") || key.startsWith("src/app/api/admin/")) continue;
    const missing = missingFilters(readFileSync(file, "utf8"));
    if (missing.length) offenders.push(`${key}: missing ${missing.join(", ")}`);
  }
  assert.deepEqual(offenders, []);
});
