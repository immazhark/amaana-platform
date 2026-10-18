import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enforceDonationRateLimit: vi.fn(),
  safeParse: vi.fn(),
  findFirst: vi.fn(),
  donationCreate: vi.fn(),
  donationFindUnique: vi.fn(),
  donationUpdate: vi.fn(),
  donationDeleteMany: vi.fn(),
  uploadDonationEvidence: vi.fn(),
  deleteDonationEvidenceObject: vi.fn(),
  isDonationAmountAllowedForRemaining: vi.fn(),
}));

vi.mock("@/lib/bounded-request-body", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/bounded-request-body")>();
  return actual;
});

vi.mock("@/lib/donations", () => ({
  createDonationReference: () => "AFD-2026-12345678",
  createReceiptToken: () => "receipt-token",
  directTransferSchema: { safeParse: mocks.safeParse },
  hashReceiptToken: () => "hashed-token",
  isDonationAmountAllowedForRemaining: mocks.isDonationAmountAllowedForRemaining,
  MIN_DONATION_AMOUNT: 10,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    appeal: { findFirst: mocks.findFirst },
    donation: {
      create: mocks.donationCreate,
      findUnique: mocks.donationFindUnique,
      update: mocks.donationUpdate,
      deleteMany: mocks.donationDeleteMany,
    },
  },
}));

vi.mock("@/lib/request-security", () => ({
  isSameOrigin: () => true,
  enforceDonationRateLimit: mocks.enforceDonationRateLimit,
}));

vi.mock("@/lib/storage", () => ({
  MAX_FILE_BYTES: 5 * 1024 * 1024,
  uploadDonationEvidence: mocks.uploadDonationEvidence,
  deleteDonationEvidenceObject: mocks.deleteDonationEvidenceObject,
}));

vi.mock("@/lib/env", () => ({ validateProductionEnvironment: () => undefined }));
vi.mock("@/lib/public-environment", () => ({ canExposePublicAppeal: () => true }));

import { POST } from "./route";

const validData = {
  appealId: "clx1234567890abcdef123456",
  donorName: "Test Donor",
  donorEmail: "donor@example.com",
  donorPhone: "",
  amount: 500,
  givingIntent: "GENERAL",
  isAnonymous: false,
  domesticConfirmed: true,
  paymentMethod: "DIRECT_UPI",
  transferReference: "UTR123456789",
  transferredAt: new Date("2026-09-30T05:00:00.000Z"),
};

function syntheticPng(content: string): File {
  return new File([
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).buffer,
    content,
  ], "transfer.png", { type: "image/png" });
}

function requestWith(file?: File) {
  const form = new FormData();
  form.set("appealId", validData.appealId);
  form.set("donorName", validData.donorName);
  form.set("donorEmail", validData.donorEmail);
  form.set("amount", String(validData.amount));
  form.set("givingIntent", validData.givingIntent);
  form.set("paymentMethod", validData.paymentMethod);
  form.set("transferReference", validData.transferReference);
  form.set("transferredAt", "2026-09-30T05:00:00.000Z");
  form.set("domesticConfirmed", "true");
  if (file) form.set("evidence", file);
  return new Request("https://amaana.example/api/donations/direct-transfer", { method: "POST", body: form });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.enforceDonationRateLimit.mockResolvedValue(true);
  mocks.safeParse.mockReturnValue({ success: true, data: validData });
  mocks.findFirst.mockResolvedValue({
    id: "appeal-1",
    slug: "appeal-1",
    title: "Appeal 1",
    status: "PUBLISHED",
    goalAmount: 1000,
    amountRaised: 100,
    closesAt: null,
    assistanceRequest: { verification: { zakatStatus: "NOT_ELIGIBLE" } },
  });
  mocks.isDonationAmountAllowedForRemaining.mockReturnValue(true);
  mocks.donationCreate.mockResolvedValue({ id: "donation-1", referenceNumber: "AFD-2026-12345678" });
  mocks.donationFindUnique.mockResolvedValue(null);
  mocks.donationUpdate.mockResolvedValue({});
  mocks.donationDeleteMany.mockResolvedValue({ count: 1 });
  mocks.deleteDonationEvidenceObject.mockResolvedValue(undefined);
});

