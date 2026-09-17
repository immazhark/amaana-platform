import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enforceAssistanceRateLimit: vi.fn(),
  readBodyBytesWithLimit: vi.fn(),
  uploadPrivateDocument: vi.fn(),
  deletePrivateDocumentObject: vi.fn(),
  staffFindMany: vi.fn(),
  assistanceCreate: vi.fn(),
}));

vi.mock("@/lib/assistance", () => ({
  assistanceSchema: { safeParse: vi.fn() },
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
