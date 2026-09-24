import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assistanceSafeParse: vi.fn(),
  enforceAssistanceRateLimit: vi.fn(),
  readBodyBytesWithLimit: vi.fn(),
  uploadPrivateDocument: vi.fn(),
  deletePrivateDocumentObject: vi.fn(),
  staffFindMany: vi.fn(),
  assistanceCreate: vi.fn(),
}));

vi.mock("@/lib/assistance", () => ({
  assistanceSchema: { safeParse: mocks.assistanceSafeParse },
  createReferenceNumber: () => "AST-123",
  createTrackingToken: () => "tracking-token",
  hashTrackingToken: () => "hashed-tracking-token",
}));

vi.mock("@/lib/bounded-request-body", () => {
  class RequestBodyTooLargeError extends Error {}
  return {
    RequestBodyTooLargeError,
    readBodyBytesWithLimit: mocks.readBodyBytesWithLimit,
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: mocks.staffFindMany },
    assistanceRequest: { create: mocks.assistanceCreate },
  },
}));

vi.mock("@/lib/storage", () => ({
  MAX_FILE_BYTES: 5 * 1024 * 1024,
  MAX_FILES: 5,
  uploadPrivateDocument: mocks.uploadPrivateDocument,
  deletePrivateDocumentObject: mocks.deletePrivateDocumentObject,
}));

vi.mock("@/lib/env", () => ({ validateProductionEnvironment: () => undefined }));
vi.mock("@/lib/request-security", () => ({
  isSameOrigin: () => true,
  enforceAssistanceRateLimit: mocks.enforceAssistanceRateLimit,
}));

import { POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.enforceAssistanceRateLimit.mockResolvedValue(true);
  mocks.assistanceSafeParse.mockReturnValue({
    success: true,
    data: {
      applicantName: "Acceptance Applicant",
      phone: "9000000000",
      email: "applicant@example.test",
      city: "Hyderabad",
      category: "MEDICAL",
      description: "Synthetic assistance request data used only for route acceptance coverage.",
      consent: "on",
    },
  });
  mocks.readBodyBytesWithLimit.mockImplementation(async request => new Uint8Array(await request.arrayBuffer()));
  mocks.staffFindMany.mockResolvedValue([]);
  mocks.assistanceCreate.mockResolvedValue({ id: "request_1" });
  mocks.uploadPrivateDocument.mockResolvedValue({
    objectKey: "assistance/request-test/11111111-1111-4111-8111-111111111111.pdf",
    originalName: "synthetic-evidence.pdf",
    mimeType: "application/pdf",
    sizeBytes: 32,
  });
  mocks.deletePrivateDocumentObject.mockResolvedValue(undefined);
});

describe("assistance submission request bounds", () => {
  it("rejects an oversized multipart body before parsing, storage or database work", async () => {
    mocks.enforceAssistanceRateLimit.mockResolvedValue(true);
    const { RequestBodyTooLargeError } = await import("@/lib/bounded-request-body");
    mocks.readBodyBytesWithLimit.mockRejectedValue(new RequestBodyTooLargeError(1));

    const request = new Request("https://amaana.example/api/assistance", {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data; boundary=test" },
      body: "oversized",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body.error).toMatch(/too large/i);
    expect(response.headers.get("cache-control")).toMatch(/no-store/i);
    expect(mocks.uploadPrivateDocument).not.toHaveBeenCalled();
    expect(mocks.staffFindMany).not.toHaveBeenCalled();
    expect(mocks.assistanceCreate).not.toHaveBeenCalled();
  });

  it("persists validated private evidence metadata with the assistance request", async () => {
    const data = new FormData();
    data.set("applicantName", "Acceptance Applicant");
    data.set("phone", "9000000000");
    data.set("email", "applicant@example.test");
    data.set("city", "Hyderabad");
    data.set("category", "MEDICAL");
    data.set("description", "Synthetic assistance request data used only for route acceptance coverage.");
    data.set("consent", "on");
    data.append("documents", new File(["synthetic evidence"], "synthetic-evidence.pdf", { type: "application/pdf" }));

    const response = await POST(new Request("https://amaana.example/api/assistance", {
      method: "POST",
      body: data,
    }));

    expect(response.status).toBe(201);
    expect(mocks.uploadPrivateDocument).toHaveBeenCalledTimes(1);
    expect(mocks.assistanceCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicantName: "Acceptance Applicant",
        documents: {
          create: [expect.objectContaining({
            objectKey: "assistance/request-test/11111111-1111-4111-8111-111111111111.pdf",
            originalName: "synthetic-evidence.pdf",
            mimeType: "application/pdf",
          })],
        },
      }),
    });
    expect(mocks.deletePrivateDocumentObject).not.toHaveBeenCalled();
  });

  it("compensates a stored private document when the later database write fails", async () => {
    mocks.assistanceCreate.mockRejectedValueOnce(new Error("database unavailable"));

    const data = new FormData();
    data.set("applicantName", "Acceptance Applicant");
    data.set("phone", "9000000000");
    data.set("email", "applicant@example.test");
    data.set("city", "Hyderabad");
    data.set("category", "MEDICAL");
    data.set("description", "Synthetic assistance request data used only for route acceptance coverage.");
    data.set("consent", "on");
    data.append("documents", new File(["synthetic evidence"], "synthetic-evidence.pdf", { type: "application/pdf" }));

    const response = await POST(new Request("https://amaana.example/api/assistance", {
      method: "POST",
      body: data,
    }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "We could not securely submit your request. Please try again later." });
    expect(mocks.uploadPrivateDocument).toHaveBeenCalledTimes(1);
    expect(mocks.deletePrivateDocumentObject).toHaveBeenCalledTimes(1);
    expect(mocks.deletePrivateDocumentObject).toHaveBeenCalledWith(
      "assistance/request-test/11111111-1111-4111-8111-111111111111.pdf",
      expect.any(String),
    );
    expect(response.headers.get("cache-control")).toMatch(/no-store/i);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toMatch(/noindex/i);
  });

  it("rejects a non-multipart submission before reading its body", async () => {
    mocks.enforceAssistanceRateLimit.mockResolvedValue(true);

    const request = new Request("https://amaana.example/api/assistance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(mocks.readBodyBytesWithLimit).not.toHaveBeenCalled();
  });
});
