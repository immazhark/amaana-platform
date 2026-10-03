import { describe, expect, it } from "vitest";
import { adminHomePathForPermissions, adminNavigationForPermissions, isAdminNavigationActive } from "./admin-navigation";

describe("admin landing routing", () => {
  it("keeps assistance reviewers on the case queue", () => {
    expect(adminHomePathForPermissions(["assistance.view", "donation.view"])).toBe("/admin");
  });

  it("routes specialized admins to the first area they are allowed to use", () => {
    expect(adminHomePathForPermissions(["assistance.approve"])).toBe("/admin/retention");
    expect(adminHomePathForPermissions(["donation.view"])).toBe("/admin/donations");
    expect(adminHomePathForPermissions(["notification.view"])).toBe("/admin/notifications");
    expect(adminHomePathForPermissions(["content.view"])).toBe("/admin/media");
    expect(adminHomePathForPermissions(["appeal.view"])).toBe("/admin/appeals");
    expect(adminHomePathForPermissions(["rbac.manage"])).toBe("/admin/audit");
  });

  it("fails closed when an account has no recognized admin permission", () => {
    expect(adminHomePathForPermissions([])).toBe("/admin/forbidden");
  });
});

describe("admin navigation visibility", () => {
  it("shows only destinations backed by explicit view/approval permissions", () => {
    expect(adminNavigationForPermissions(["assistance.view", "assistance.update", "donation.view", "notification.view"]))
      .toEqual([
        { permission: "assistance.view", path: "/admin", label: "Assistance queue" },
        { permission: "donation.view", path: "/admin/donations", label: "Donations" },
        { permission: "notification.view", path: "/admin/notifications", label: "Notification delivery" },
      ]);
  });

  it("does not treat mutation-only permissions as permission to browse an area", () => {
    expect(adminNavigationForPermissions(["assistance.update", "appeal.publish", "content.publish"]))
      .toEqual([]);
  });

  it("shows audit history only to the RBAC manager", () => {
    expect(adminNavigationForPermissions(["rbac.manage"]))
      .toEqual([{ permission: "rbac.manage", path: "/admin/audit", label: "Audit history" }]);
  });

  it("keeps the canonical operations order for a full administrator", () => {
    expect(adminNavigationForPermissions([
      "donation.view",
      "assistance.approve",
      "content.view",
      "appeal.view",
      "assistance.view",
      "rbac.manage",
      "notification.view",
    ]).map(item => item.label)).toEqual([
      "Assistance queue",
      "Appeals",
      "Media review",
      "Retention review",
      "Donations",
      "Notification delivery",
      "Audit history",
    ]);
  });
});


describe("admin active navigation semantics", () => {
  it("maps assistance request details back to the assistance queue", () => {
    expect(isAdminNavigationActive("/admin", "/admin")).toBe(true);
    expect(isAdminNavigationActive("/admin/requests/req_123", "/admin")).toBe(true);
    expect(isAdminNavigationActive("/admin/requests/req_123/evidence", "/admin")).toBe(true);
  });

  it("keeps non-assistance admin areas from activating the assistance queue", () => {
    expect(isAdminNavigationActive("/admin/appeals", "/admin")).toBe(false);
    expect(isAdminNavigationActive("/admin/retention", "/admin")).toBe(false);
    expect(isAdminNavigationActive("/admin/donations", "/admin")).toBe(false);
  });

  it("activates exact and nested destinations without prefix collisions", () => {
    expect(isAdminNavigationActive("/admin/donations", "/admin/donations")).toBe(true);
    expect(isAdminNavigationActive("/admin/donations/don_123", "/admin/donations")).toBe(true);
    expect(isAdminNavigationActive("/admin/donations-archive", "/admin/donations")).toBe(false);
  });
});
