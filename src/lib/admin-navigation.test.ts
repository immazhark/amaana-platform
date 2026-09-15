import { describe, expect, it } from "vitest";
import { adminHomePathForPermissions } from "./admin-navigation";

describe("admin landing routing", () => {
  it("keeps assistance reviewers on the case queue", () => {
    expect(adminHomePathForPermissions(["assistance.view", "donation.view"])).toBe("/admin");
  });

  it("routes specialized admins to the first area they are allowed to use", () => {
    expect(adminHomePathForPermissions(["donation.view"])).toBe("/admin/donations");
    expect(adminHomePathForPermissions(["content.view"])).toBe("/admin/media");
    expect(adminHomePathForPermissions(["appeal.view"])).toBe("/admin/appeals");
  });

  it("fails closed when an account has no recognized admin permission", () => {
    expect(adminHomePathForPermissions([])).toBe("/admin/forbidden");
  });
});