describe("direct donation transfer submission", () => {
  it("returns a private 413 without creating a claim when oversized stream cancellation stalls", async () => {
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    vi.useFakeTimers();
    try {
      const request = new Request("https://amaana.example/api/donations/direct-transfer", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data; boundary=test" },
        body: new ReadableStream<Uint8Array>({
          start(controller) { controller.enqueue(new Uint8Array(6 * 1024 * 1024)); },
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
      expect(mocks.findFirst).not.toHaveBeenCalled();
      expect(mocks.donationCreate).not.toHaveBeenCalled();
      expect(mocks.uploadDonationEvidence).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });

  it("times out a stalled multipart upload without waiting for hostile cancellation", async () => {
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    vi.useFakeTimers();
    try {
      const request = new Request("https://amaana.example/api/donations/direct-transfer", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data; boundary=synthetic" },
        body: new ReadableStream<Uint8Array>({ cancel }),
        duplex: "half",
      } as RequestInit & { duplex: "half" });
      let response: Response | undefined;
      void POST(request).then(value => { response = value; });
      await vi.advanceTimersByTimeAsync(119_999);
      expect(response).toBeUndefined();
      await vi.advanceTimersByTimeAsync(1);
      expect(response?.status).toBe(503);
      expect(await response?.json()).toEqual({ error: "Transfer upload timed out. Please try again." });
      expect(response?.headers.get("retry-after")).toBe("60");
      expect(response?.headers.get("cache-control")).toMatch(/no-store.*private/i);
      expect(response?.headers.get("referrer-policy")).toBe("no-referrer");
      expect(response?.headers.get("x-robots-tag")).toMatch(/noindex/i);
      expect(cancel).toHaveBeenCalledOnce();
      expect(mocks.findFirst).not.toHaveBeenCalled();
      expect(mocks.donationCreate).not.toHaveBeenCalled();
      expect(mocks.uploadDonationEvidence).not.toHaveBeenCalled();
      expect(mocks.donationDeleteMany).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });

  it("enforces the absolute multipart deadline even while small chunks keep arriving", async () => {
    vi.useFakeTimers();
    try {
      let controller!: ReadableStreamDefaultController<Uint8Array>;
      const request = new Request("https://amaana.example/api/donations/direct-transfer", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data; boundary=synthetic" },
        body: new ReadableStream<Uint8Array>({
          start(stream) { controller = stream; },
        }),
        duplex: "half",
      } as RequestInit & { duplex: "half" });
      let response: Response | undefined;
      void POST(request).then(value => { response = value; });
      await vi.advanceTimersByTimeAsync(60_000);
      controller.enqueue(new Uint8Array([65]));
      await vi.advanceTimersByTimeAsync(60_000);
      expect(response?.status).toBe(503);
      expect(mocks.findFirst).not.toHaveBeenCalled();
      expect(mocks.donationCreate).not.toHaveBeenCalled();
      expect(mocks.uploadDonationEvidence).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });

  it("rejects oversized multipart submissions before form parsing or database work", async () => {
    const response = await POST(new Request("https://amaana.example/api/donations/direct-transfer", {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data; boundary=test",
        "Content-Length": String(5 * 1024 * 1024 + 256 * 1024 + 1),
      },
      body: "--test--\r\n",
    }));
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body.error).toMatch(/too large/i);
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });

  it("rejects non-multipart direct-transfer submissions before parsing", async () => {
    const response = await POST(new Request("https://amaana.example/api/donations/direct-transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }));

    expect(response.status).toBe(400);
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });

  it("rejects an explicitly named zero-byte transfer receipt before creating a claim", async () => {
    const form = new FormData();
    form.set("appealId", validData.appealId);
    form.set("donorName", validData.donorName);
    form.set("donorEmail", validData.donorEmail);
    form.set("amount", String(validData.amount));
    form.set("givingIntent", validData.givingIntent);
    form.set("paymentMethod", validData.paymentMethod);
    form.set("transferReference", validData.transferReference);
    form.set("transferredAt", "2026-09-30T05:00:00.000Z");
    form.set("domesticConfirmed", "true");
    form.set("evidence", new File([], "transfer-receipt.pdf", { type: "application/pdf" }));

    const response = await POST(new Request("https://amaana.example/api/donations/direct-transfer", { method: "POST", body: form }));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/evidence is empty/i);
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.donationCreate).not.toHaveBeenCalled();
    expect(mocks.uploadDonationEvidence).not.toHaveBeenCalled();
  });

  it.each([
    ["forbidden text attachment", "text/plain", "fake PDF", "receipt.txt"],
    ["spoofed PNG", "image/png", "plain-text-without-signature", "receipt.png"],
    ["spoofed PDF", "application/pdf", "this-is-not-a-pdf", "receipt.pdf"],
  ])("rejects %s before creating a financial claim", async (_case, mime, content, filename) => {
    const response = await POST(requestWith(new File([content], filename, { type: mime })));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/valid PDF|JPEG|PNG|WebP/i);
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.donationCreate).not.toHaveBeenCalled();
    expect(mocks.uploadDonationEvidence).not.toHaveBeenCalled();
    expect(mocks.donationDeleteMany).not.toHaveBeenCalled();
  });

  it("treats an empty optional evidence file as no evidence", async () => {
    const form = new FormData();
    form.set("appealId", validData.appealId);
    form.set("donorName", validData.donorName);
    form.set("donorEmail", validData.donorEmail);
    form.set("amount", String(validData.amount));
    form.set("givingIntent", validData.givingIntent);
    form.set("paymentMethod", validData.paymentMethod);
    form.set("transferReference", validData.transferReference);
    form.set("transferredAt", "2026-09-30T05:00:00.000Z");
    form.set("domesticConfirmed", "true");
    form.set("evidence", new File([], "", { type: "application/octet-stream" }));

    const response = await POST(new Request("https://amaana.example/api/donations/direct-transfer", { method: "POST", body: form }));

    expect(response.status).toBe(202);
    expect(mocks.uploadDonationEvidence).not.toHaveBeenCalled();
    expect(mocks.donationUpdate).not.toHaveBeenCalled();
  });

  it("creates an explicitly pending direct-transfer claim without counting it as received", async () => {
    const response = await POST(requestWith());
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toEqual({
      referenceNumber: "AFD-2026-12345678",
      receiptToken: "receipt-token",
      status: "PENDING_VERIFICATION",
    });
    expect(mocks.donationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: "PENDING_VERIFICATION",
        paymentMethod: "DIRECT_UPI",
        provider: null,
        providerOrderId: null,
        transferReference: "UTR123456789",
      }),
      select: { id: true, referenceNumber: true },
    });
    expect(mocks.donationUpdate).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
  });

  it("recovers the original receipt credentials when claim creation committed without acknowledgement", async () => {
    mocks.donationCreate.mockRejectedValueOnce(new Error("commit acknowledgement lost"));
    mocks.donationFindUnique.mockImplementationOnce(async ({ where }) => ({ id: where.id, referenceNumber: "AFD-2026-12345678", receiptTokenHash: "hashed-token" }));
    const file = syntheticPng("synthetic evidence");
    mocks.uploadDonationEvidence.mockResolvedValueOnce({ objectKey: "private-key", originalName: "transfer.png", mimeType: "image/png", sizeBytes: file.size });

    const response = await POST(requestWith(file));

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ referenceNumber: "AFD-2026-12345678", receiptToken: "receipt-token", status: "PENDING_VERIFICATION" });
    const createCall = mocks.donationCreate.mock.calls[0];
    const uploadCall = mocks.uploadDonationEvidence.mock.calls[0];
    if (!createCall || !uploadCall) throw new Error("Expected recovered claim and evidence upload");
    const id = createCall[0].data.id;
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(mocks.donationFindUnique).toHaveBeenCalledWith({ where: { id }, select: { id: true, referenceNumber: true, receiptTokenHash: true } });
    expect(mocks.uploadDonationEvidence).toHaveBeenCalledWith(expect.objectContaining({ name: file.name, size: file.size, type: file.type }), id);
    expect(await uploadCall[0].text()).toContain("synthetic evidence");
    expect(mocks.donationUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id } }));
    expect(mocks.donationDeleteMany).not.toHaveBeenCalled();
  });


  it("returns a reconciliation-safe private response when persistence outcome is unknown", async () => {
    mocks.donationCreate.mockRejectedValueOnce(new Error("synthetic connection lost after commit"));
    mocks.donationFindUnique.mockRejectedValueOnce(new Error("database read unavailable"));
    const response = await POST(requestWith());
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(response.headers.get("retry-after")).toBeNull();
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toMatch(/noindex.*nofollow/i);
    const result = await response.json();
    expect(result).toEqual({
      error: "Transfer reporting status is uncertain. Your reference may have been recorded. Do not submit the same UTR again; contact Amaana for reconciliation.",
    });
    expect(result).not.toHaveProperty("receiptToken");
    expect(mocks.uploadDonationEvidence).not.toHaveBeenCalled();
    expect(mocks.donationDeleteMany).not.toHaveBeenCalled();
  });

  it("does not suggest retrying a transfer whose evidence metadata might already have been written", async () => {
    const file = syntheticPng("synthetic evidence");
    mocks.uploadDonationEvidence.mockResolvedValueOnce({
      objectKey: "private-key", originalName: "transfer.png", mimeType: "image/png", sizeBytes: file.size,
    });
    mocks.donationUpdate.mockRejectedValueOnce(new Error("synthetic update acknowledgement lost"));
    // If we cannot prove the draft was removed, we must not delete evidence.
    mocks.donationDeleteMany.mockResolvedValueOnce({ count: 0 });
    const response = await POST(requestWith(file));
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBeNull();
    expect((await response.json()).error).toMatch(/Do not submit the same UTR again/i);
    expect(mocks.deleteDonationEvidenceObject).not.toHaveBeenCalled();
  });

  it.each(["missing", "unavailable"])("fails safely when the create outcome is %s", async outcome => {
    mocks.donationCreate.mockRejectedValueOnce(new Error("connection dropped"));
    if (outcome === "unavailable") mocks.donationFindUnique.mockRejectedValueOnce(new Error("database unavailable"));

    const response = await POST(requestWith());

    expect(response.status).toBe(500);
    expect(await response.json()).not.toHaveProperty("receiptToken");
    expect(mocks.donationFindUnique).toHaveBeenCalledOnce();
    expect(mocks.uploadDonationEvidence).not.toHaveBeenCalled();
    expect(mocks.donationDeleteMany).not.toHaveBeenCalled();
  });

  it("does not recover credentials from a record with a different receipt token hash", async () => {
    mocks.donationCreate.mockRejectedValueOnce(new Error("commit acknowledgement lost"));
    mocks.donationFindUnique.mockResolvedValueOnce({ id: "other-record", referenceNumber: "other-reference", receiptTokenHash: "other-token" });

    const response = await POST(requestWith());

    expect(response.status).toBe(500);
    expect(await response.json()).not.toHaveProperty("receiptToken");
    expect(mocks.uploadDonationEvidence).not.toHaveBeenCalled();
    expect(mocks.donationDeleteMany).not.toHaveBeenCalled();
  });

  it("rejects another claim's duplicate transfer reference without credential recovery", async () => {
    mocks.donationCreate.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("duplicate", { code: "P2002", clientVersion: "test", meta: { target: ["transferReference"] } }));

    const response = await POST(requestWith());

    expect(response.status).toBe(409);
    expect(await response.json()).not.toHaveProperty("receiptToken");
    expect(mocks.donationFindUnique).not.toHaveBeenCalled();
    expect(mocks.uploadDonationEvidence).not.toHaveBeenCalled();
  });

  it.each([
    ["sub-paise raised balance", 100.001, 1000],
    ["sub-paise target balance", 100, 1000.001],
    ["unpayable last fraction", 999.5, 1000],
    ["negative raised balance", -1, 1000],
  ])("rejects %s without writing or reserving a transfer reference", async (_case, amountRaised, goalAmount) => {
    mocks.findFirst.mockResolvedValue({
      id: "appeal-1", slug: "appeal-1", title: "Appeal 1",
      status: "PUBLISHED", amountRaised, goalAmount, closesAt: null,
      assistanceRequest: { verification: { zakatStatus: "NOT_ELIGIBLE" } },
    });
    const response = await POST(requestWith(syntheticPng("synthetic balance guard proof")));
    expect(response.status).toBe(409);
    expect(response.headers.get("cache-control")).toMatch(/private/i);
    expect(mocks.donationCreate).not.toHaveBeenCalled();
    expect(mocks.uploadDonationEvidence).not.toHaveBeenCalled();
    expect(mocks.donationDeleteMany).not.toHaveBeenCalled();
  });

  it("rejects Zakat intent unless the appeal has explicit eligibility", async () => {
    mocks.safeParse.mockReturnValue({ success: true, data: { ...validData, givingIntent: "ZAKAT" } });

    const response = await POST(requestWith());
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toMatch(/not currently marked as Zakat-eligible/i);
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });

  it("preserves a transfer and its private evidence if another worker updated the donation before cleanup", async () => {
    const file = syntheticPng("synthetic transfer evidence");
    mocks.uploadDonationEvidence.mockResolvedValue({
      objectKey: "donations/donation-1/11111111-1111-4111-8111-111111111111.png",
      originalName: "transfer.png",
      mimeType: "image/png",
      sizeBytes: file.size,
    });
    mocks.donationUpdate.mockRejectedValueOnce(new Error("commit acknowledgement lost"));
    // A zero-row conditional delete means the payment state or evidence key changed.
    mocks.donationDeleteMany.mockResolvedValueOnce({ count: 0 });

    const response = await POST(requestWith(file));

    expect(response.status).toBe(500);
    expect(mocks.donationDeleteMany).toHaveBeenCalledWith({
      where: { id: "donation-1", status: "PENDING_VERIFICATION", transferEvidenceKey: null },
    });
    expect(mocks.deleteDonationEvidenceObject).not.toHaveBeenCalled();
  });

  it("preserves evidence on an uncertain cleanup database failure", async () => {
    const file = syntheticPng("synthetic transfer evidence");
    mocks.uploadDonationEvidence.mockResolvedValue({
      objectKey: "donations/donation-1/11111111-1111-4111-8111-111111111111.png",
      originalName: "transfer.png",
      mimeType: "image/png",
      sizeBytes: file.size,
    });
    mocks.donationUpdate.mockRejectedValueOnce(new Error("database unavailable"));
    mocks.donationDeleteMany.mockRejectedValueOnce(new Error("database unavailable"));

    const response = await POST(requestWith(file));

    expect(response.status).toBe(500);
    expect(mocks.deleteDonationEvidenceObject).not.toHaveBeenCalled();
  });

  it("removes uploaded evidence and the draft claim if evidence metadata persistence fails", async () => {
    const file = syntheticPng("synthetic transfer evidence");
    mocks.uploadDonationEvidence.mockResolvedValue({
      objectKey: "donations/donation-1/11111111-1111-4111-8111-111111111111.png",
      originalName: "transfer.png",
      mimeType: "image/png",
      sizeBytes: file.size,
    });
    mocks.donationUpdate.mockRejectedValueOnce(new Error("database unavailable"));

    const response = await POST(requestWith(file));

    expect(response.status).toBe(500);
    expect(mocks.uploadDonationEvidence).toHaveBeenCalledTimes(1);
    expect(mocks.deleteDonationEvidenceObject).toHaveBeenCalledWith(
      "donations/donation-1/11111111-1111-4111-8111-111111111111.png",
      "donation-1",
    );
    expect(mocks.donationDeleteMany).toHaveBeenCalledWith({ where: { id: "donation-1", status: "PENDING_VERIFICATION", transferEvidenceKey: null } });
  });
});


