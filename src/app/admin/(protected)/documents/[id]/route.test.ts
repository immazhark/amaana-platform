import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  permission: vi.fn(),
  findDocument: vi.fn(),
  signedUrl: vi.fn(),
  audit: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requirePermission: mocks.permission }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    assistanceDocument: { findUnique: mocks.findDocument },
    auditEvent: { create: mocks.audit },
  },
}));
vi.mock("@/lib/storage", () => ({ getPrivateDocumentUrl: mocks.signedUrl }));

import { GET } from "./route";

const request = new Request("https://example.invalid/admin/documents/synthetic-document");
const context = { params: Promise.resolve({ id: "synthetic-document" }) };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.permission.mockResolvedValue({ id: "synthetic-authorised-staff" });
  mocks.findDocument.mockResolvedValue({
    id: "synthetic-document",
    objectKey: "assistance/synthetic-request/synthetic-file.pdf",
    assistanceRequestId: "synthetic-request",
  });
  mocks.signedUrl.mockResolvedValue("https://private-store.example.invalid/document?expires=60&token=synthetic");
  mocks.audit.mockResolvedValue({ id: "synthetic-audit" });
});

describe("AF-R012 private assistance document download boundaries", () => {
  it("requires assistance.view before looking up or signing an evidence document", async () => {
    mocks.permission.mockRejectedValueOnce(new Error("Missing assistance.view"));
    await expect(GET(request, context)).rejects.toThrow("Missing assistance.view");
    expect(mocks.permission).toHaveBeenCalledWith("assistance.view");
    expect(mocks.findDocument).not.toHaveBeenCalled();
    expect(mocks.signedUrl).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });

  it("returns a non-cacheable private 404 without storage or audit calls for a missing document", async () => {
    mocks.findDocument.mockResolvedValueOnce(null);
    const response = await GET(request, context);
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive");
    expect(mocks.signedUrl).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });

  it("queries only the intended document ID and minimal private columns", async () => {
    await GET(request, context);
    expect(mocks.findDocument).toHaveBeenCalledWith({
      where: { id: "synthetic-document" },
      select: { id: true, objectKey: true, assistanceRequestId: true },
    });
    expect(mocks.permission).toHaveBeenCalledWith("assistance.view");
  });

  it("signs for the owning request, audits the read and redirects with private headers", async () => {
    const response = await GET(request, context);
    expect(mocks.signedUrl).toHaveBeenCalledWith(
      "assistance/synthetic-request/synthetic-file.pdf", "synthetic-request",
    );
    expect(mocks.audit).toHaveBeenCalledWith({
      data: {
        actorId: "synthetic-authorised-staff",
        action: "assistance.document_viewed",
        entityType: "AssistanceRequest",
        entityId: "synthetic-request",
        metadata: { documentId: "synthetic-document" },
      },
    });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://private-store.example.invalid/document?expires=60&token=synthetic",
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive");
    expect(mocks.audit.mock.invocationCallOrder[0]!).toBeGreaterThan(mocks.signedUrl.mock.invocationCallOrder[0]!);
  });

  it("fails closed without recording a view when private signing fails", async () => {
    mocks.signedUrl.mockRejectedValueOnce(new Error("Private signing unavailable"));
    await expect(GET(request, context)).rejects.toThrow("Private signing unavailable");
    expect(mocks.audit).not.toHaveBeenCalled();
  });

  it("does not provide a signed redirect when the private access audit cannot be written", async () => {
    mocks.audit.mockRejectedValueOnce(new Error("Audit store unavailable"));
    await expect(GET(request, context)).rejects.toThrow("Audit store unavailable");
    expect(mocks.signedUrl).toHaveBeenCalledOnce();
    expect(mocks.audit).toHaveBeenCalledOnce();
  });
});
