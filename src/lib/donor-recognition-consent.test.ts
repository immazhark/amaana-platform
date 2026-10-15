import { describe, expect, it } from "vitest";
import { donorConsentAuditEntry, recognitionVersionWhere } from "./donor-recognition-consent";

describe("receipt-scoped, privacy-minimized donor Shukr audit model", () => {
  it("preserves only donation identity and action without name, token or email", () => {
    const entry = donorConsentAuditEntry("donation-001", "REQUESTED");
    expect(entry).toEqual({ donationId: "donation-001", action: "REQUESTED" });
    expect(JSON.stringify(entry)).not.toContain("receipt");
    expect(() => donorConsentAuditEntry("donation-001", "PUBLISHED" as never)).toThrow();
  });
  it("protects every recognition consent field against stale concurrent writes", () => {
    const stamp = new Date("2026-10-15T08:00:00Z");
    const record = { id: "donation-001", recognitionDisplayName: "Chosen Name",
      recognitionRequestedAt: stamp, recognitionApprovedAt: null, recognitionRevokedAt: null,
      donorEmail: "not-exposed@example.org", receiptTokenHash: "secret" };
    expect(recognitionVersionWhere(record)).toEqual({
      id: record.id, recognitionDisplayName: "Chosen Name", recognitionRequestedAt: stamp,
      recognitionApprovedAt: null, recognitionRevokedAt: null,
    });
    expect(JSON.stringify(recognitionVersionWhere(record))).not.toContain("not-exposed");
  });
});