describe("direct-transfer anonymity field privacy contract", () => {
  async function withAnonymityValues(values: FormDataEntryValue[]) {
    const original = requestWith();
    const form = await original.formData();
    for (const value of values) form.append("isAnonymous", value);
    return new Request(original.url, { method: "POST", body: form });
  }

  it.each([
    ["missing", [], false],
    ["explicitly anonymous", ["true"], true],
    ["explicitly named", ["false"], false],
  ] as const)("keeps %s as an unambiguous donor choice", async (_case, values, expected) => {
    mocks.safeParse.mockImplementationOnce(input => ({
      success: true,
      data: { ...validData, isAnonymous: input.isAnonymous },
    }));

    const response = await POST(await withAnonymityValues([...values]));

    expect(response.status).toBe(202);
    expect(mocks.safeParse).toHaveBeenCalledWith(expect.objectContaining({ isAnonymous: expected }));
    expect(mocks.donationCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ isAnonymous: expected }),
    }));
  });

  it.each([
    ["empty", [""]],
    ["mixed case", ["TRUE"]],
    ["checkbox-style on", ["on"]],
    ["space padded", [" false "]],
    ["unexpected number", ["1"]],
    ["ambiguous true then false", ["true", "false"]],
    ["ambiguous false then true", ["false", "true"]],
    ["repeated true", ["true", "true"]],
    ["repeated false", ["false", "false"]],
    ["file instead of scalar", [new File(["true"], "anonymity.txt", { type: "text/plain" })]],
  ] as const)("rejects %s instead of changing the donor's privacy choice", async (_case, values) => {
    const response = await POST(await withAnonymityValues([...values]));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/anonymous|privacy|choice/i);
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(mocks.safeParse).not.toHaveBeenCalled();
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.donationCreate).not.toHaveBeenCalled();
    expect(mocks.uploadDonationEvidence).not.toHaveBeenCalled();
  });
});


