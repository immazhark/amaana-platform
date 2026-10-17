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
  it("returns a retryable private response when an assistance upload exceeds its absolute deadline", async () => {
    const { RequestBodyReadTimeoutError } = await import("@/lib/bounded-request-body");
    mocks.readBodyBytesWithLimit.mockRejectedValueOnce(new RequestBodyReadTimeoutError());
    const request = new Request("https://amaana.example/api/assistance", {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data; boundary=synthetic" },
      body: "synthetic upload",
    });

    const response = await POST(request);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "The assistance upload timed out. Please try again." });
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(mocks.assistanceSafeParse).not.toHaveBeenCalled();
    expect(mocks.uploadPrivateDocument).not.toHaveBeenCalled();
    expect(mocks.staffFindMany).not.toHaveBeenCalled();
    expect(mocks.assistanceCreate).not.toHaveBeenCalled();
  });

  it("returns retryable 503 for interrupted multipart transport, not malformed applicant information", async () => {
    const request = new Request("https://amaana.example/api/assistance", {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data; boundary=synthetic" },
      body: new ReadableStream<Uint8Array>({
        start(controller) { controller.error(new Error("synthetic network interruption")); },
      }),
      duplex: "half",
    } as RequestInit & { duplex: "half" });
    const response = await POST(request);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "The assistance upload could not be read. Please try again." });
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(mocks.uploadPrivateDocument).not.toHaveBeenCalled();
    expect(mocks.staffFindMany).not.toHaveBeenCalled();
    expect(mocks.assistanceCreate).not.toHaveBeenCalled();
  });

  it("enforces one absolute upload deadline even while body chunks keep arriving", async () => {
    const actual = await vi.importActual<typeof import("@/lib/bounded-request-body")>("@/lib/bounded-request-body");
    mocks.readBodyBytesWithLimit.mockImplementation(actual.readBodyBytesWithLimit);
    vi.useFakeTimers();
    try {
      let controller!: ReadableStreamDefaultController<Uint8Array>;
      const request = new Request("https://amaana.example/api/assistance", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data; boundary=synthetic" },
        body: new ReadableStream<Uint8Array>({
          start(streamController) { controller = streamController; },
          cancel() { return new Promise<void>(() => {}); },
        }),
        duplex: "half",
      } as RequestInit & { duplex: "half" });

      const result = Promise.race([
        POST(request),
        new Promise<"stalled">(resolve => setTimeout(() => resolve("stalled"), 120_001)),
      ]);
      await vi.advanceTimersByTimeAsync(0);
      for (let index = 0; index < 3; index++) {
        await vi.advanceTimersByTimeAsync(30_000);
        controller.enqueue(new Uint8Array([65]));
      }
      await vi.advanceTimersByTimeAsync(30_001);
      const outcome = await result;
      if (outcome === "stalled") throw new Error("Assistance upload had no absolute deadline");
      expect(outcome.status).toBe(503);
      expect(outcome.headers.get("retry-after")).toBe("60");
      expect(mocks.uploadPrivateDocument).not.toHaveBeenCalled();
      expect(mocks.assistanceCreate).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

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
    expect((await response.json()).error).toMatch(/document/i);
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
