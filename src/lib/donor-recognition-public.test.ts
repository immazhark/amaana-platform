import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("public Shukr publication and moderation contract", () => {
  it("selects only name field after captured, unrefunded, reviewed consent", () => {
    const repo = readFileSync(new URL("./donor-recognition-repository.ts", import.meta.url), "utf8");
    expect(repo).toContain('recognitionApprovedAt: { not: null }');
    expect(repo).toContain("recognitionRevokedAt: null");
    expect(repo).toContain('status: "CAPTURED"');
    expect(repo).toContain("isAnonymous: false");
    expect(repo).toContain("refundedAmount: 0");
    expect(repo).toContain("name: row.recognitionDisplayName!");
    expect(repo).not.toContain("select: { donorEmail");
  });
  it("has a separate, permission-gated staff review path and no public bypass", () => {
    const admin = readFileSync(new URL("../app/admin/(protected)/donations/recognition/page.tsx", import.meta.url), "utf8");
    const actions = readFileSync(new URL("../app/admin/(protected)/donations/recognition/actions.ts", import.meta.url), "utf8");
    expect(admin).toContain('requirePermission("donation.reconcile")');
    expect(actions).toContain('requirePermission("donation.reconcile")');
    expect(actions).toContain('withSerializableTransactionRetry');
    expect(actions).toContain("recognitionRequestedAt: requestedAt");
    expect(actions).toContain("auditEvent.create");
  });
});
