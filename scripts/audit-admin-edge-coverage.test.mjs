import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  auditAdminEdgeCoverage,
  discoverAdminRoutes,
  proposedAdminRouteCoverage,
} from "./audit-admin-edge-coverage.mjs";

const publicRoutes = ["/admin/login", "/admin/forbidden"];
const protectedRoutes = ["/admin", "/admin/team", "/api/admin/media/curated-gallery/start"];

test("a complete proposed inventory remains unverified until live edge evidence exists", () => {
  const report = auditAdminEdgeCoverage({
    discovered: [...protectedRoutes, ...publicRoutes],
    proposed: protectedRoutes,
  });
  assert.equal(report.status, "PLAN_ONLY_UNVERIFIED");
  assert.deepEqual(report.uncovered, []);
  assert.deepEqual(report.unexpectedPublic, []);
  assert.deepEqual(report.externalGates, [
    "CLOUDFLARE_POLICY_AND_ZONE_NOT_VERIFIED",
    "ORIGIN_BYPASS_NOT_VERIFIED",
    "ADMIN_RECOVERY_NOT_APPROVED",
  ]);
});

test("a newly added privileged API route fails closed if absent from the proposal", () => {
  assert.throws(() => auditAdminEdgeCoverage({
    discovered: [...protectedRoutes, ...publicRoutes, "/api/admin/media/curated-gallery/upload"],
    proposed: protectedRoutes,
  }), /Uncovered admin routes.*upload/);
});

test("a new protected document handler fails closed if unlisted", () => {
  assert.throws(() => auditAdminEdgeCoverage({
    discovered: [...protectedRoutes, ...publicRoutes, "/admin/documents/[id]"],
    proposed: protectedRoutes,
  }), /Uncovered admin routes.*documents/);
});

test("guest exposure cannot be expanded through the coverage proposal", () => {
  assert.throws(() => auditAdminEdgeCoverage({
    discovered: [...protectedRoutes, ...publicRoutes],
    proposed: protectedRoutes.filter(path => path !== "/admin/team"),
    publicAllowlist: [...publicRoutes, "/admin/team"],
  }), /Unexpected public admin routes.*team/);
  assert.throws(() => auditAdminEdgeCoverage({
    discovered: [...protectedRoutes, ...publicRoutes],
    proposed: [...protectedRoutes, "/admin/forbidden"],
    publicAllowlist: ["/admin/login"],
  }), /Required guest recovery routes/);
});

test("stale paths, duplicates, unknown paths, and invalid inventories fail closed", () => {
  for (const proposed of [
    [...protectedRoutes, "/admin/removed"],
    [...protectedRoutes, "/admin/team"],
    [...protectedRoutes, "https://example.org/admin"],
  ]) {
    assert.throws(() => auditAdminEdgeCoverage({
      discovered: [...protectedRoutes, ...publicRoutes], proposed,
    }));
  }
  assert.throws(() => auditAdminEdgeCoverage({ discovered: [], proposed: protectedRoutes }));
});

test("repository inventory detects pathless layouts, dynamic routes and API handlers", () => {
  const inventory = discoverAdminRoutes();
  assert.ok(inventory.includes("/admin"));
  assert.ok(inventory.includes("/admin/documents/[id]"));
  assert.ok(inventory.includes("/api/admin/media/curated-gallery/publish"));
  assert.ok(inventory.includes("/admin/login"));
  assert.ok(!inventory.some(path => path.includes("(protected)")));
  const report = auditAdminEdgeCoverage({ discovered: inventory, proposed: proposedAdminRouteCoverage });
  assert.equal(report.status, "PLAN_ONLY_UNVERIFIED");
});

test("symlinked route handlers fail closed instead of vanishing from the inventory", () => {
  const root = mkdtempSync(join(tmpdir(), "amaana-edge-routes-"));
  try {
    mkdirSync(join(root, "admin"));
    writeFileSync(join(root, "target.tsx"), "export default function Page() { return null; }\n");
    symlinkSync(join(root, "target.tsx"), join(root, "admin", "page.tsx"));
    assert.throws(() => discoverAdminRoutes(root), /Symlink.*admin/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("pathless route groups cannot hide admin pages or API handlers from the edge proposal", () => {
  const root = mkdtempSync(join(tmpdir(), "amaana-grouped-admin-"));
  try {
    for (const file of [
      "admin/page.tsx", "admin/login/page.tsx", "admin/forbidden/page.tsx",
      "api/admin/start/route.ts", "(staff)/admin/reports/page.tsx",
      "api/(internal)/admin/review/route.ts", "(staff)/site/page.tsx",
    ]) {
      const fullPath = join(root, file);
      mkdirSync(fullPath.slice(0, fullPath.lastIndexOf("/")), { recursive: true });
      writeFileSync(fullPath, "export default function SyntheticRoute() { return null; }\n");
    }
    const discovered = discoverAdminRoutes(root);
    assert.deepEqual(discovered, [
      "/admin", "/admin/forbidden", "/admin/login", "/admin/reports",
      "/api/admin/review", "/api/admin/start",
    ]);
    assert.throws(() => auditAdminEdgeCoverage({
      discovered, proposed: ["/admin", "/api/admin/start"],
    }), /Uncovered admin routes.*reports.*review/);
    const report = auditAdminEdgeCoverage({
      discovered,
      proposed: ["/admin", "/admin/reports", "/api/admin/review", "/api/admin/start"],
    });
    assert.equal(report.status, "PLAN_ONLY_UNVERIFIED");
    assert.equal(report.proposedProtectedRouteCount, 4);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("pathless route groups cannot conceal colliding public admin URLs", () => {
  const root = mkdtempSync(join(tmpdir(), "amaana-group-collision-"));
  try {
    for (const file of [
      "admin/page.tsx", "(staff)/admin/page.tsx", "api/admin/status/route.ts",
    ]) {
      const fullPath = join(root, file);
      mkdirSync(fullPath.slice(0, fullPath.lastIndexOf("/")), { recursive: true });
      writeFileSync(fullPath, "export default function SyntheticRoute() { return null; }\n");
    }
    assert.throws(() => discoverAdminRoutes(root), /duplicate route: \/admin/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
