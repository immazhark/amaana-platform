import { describe, expect, it } from "vitest";
import { retentionDeletionConfirmed } from "./retention-safety";

describe("retentionDeletionConfirmed", () => {
  it("allows non-delete retention decisions without destructive confirmation", () => {
    expect(retentionDeletionConfirmed("RETAIN", "")).toBe(true);
    expect(retentionDeletionConfirmed("PLACE_HOLD", "")).toBe(true);
    expect(retentionDeletionConfirmed("RELEASE_HOLD", "")).toBe(true);
  });

  it("requires the exact DELETE confirmation for destructive retention decisions", () => {
    expect(retentionDeletionConfirmed("DELETE", "")).toBe(false);
    expect(retentionDeletionConfirmed("DELETE", "delete")).toBe(false);
    expect(retentionDeletionConfirmed("DELETE", "DELETE")).toBe(true);
    expect(retentionDeletionConfirmed("DELETE", "  DELETE  ")).toBe(true);
  });
});
