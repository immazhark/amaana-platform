import { describe, expect, it } from "vitest";
import { DONOR_RIGHTS_KINDS, isDonorRightsKind, projectDonorRightsStatuses } from "./donor-rights";

describe("donation-specific data-rights request contract", () => {
  it("rejects arbitrary data deletion scopes or arbitrary case queries", () => {
    expect(DONOR_RIGHTS_KINDS).toEqual(["ACCESS", "CORRECTION", "DELETION_REVIEW"]);
    for (const value of ["ALL_ACCOUNTS", "DELETE_NOW", "PAYMENT_CANCEL", null, 1]) {
      expect(isDonorRightsKind(value)).toBe(false);
    }
  });
  it("provides latest per-kind status without exposing donation or contact data", () => {
    const sourceWithPrivateData = {
      kind: "ACCESS", status: "OPEN", createdAt: new Date("2026-10-10T12:00:00Z"),
      email: "hidden@demo.invalid",
    };
    const result = projectDonorRightsStatuses([
      sourceWithPrivateData,
      { kind: "ACCESS", status: "IN_REVIEW", createdAt: new Date("2026-10-12T12:00:00Z") },
      { kind: "DELETION_REVIEW", status: "OPEN", createdAt: new Date("2026-10-11T12:00:00Z") },
      { kind: "UNKNOWN", status: "CLOSED", createdAt: new Date("2026-10-13T12:00:00Z") },
    ]);
    expect(result).toEqual([
      { kind: "ACCESS", status: "IN_REVIEW", requestedAt: "2026-10-12T12:00:00.000Z" },
      { kind: "DELETION_REVIEW", status: "OPEN", requestedAt: "2026-10-11T12:00:00.000Z" },
    ]);
    expect(JSON.stringify(result)).not.toContain("hidden@demo.invalid");
  });
  it("drops invalid times and invalid states", () => {
    expect(projectDonorRightsStatuses([{ kind: "ACCESS", status: "PUBLISHED", createdAt: new Date() },
      { kind: "CORRECTION", status: "OPEN", createdAt: new Date(NaN) }])).toEqual([]);
  });
});
