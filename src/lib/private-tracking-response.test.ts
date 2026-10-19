import { describe, expect, it } from "vitest";
import { isTrackingResponse } from "./private-tracking-response";

const valid = {
  found: true,
  status: "UNDER_VERIFICATION",
  createdAt: "2026-09-16T00:00:00.000Z",
  updatedAt: "2026-09-17T12:30:00.000Z",
} as const;

describe("private assistance tracking response boundary", () => {
  it("accepts validated status with exact server timestamp format", () => {
    expect(isTrackingResponse(valid)).toBe(true);
    expect(isTrackingResponse({ found: false })).toBe(true);
    for (const status of [
      "SUBMITTED", "DOCUMENTS_REQUESTED", "UNDER_VERIFICATION", "APPROVED",
      "REJECTED", "CONVERTED_TO_APPEAL", "CLOSED",
    ]) expect(isTrackingResponse({ ...valid, status })).toBe(true);
  });

  it.each([null, "", 123, [], {}, { found: true }, { found: "true" }, { found: 1 }])(
    "rejects structurally invalid response %j", body => {
      expect(isTrackingResponse(body)).toBe(false);
    },
  );

  it("rejects arbitrary or noncanonical statuses", () => {
    for (const status of ["PAID", "DELETED", "", "closed", "UNDER_VERIFICATION\nInvalid", "X".repeat(10000)]) {
      expect(isTrackingResponse({ ...valid, status })).toBe(false);
    }
  });

  it("rejects timestamps that would render Invalid Date or misleading chronology", () => {
    for (const value of [
      "not-a-date", "2026-20-99T00:00:00.000Z", "2026-09-16", "2026-09-16T00:00:00Z",
      "2026-02-30T00:00:00.000Z", "", null, 123,
    ]) {
      expect(isTrackingResponse({ ...valid, createdAt: value })).toBe(false);
      expect(isTrackingResponse({ ...valid, updatedAt: value })).toBe(false);
    }
    expect(isTrackingResponse({ ...valid, updatedAt: "2026-09-15T00:00:00.000Z" })).toBe(false);
  });
});