describe("direct-transfer domestic confirmation is unambiguous", () => {
  async function domesticRequest(values: FormDataEntryValue[]) {
    const source = requestWith();
    const form = await source.formData();
    form.delete("domesticConfirmed");
    for (const value of values) form.append("domesticConfirmed", value);
    return new Request(source.url, { method: "POST", body: form });
  }

  it("accepts a single explicit domestic confirmation without changing persisted consent", async () => {
    const response = await POST(await domesticRequest(["true"]));
    expect(response.status).toBe(202);
    expect(mocks.safeParse).toHaveBeenCalledWith(expect.objectContaining({ domesticConfirmed: true }));
    expect(mocks.donationCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ domesticConfirmedAt: expect.any(Date) }),
    }));
  });

  it.each([
    ["missing", []],
    ["unchecked", ["false"]],
    ["empty", [""]],
    ["noncanonical", ["TRUE"]],
    ["checkbox on", ["on"]],
    ["conflicting true/false", ["true", "false"]],
    ["conflicting false/true", ["false", "true"]],
    ["repeated true", ["true", "true"]],
    ["file value", [new File(["true"], "consent.txt", { type: "text/plain" })]],
  ] as const)("rejects %s without treating ambiguous consent as confirmed", async (_case, values) => {
    const response = await POST(await domesticRequest([...values]));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/domestic|confirm/i);
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(mocks.safeParse).not.toHaveBeenCalled();
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.donationCreate).not.toHaveBeenCalled();
    expect(mocks.uploadDonationEvidence).not.toHaveBeenCalled();
  });
});


