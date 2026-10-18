import { describe, expect, it } from "vitest";
import { getNavigationLoadingView } from "./navigation-route-loading";

describe("AF-R071 safe client route-loading projections", () => {
  it.each([
    ["/donate", "Loading donation options", "form"],
    ["/donate/approved-appeal", "Loading donation options", "form"],
    ["/appeals", "Loading verified appeals", "cards"],
    ["/impact", "Loading documented impact", "cards"],
    ["/our-work/current-drive", "Loading published programmes", "cards"],
    ["/request-assistance", "Loading the private assistance request", "form"],
    ["/transparency", "Loading transparency information", "editorial"],
  ])("identifies a pending public route %s without starting a server stream", (path, label, layout) => {
    expect(getNavigationLoadingView(path)).toEqual({ label, layout });
  });

  it.each(["/admin", "/admin/login", "/donations/receipt", "/donate-anything", "/transparency-backup", "/"])(
    "does not assert a review-specific loading claim for %s", path => {
      expect(getNavigationLoadingView(path)).toBeNull();
    },
  );
});
