import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assistanceSafeParse: vi.fn(),
  enforceAssistanceRateLimit: vi.fn(),
  readBodyBytesWithLimit: vi.fn(),
  uploadPrivateDocument: vi.fn(),
  deletePrivateDocumentObject: vi.fn(),
  staffFindMany: vi.fn(),
  assistanceCreate: vi.fn(),
  assistanceFindUnique: vi.fn(),
}));

vi.mock("@/lib/assistance", () => ({
  assistanceSchema: { safeParse: mocks.assistanceSafeParse },
  createReferenceNumber: () => "AST-123",
  createTrackingToken: () => "tracking-token",
  hashTrackingToken: () => "hashed-tracking-token",
}));

vi.mock("@/lib/bounded-request-body", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/bounded-request-body")>();
  return { ...actual, readBodyBytesWithLimit: mocks.readBodyBytesWithLimit };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: mocks.staffFindMany },
    assistanceRequest: { create: mocks.assistanceCreate, findUnique: mocks.assistanceFindUnique },
  },
}));

vi.mock("@/lib/storage", async importOriginal => ({
  ...(await importOriginal<typeof import("@/lib/storage")>()),
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
import { PrivateDocumentValidationError } from "@/lib/storage";

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
  mocks.assistanceFindUnique.mockResolvedValue(null);
  mocks.uploadPrivateDocument.mockResolvedValue({
    objectKey: "assistance/request-test/11111111-1111-4111-8111-111111111111.pdf",
    originalName: "synthetic-evidence.pdf",
    mimeType: "application/pdf",
    sizeBytes: 32,
  });
  mocks.deletePrivateDocumentObject.mockResolvedValue(undefined);
});

describe("assistance submission request bounds", () => {
  it("returns a private 413 without persistence when oversized stream cancellation stalls", async () => {
    const actual = await vi.importActual<typeof import("@/lib/bounded-request-body")>("@/lib/bounded-request-body");
    mocks.readBodyBytesWithLimit.mockImplementation(actual.readBodyBytesWithLimit);
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    vi.useFakeTimers();
    try {
      const request = new Request("https://amaana.example/api/assistance", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data; boundary=test" },
        body: new ReadableStream<Uint8Array>({
          start(controller) { controller.enqueue(new Uint8Array(26 * 1024 * 1024)); },
          cancel,
        }),
        duplex: "half",
      } as RequestInit & { duplex: "half" });
      const outcome = Promise.race([
        POST(request),
        new Promise<string>(resolve => setTimeout(() => resolve("rejection stalled"), 100)),
      ]);
      await vi.advanceTimersByTimeAsync(100);
      const response = await outcome;
      if (typeof response === "string") throw new Error(response);
      expect(response.status).toBe(413);
      expect(response.headers.get("cache-control")).toMatch(/no-store/i);
      expect(cancel).toHaveBeenCalledOnce();
      expect(mocks.uploadPrivateDocument).not.toHaveBeenCalled();
      expect(mocks.staffFindMany).not.toHaveBeenCalled();
      expect(mocks.assistanceCreate).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });

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
    expect(body.fields.documents).toEqual(["Upload no more than five documents of up to 5 MB each."]);
    expect(response.headers.get("cache-control")).toMatch(/no-store/i);
    expect(mocks.uploadPrivateDocument).not.toHaveBeenCalled();
    expect(mocks.staffFindMany).not.toHaveBeenCalled();
    expect(mocks.assistanceCreate).not.toHaveBeenCalled();
  });

  it.each([
    ["text masquerading as a document", "text" as const],
    ["named empty upload", "empty" as const],
  ])("rejects %s instead of accepting an unverified attachment", async (_name, kind) => {
    const data = new FormData();
    data.set("applicantName", "Acceptance Applicant");
    data.set("phone", "9000000000");
    data.set("email", "applicant@example.test");
    data.set("city", "Hyderabad");
    data.set("category", "MEDICAL");
    data.set("description", "Synthetic assistance request data used only for route acceptance coverage.");
    data.set("consent", "on");
    if (kind === "text") {
      data.append("documents", "synthetic medical report was attached");
    } else {
      data.append("documents", new File([], "medical-report.pdf", { type: "application/pdf" }));
    }

    const response = await POST(new Request("https://amaana.example/api/assistance", { method: "POST", body: data }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/document/i);
    expect(body.fields.documents).toHaveLength(1);
    expect(mocks.uploadPrivateDocument).not.toHaveBeenCalled();
    expect(mocks.staffFindMany).not.toHaveBeenCalled();
    expect(mocks.assistanceCreate).not.toHaveBeenCalled();
  });

  it("still accepts a request with no optional attachments", async () => {
    const data = new FormData();
    data.set("applicantName", "Acceptance Applicant");
    data.set("phone", "9000000000");
    data.set("email", "applicant@example.test");
    data.set("city", "Hyderabad");
    data.set("category", "MEDICAL");
    data.set("description", "Synthetic assistance request data used only for route acceptance coverage.");
    data.set("consent", "on");

    const response = await POST(new Request("https://amaana.example/api/assistance", { method: "POST", body: data }));
    expect(response.status).toBe(201);
    expect(mocks.uploadPrivateDocument).not.toHaveBeenCalled();
    expect(mocks.assistanceCreate).toHaveBeenCalledOnce();
  });

  it("returns a linked document rejection and cleans earlier uploads when a later file is invalid", async () => {
    mocks.uploadPrivateDocument.mockResolvedValueOnce({
      objectKey: "assistance/request-test/11111111-1111-4111-8111-111111111111.pdf",
      originalName: "valid.pdf", mimeType: "application/pdf", sizeBytes: 20,
    }).mockRejectedValueOnce(new PrivateDocumentValidationError("The uploaded document does not match its declared file type"));
    const form = new FormData();
    form.append("documents", new File(["synthetic valid file"], "valid.pdf", { type: "application/pdf" }));
    form.append("documents", new File(["invalid signature"], "invalid.pdf", { type: "application/pdf" }));
    const response = await POST(new Request("https://amaana.example/api/assistance", { method: "POST", body: form }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Please check the supporting documents.", fields: { documents: ["The uploaded document does not match its declared file type"] } });
    expect(response.headers.get("cache-control")).toMatch(/no-store/i);
    expect(mocks.deletePrivateDocumentObject).toHaveBeenCalledOnce();
    expect(mocks.assistanceCreate).not.toHaveBeenCalled();
    expect(mocks.assistanceFindUnique).not.toHaveBeenCalled();
    expect(mocks.staffFindMany).not.toHaveBeenCalled();
  });

  it("keeps failed private-upload cleanup uncertain instead of allowing another submission", async () => {
    mocks.uploadPrivateDocument.mockResolvedValueOnce({
      objectKey: "assistance/request-test/11111111-1111-4111-8111-111111111111.pdf",
      originalName: "valid.pdf", mimeType: "application/pdf", sizeBytes: 20,
    }).mockRejectedValueOnce(new PrivateDocumentValidationError("The uploaded document does not match its declared file type"));
    mocks.deletePrivateDocumentObject.mockRejectedValueOnce(new Error("synthetic private cleanup failure"));
    const form = new FormData();
    form.append("documents", new File(["synthetic valid file"], "valid.pdf", { type: "application/pdf" }));
    form.append("documents", new File(["invalid signature"], "invalid.pdf", { type: "application/pdf" }));
    const response = await POST(new Request("https://amaana.example/api/assistance", { method: "POST", body: form }));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "We could not confirm whether your request was recorded. Contact Amaana before submitting again.", submissionUncertain: true,
    });
    expect(response.headers.get("cache-control")).toMatch(/no-store/i);
    expect(response.headers.get("x-robots-tag")).toMatch(/noindex/i);
    expect(mocks.deletePrivateDocumentObject).toHaveBeenCalledOnce();
    expect(mocks.assistanceCreate).not.toHaveBeenCalled();
    expect(mocks.assistanceFindUnique).not.toHaveBeenCalled();
    expect(mocks.staffFindMany).not.toHaveBeenCalled();
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

  it("returns the saved tracking credentials when a committed case loses its create acknowledgement", async () => {
    mocks.assistanceCreate.mockRejectedValueOnce(new Error("connection dropped after commit"));
    mocks.assistanceFindUnique.mockResolvedValueOnce({ id: "saved_request" });
    const form = new FormData();
    for (const [key, value] of Object.entries({
      applicantName: "Acceptance Applicant",
      phone: "9000000000",
      email: "applicant@example.test",
      city: "Hyderabad",
      category: "MEDICAL",
      description: "Synthetic assistance request data used only for route acceptance coverage.",
      consent: "on",
    })) form.set(key, value);
    form.append("documents", new File(["synthetic evidence"], "synthetic-evidence.pdf", { type: "application/pdf" }));

    const response = await POST(new Request("https://amaana.example/api/assistance", { method: "POST", body: form }));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ referenceNumber: "AST-123", trackingToken: "tracking-token" });
    expect(mocks.assistanceFindUnique).toHaveBeenCalledWith({
      where: { id: expect.any(String) },
      select: { id: true },
    });
    expect(mocks.deletePrivateDocumentObject).not.toHaveBeenCalled();
  });

  it("preserves documents when database failure prevents checking whether the case persisted", async () => {
    mocks.assistanceCreate.mockRejectedValueOnce(new Error("commit acknowledgement lost"));
    mocks.assistanceFindUnique.mockRejectedValueOnce(new Error("database unavailable"));
    const form = new FormData();
    for (const [key, value] of Object.entries({
      applicantName: "Acceptance Applicant",
      phone: "9000000000",
      email: "applicant@example.test",
      city: "Hyderabad",
      category: "MEDICAL",
      description: "Synthetic assistance request data used only for route acceptance coverage.",
      consent: "on",
    })) form.set(key, value);
    form.append("documents", new File(["synthetic evidence"], "synthetic-evidence.pdf", { type: "application/pdf" }));

    const response = await POST(new Request("https://amaana.example/api/assistance", { method: "POST", body: form }));

    expect(response.status).toBe(500);
    expect(mocks.assistanceFindUnique).toHaveBeenCalledOnce();
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
    expect(body).toEqual({ error: "We could not confirm whether your request was recorded. Contact Amaana before submitting again.", submissionUncertain: true });
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