describe("direct-transfer multipart field ambiguity", () => {
  async function formForTest() {
    const original = requestWith();
    return { url: original.url, form: await original.formData() };
  }

  it.each([
    "appealId", "donorName", "donorEmail", "donorPhone", "amount",
    "givingIntent", "paymentMethod", "transferReference", "transferredAt",
  ] as const)("rejects duplicate financial field %s before persistence", async field => {
    const { url, form } = await formForTest();
    if (field === "donorPhone") form.set("donorPhone", "");
    form.append(field, "conflicting-value");
    const response = await POST(new Request(url, { method: "POST", body: form }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/duplicate|repeated|field/i);
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(mocks.safeParse).not.toHaveBeenCalled();
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.donationCreate).not.toHaveBeenCalled();
    expect(mocks.uploadDonationEvidence).not.toHaveBeenCalled();
  });

  it("rejects an identical repeated transfer reference instead of accepting the first", async () => {
    const { url, form } = await formForTest();
    form.append("transferReference", validData.transferReference);
    const response = await POST(new Request(url, { method: "POST", body: form }));
    expect(response.status).toBe(400);
    expect(mocks.safeParse).not.toHaveBeenCalled();
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });

  it("rejects multiple evidence files, including when both have valid signatures", async () => {
    const { url, form } = await formForTest();
    form.append("evidence", syntheticPng("first synthetic transfer"));
    form.append("evidence", syntheticPng("second synthetic transfer"));
    const response = await POST(new Request(url, { method: "POST", body: form }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/duplicate|repeated|field/i);
    expect(mocks.safeParse).not.toHaveBeenCalled();
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.donationCreate).not.toHaveBeenCalled();
    expect(mocks.uploadDonationEvidence).not.toHaveBeenCalled();
  });
});
