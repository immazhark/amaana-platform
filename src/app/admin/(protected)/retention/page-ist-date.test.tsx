import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  permission: vi.fn(), count: vi.fn(), docs: vi.fn(), history: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requirePermission: mocks.permission }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    assistanceDocument: { count: mocks.count, findMany: mocks.docs },
    auditEvent: { findMany: mocks.history },
  },
}));
vi.mock("./actions", () => ({ reviewDocumentRetention: vi.fn() }));

import RetentionReviewPage from "./page";

const syntheticDoc = {
  id: "synthetic-document", assistanceRequestId: "synthetic-request",
  originalName: "Synthetic-private-evidence.pdf", mimeType: "application/pdf",
  sizeBytes: 2048, assistanceRequest: {
    id: "synthetic-request", referenceNumber: "SYNTHETIC-REQ-01",
    applicantName: "Synthetic applicant", status: "CLOSED", appeal: null,
  },
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("TZ", "UTC");
  mocks.permission.mockResolvedValue({ id: "synthetic-retention-approver" });
  mocks.count.mockResolvedValue(1);
  mocks.docs.mockResolvedValue([syntheticDoc]);
  mocks.history.mockResolvedValue([]);
});
afterEach(() => vi.unstubAllEnvs());

describe("private retention review IST audit timestamps", () => {
  it.each([
    ["2026-12-31T18:29:59.000Z", "31/12/2026"],
    ["2026-12-31T18:30:00.000Z", "1/1/2027"],
  ])("shows a review at %s on local day %s", async (utc, date) => {
    mocks.history.mockResolvedValueOnce([{
      id: "synthetic-review", action: "assistance.document_retention_reviewed",
      metadata: { documentId: syntheticDoc.id, reason: "Synthetic review only" },
      actor: { name: "Synthetic reviewer" }, createdAt: new Date(utc),
    }]);
    const html = renderToStaticMarkup(await RetentionReviewPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("Synthetic reviewer · " + date);
    expect(mocks.permission).toHaveBeenCalledWith("assistance.approve");
  });

  it("dates the last legal hold by IST without changing the deletion gate", async () => {
    mocks.history.mockResolvedValueOnce([{
      id: "synthetic-hold", action: "assistance.document_legal_hold_placed",
      metadata: { documentId: syntheticDoc.id },
      actor: { name: "Synthetic holder" }, createdAt: new Date("2026-12-31T18:35:00.000Z"),
    }]);
    const html = renderToStaticMarkup(await RetentionReviewPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("Placed by Synthetic holder on 1/1/2027");
    expect(html).toContain("Deletion suspended by hold");
    expect(html).toContain("Release legal/audit/safeguarding hold");
  });

  it("rejects a viewer without assistance.approve before accessing private evidence", async () => {
    mocks.permission.mockRejectedValueOnce(new Error("assistance.approve required"));
    await expect(RetentionReviewPage({ searchParams: Promise.resolve({}) }))
      .rejects.toThrow("assistance.approve required");
    expect(mocks.count).not.toHaveBeenCalled();
    expect(mocks.docs).not.toHaveBeenCalled();
    expect(mocks.history).not.toHaveBeenCalled();
  });
});
