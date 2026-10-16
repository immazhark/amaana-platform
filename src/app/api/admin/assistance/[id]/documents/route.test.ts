import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  origin: vi.fn(), currentUser: vi.fn(), permission: vi.fn(),
  caseFind: vi.fn(), documentFind: vi.fn(), documentCreate: vi.fn(),
  auditCreate: vi.fn(), transact: vi.fn(), upload: vi.fn(), remove: vi.fn(), log: vi.fn(),
}));
vi.mock("@/lib/request-security", () => ({ isSameOrigin: m.origin }));
vi.mock("@/lib/auth", () => ({
  getCurrentUser: m.currentUser, hasPermission: m.permission,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    assistanceRequest: { findUnique: m.caseFind },
    assistanceDocument: { findUnique: m.documentFind },
  },
}));
vi.mock("@/lib/prisma-transaction", () => ({
  withSerializableTransactionRetry: m.transact,
}));
vi.mock("@/lib/storage", () => ({
  MAX_FILE_BYTES: 5 * 1024 * 1024,
  PrivateDocumentValidationError: class PrivateDocumentValidationError extends Error {},
  uploadPrivateDocument: m.upload,
  deletePrivateDocumentObject: m.remove,
}));
vi.mock("@/lib/server-log", () => ({ logServerError: m.log }));
import { POST } from "./route";

const id = "case-synthetic";
const params = { params: Promise.resolve({ id }) };
const evidence = {
  objectKey: "assistance/case-synthetic/12345678-1234-4234-8234-123456789012.pdf",
  originalName: "delivery-evidence.pdf", mimeType: "application/pdf", sizeBytes: 14,
};
const eligible = {
  status: "APPROVED", appealId: null,
  verification: { decision: "APPROVED_PRIVATE", completedAt: new Date() },
  _count: { documents: 3 }, deliveryRecords: [{ id: "delivery-1" }],
};
const transaction = {
  assistanceRequest: { findUnique: m.caseFind },
  assistanceDocument: { create: m.documentCreate },
  auditEvent: { create: m.auditCreate },
};
function request(file: File | null = new File(["%PDF-1.4\nproof"], "delivery-evidence.pdf", { type: "application/pdf" })) {
  const body = new FormData();
  if (file) body.set("document", file);
  return new Request("https://example.org/api/admin/assistance/case-synthetic/documents", {
    method: "POST", body,
    headers: { origin: "https://example.org" },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  m.origin.mockReturnValue(true);
  m.currentUser.mockResolvedValue({ id: "staff-1" });
  m.permission.mockReturnValue(true);
  m.caseFind.mockResolvedValue(eligible);
  m.documentFind.mockResolvedValue(null);
  m.documentCreate.mockResolvedValue({ id: "document-new" });
  m.auditCreate.mockResolvedValue({ id: "audit-new" });
  m.upload.mockResolvedValue(evidence);
  m.remove.mockResolvedValue(undefined);
  m.transact.mockImplementation(async (callback: (tx: typeof transaction) => Promise<unknown>) =>
    callback(transaction));
});

describe("staff-only private delivery-proof upload", () => {
  it("rejects cross-origin requests before authentication or storage", async () => {
    m.origin.mockReturnValue(false);
    const response = await POST(request(), params);
    expect(response.status).toBe(403);
    expect(m.currentUser).not.toHaveBeenCalled();
    expect(m.upload).not.toHaveBeenCalled();
  });
  it("requires BOTH private case-view and update permissions", async () => {
    m.permission.mockImplementation((_u: unknown, key: string) => key !== "assistance.update");
    const response = await POST(request(), params);
    expect(response.status).toBe(403);
    expect(m.caseFind).not.toHaveBeenCalled();
  });
  it("rejects missing files and unverified cases without writing an object", async () => {
    expect((await POST(request(null), params)).status).toBe(400);
    m.caseFind.mockResolvedValue({ ...eligible, deliveryRecords: [] });
    expect((await POST(request(), params)).status).toBe(409);
    expect(m.upload).not.toHaveBeenCalled();
  });
  it("only allows the original reporter of an unreviewed report missing proof", async () => {
    m.caseFind.mockResolvedValue({ ...eligible, deliveryRecords: [] });
    const response = await POST(request(), params);
    expect(response.status).toBe(409);
    expect(m.upload).not.toHaveBeenCalled();
  });
  it("caps evidence growth before private storage is written", async () => {
    m.caseFind.mockResolvedValue({ ...eligible, _count: { documents: 30 } });
    expect((await POST(request(), params)).status).toBe(409);
    expect(m.upload).not.toHaveBeenCalled();
  });
  it("persists only private metadata and a case-scoped audit after upload", async () => {
    const result = await POST(request(), params);
    expect(result.status).toBe(201);
    expect(await result.json()).toEqual({ documentId: "document-new" });
    expect(result.headers.get("Cache-Control")).toBe("private, no-store");
    expect(m.upload).toHaveBeenCalledWith(expect.any(File), id);
    expect(m.caseFind).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.objectContaining({
        deliveryRecords: {
          where: { state: "REPORTED", reportedById: "staff-1", evidenceDocumentId: null },
          select: { id: true }, take: 1,
        },
      }),
    }));
    expect(m.documentCreate).toHaveBeenCalledWith({
      data: { assistanceRequestId: id, ...evidence }, select: { id: true },
    });
    expect(m.auditCreate).toHaveBeenCalledWith({ data: {
      actorId: "staff-1", action: "assistance.delivery_private_evidence_uploaded",
      entityType: "AssistanceRequest", entityId: id,
      metadata: { documentId: "document-new" },
    } });
    expect(m.remove).not.toHaveBeenCalled();
  });
  it("deletes the orphan object when a definite DB failure left no document", async () => {
    m.documentCreate.mockRejectedValue(new Error("DB_UNAVAILABLE_AFTER_ROLLBACK"));
    const result = await POST(request(), params);
    expect(result.status).toBe(409);
    expect(m.remove).toHaveBeenCalledWith(evidence.objectKey, id);
  });
  it("does not delete a document when the transaction committed despite an uncertain acknowledgment", async () => {
    m.documentCreate.mockRejectedValue(new Error("ACK_LOST"));
    m.documentFind.mockResolvedValue({ id: "document-committed" });
    const result = await POST(request(), params);
    expect(result.status).toBe(201);
    expect(await result.json()).toEqual({ documentId: "document-committed" });
    expect(m.remove).not.toHaveBeenCalled();
  });
  it("preserves uncertain storage when the database cannot confirm non-persistence", async () => {
    m.documentCreate.mockRejectedValue(new Error("ACK_LOST"));
    m.documentFind.mockRejectedValue(new Error("READ_FAILED"));
    const result = await POST(request(), params);
    expect(result.status).toBe(503);
    expect(m.remove).not.toHaveBeenCalled();
    expect(m.log).toHaveBeenCalledWith("assistance.delivery_proof_commit_uncertain");
  });
});
