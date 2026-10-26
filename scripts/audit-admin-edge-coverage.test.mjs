import assert from "node:assert/strict";
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
