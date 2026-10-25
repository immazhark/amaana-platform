import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { test } from "node:test";

import {
  mutatingAdminApiRoutes,
  protectedAdminSurfaces,
  readOnlyAdminApiRoutes,
} from "../e2e/admin-anonymous-routes.mjs";

// Run in the repository source checkout, NEVER in the source-free Playwright fixture.
function discoverSourceRoutes(sourceRoot, filename, prefix) {
  function visit(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
      const pathname = join(directory, entry.name);
      return entry.isDirectory()
        ? visit(pathname)
        : entry.isFile() && entry.name === filename ? [pathname] : [];
    });
  }

  return visit(sourceRoot).map(pathname => {
    const segments = relative(sourceRoot, dirname(pathname)).split(sep)
      .filter(Boolean)
      .filter(segment => !(segment.startsWith("(") && segment.endsWith(")")))
      .map(segment => segment.startsWith("[") && segment.endsWith("]")
        ? "not-a-real-id" : segment);
    return segments.length ? prefix + "/" + segments.join("/") : prefix;
  });
}

test("protected admin pages have explicit anonymous browser assertions", () => {
  const actual = discoverSourceRoutes(
    join(process.cwd(), "src/app/admin/(protected)"), "page.tsx", "/admin",
  );
  assert.ok(actual.length > 0, "Protected admin source tree must not be empty");
  assert.equal(new Set(protectedAdminSurfaces).size, protectedAdminSurfaces.length);
  assert.deepEqual(
    actual.filter(path => !protectedAdminSurfaces.includes(path)),
    [],
    "Add a named anonymous redirect assertion for each new protected page",
  );
});

test("admin API route coverage exactly matches the source handlers", () => {
  const actual = discoverSourceRoutes(
    join(process.cwd(), "src/app/api/admin"), "route.ts", "/api/admin",
  );
  const covered = [...readOnlyAdminApiRoutes, ...mutatingAdminApiRoutes];
  assert.ok(actual.length > 0, "Privileged admin API source tree must not be empty");
  assert.equal(new Set(covered).size, covered.length, "Duplicate API boundary");
  assert.deepEqual(covered.sort(), actual.sort(), "Update anonymous API assertions for source changes");
});

test("missing browser coverage is detected for newly added synthetic routes", () => {
  const root = mkdtempSync(join(tmpdir(), "amaana-admin-route-coverage-"));
  try {
    const pages = join(root, "pages");
    const routes = join(root, "apis");
    for (const [sourceRoot, subdir, filename] of [
      [pages, "appeals/[id]", "page.tsx"],
      [pages, "new-protected-area", "page.tsx"],
      [routes, "media/curated-gallery/status", "route.ts"],
      [routes, "new-privileged-endpoint", "route.ts"],
    ]) {
      const directory = join(sourceRoot, subdir);
      mkdirSync(directory, { recursive: true });
      writeFileSync(join(directory, filename), "// synthetic test fixture only\n");
    }
    const actualPages = discoverSourceRoutes(pages, "page.tsx", "/admin");
    const actualApis = discoverSourceRoutes(routes, "route.ts", "/api/admin");
    assert.deepEqual(
      actualPages.filter(path => !["/admin/appeals/not-a-real-id"].includes(path)),
      ["/admin/new-protected-area"],
    );
    assert.deepEqual(
      actualApis.filter(path => !["/api/admin/media/curated-gallery/status"].includes(path)),
      ["/api/admin/new-privileged-endpoint"],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
