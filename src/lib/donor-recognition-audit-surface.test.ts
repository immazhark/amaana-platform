import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("private donor recognition event audit UI", () => {
  const source = readFileSync(new URL("../app/admin/(protected)/donations/recognition/page.tsx", import.meta.url), "utf8");
  it("is protected by the existing staff reconciliation permission and feature gate", () => {
    expect(source).toContain('requirePermission("donation.reconcile")');
    expect(source).toContain("const [consentHistory, totalConsentEvents] = donorRecognitionEnabled()");
    expect(source).toContain("prisma.donorRecognitionConsentEvent.findMany");
  });
  it("keeps hidden ineligible pending consent requests available for audited staff cleanup", () => {
    expect(source).toContain('recognitionRequestedAt: { not: null }');
    expect(source).toContain('OR: [{ status: { not: "CAPTURED" } }, { isAnonymous: true }');
    expect(source).toContain('refundedAmount: { gt: 0 }');
    expect(source).toContain("ineligiblePendingCount > ineligiblePending.length");
    expect(source).toContain('approvedAt={null}');
    expect(source).toContain('remove the stale request');
  });
  it("only fetches action and timestamp, with a donation-scoped staff-only link", () => {
    expect(source).toContain('select: { id: true, action: true, createdAt: true, donationId: true,');
    expect(source).toContain('donation: { select: { referenceNumber: true } }');
    expect(source).toContain('event.action === "WITHDRAWN"');
    expect(source).toContain('href={`/admin/donations/${event.donationId}`}');
    expect(source).not.toContain("receiptTokenHash");
    expect(source).not.toContain("donorEmail");
  });
  it("warns about bounded history rather than implying full coverage", () => {
    expect(source).toContain('take: 50');
    expect(source).toContain("prisma.donorRecognitionConsentEvent.count()");
    expect(source).toContain("totalConsentEvents > consentHistory.length");
  });
});
