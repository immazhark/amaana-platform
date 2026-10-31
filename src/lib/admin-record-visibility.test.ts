import { describe, expect, it } from "vitest";
import {
  STAGING_ASSISTANCE_REFERENCE,
  STAGING_APPEAL_SLUG,
  adminRecordView,
  assistanceAdminWhere,
  appealAdminWhere,
} from "./admin-record-visibility";

describe("admin historical staging visibility", () => {
  it("defaults missing, malformed and array-valued view selectors to live records", () => {
    expect(adminRecordView(undefined)).toBe("live");
    expect(adminRecordView("unexpected")).toBe("live");
    expect(adminRecordView(["tests"])).toBe("live");
    expect(adminRecordView("tests")).toBe("tests");
  });

  it("excludes only the exact historical synthetic case in the live assistance query", () => {
    expect(STAGING_ASSISTANCE_REFERENCE).toBe("AF-STAGING-ACCEPTANCE");
    expect(assistanceAdminWhere("live")).toEqual({
      referenceNumber: { not: "AF-STAGING-ACCEPTANCE" },
    });
    expect(assistanceAdminWhere("live", "SUBMITTED")).toEqual({
      referenceNumber: { not: "AF-STAGING-ACCEPTANCE" },
      status: "SUBMITTED",
    });
  });

  it("shows only the retained exact synthetic case in the historical assistance view", () => {
    expect(assistanceAdminWhere("tests")).toEqual({
      referenceNumber: "AF-STAGING-ACCEPTANCE",
    });
    expect(assistanceAdminWhere("tests", "CONVERTED_TO_APPEAL")).toEqual({
      referenceNumber: "AF-STAGING-ACCEPTANCE",
      status: "CONVERTED_TO_APPEAL",
    });
  });

  it("excludes only the exact synthetic appeal from normal admin appeal queries", () => {
    expect(STAGING_APPEAL_SLUG).toBe("staging-checkout-acceptance");
    expect(appealAdminWhere("live")).toEqual({
      slug: { not: "staging-checkout-acceptance" },
    });
    expect(appealAdminWhere("live", "PUBLISHED")).toEqual({
      slug: { not: "staging-checkout-acceptance" },
      status: "PUBLISHED",
    });
  });

  it("retains exact synthetic appeal access through explicit historical view", () => {
    expect(appealAdminWhere("tests")).toEqual({
      slug: "staging-checkout-acceptance",
    });
    expect(appealAdminWhere("tests", "PUBLISHED")).toEqual({
      slug: "staging-checkout-acceptance",
      status: "PUBLISHED",
    });
  });
});
