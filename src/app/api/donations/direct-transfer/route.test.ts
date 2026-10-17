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

vi.mock("@/lib/donations", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/donations")>(),
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

describe("transfer feedback preserves financial and privacy boundaries", () => {
  it("returns actual schema field errors without hidden identifiers or persistence", async () => {
    const actual = await vi.importActual<typeof import("@/lib/donations")>("@/lib/donations");
    mocks.safeParse.mockImplementation(actual.directTransferSchema.safeParse.bind(actual.directTransferSchema));
    const form = new FormData();
    form.set("appealId", "invalid-hidden-id");
    form.set("donorName", "A");
    form.set("donorEmail", "invalid-email");
    form.set("amount", "1e3");
    form.set("givingIntent", "GENERAL");
    form.set("paymentMethod", "DIRECT_UPI");
    form.set("transferReference", "bad reference");
    form.set("transferredAt", "2026-09-30T10:30");
    form.set("domesticConfirmed", "false");
    const response = await POST(new Request("https://amaana.example/api/donations/direct-transfer", { method: "POST", body: form }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(Object.keys(body.fieldErrors).sort()).toEqual(["amount", "domesticConfirmed", "donorEmail", "donorName", "transferReference", "transferredAt"].sort());
    expect(JSON.stringify(body)).not.toContain("invalid-hidden-id");
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.donationCreate).not.toHaveBeenCalled();
    expect(mocks.uploadDonationEvidence).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it.each([null, "true", "false"])("preserves valid anonymity choice %s", async value => {
    const original = requestWith();
    const form = await original.formData();
    if (value !== null) form.set("isAnonymous", value);
    const response = await POST(new Request(original.url, { method: "POST", body: form }));
    expect(response.status).toBe(202);
    expect(mocks.safeParse).toHaveBeenCalledWith(expect.objectContaining({ isAnonymous: value === "true" }));
  });

  it.each(["TRUE", "on", "", "false ", new File(["true"], "privacy.txt")])(
    "rejects malformed anonymity choice %s before persistence",
    async value => {
      const original = requestWith();
      const form = await original.formData();
      form.set("isAnonymous", value);
      const response = await POST(new Request(original.url, { method: "POST", body: form }));
      expect(response.status).toBe(400);
      expect(response.headers.get("cache-control")).toContain("no-store");
      expect(mocks.safeParse).not.toHaveBeenCalled();
      expect(mocks.findFirst).not.toHaveBeenCalled();
      expect(mocks.donationCreate).not.toHaveBeenCalled();
      expect(mocks.uploadDonationEvidence).not.toHaveBeenCalled();
    },
  );

  it("marks an unrecovered database outcome as uncertain without retry advice or credentials", async () => {
    mocks.donationCreate.mockRejectedValue(new Error("private database diagnostic"));
    mocks.donationFindUnique.mockResolvedValue(null);
    const response = await POST(requestWith());
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.submissionUncertain).toBe(true);
    expect(body.error).toMatch(/contact Amaana before submitting again/);
    expect(body.error).not.toMatch(/Please try again|private database diagnostic/);
    expect(body.receiptToken).toBeUndefined();
    expect(mocks.donationDeleteMany).not.toHaveBeenCalled();
  });
});

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
  // Recognizable PNG magic bytes, enough to exercise the pre-write header
  // verification while the private object store remains stubbed.
  const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return new File([signature.buffer, content], "transfer.png", { type: "image/png" });
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

describe("direct transfer body read deadline", () => {
  it("rejects a stalled multipart request before appeal, evidence storage or donation creation", async () => {
    vi.useFakeTimers();
    try {
      const cancel = vi.fn(() => Promise.resolve());
      const stream = new ReadableStream<Uint8Array>({ cancel });
      const request = new Request("https://amaana.example/api/donations/direct-transfer", {
        method: "POST",
        headers: { "content-type": "multipart/form-data; boundary=test-boundary" },
        body: stream,
        duplex: "half",
      } as RequestInit & { duplex: "half" });
      const pending = POST(request);
      // Allow the resolved anti-abuse budget to complete before advancing the
      // request-body timer; no transfer form or private record should be parsed.
      await vi.advanceTimersByTimeAsync(90_100);
      const response = await pending;
      expect(response.status).toBe(408);
      expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
      expect(await response.json()).toEqual({
        error: "Transfer upload took too long. No submission was recorded. Check your connection and submit the same bank reference again.",
        submissionUncertain: false,
      });
      expect(cancel).toHaveBeenCalledOnce();
      expect(mocks.findFirst).not.toHaveBeenCalled();
      expect(mocks.donationCreate).not.toHaveBeenCalled();
      expect(mocks.donationFindUnique).not.toHaveBeenCalled();
      expect(mocks.uploadDonationEvidence).not.toHaveBeenCalled();
      expect(mocks.donationDeleteMany).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("direct donation transfer submission", () => {
  it.each(["appealId", "fundId", "givingIntent", "amount", "transferReference", "domesticConfirmed", "evidence"] as const)(
    "rejects duplicate %s entries before selecting a donation destination or touching financial records",
    async field => {
      const original = requestWith();
      const form = await original.formData();
      if (field === "evidence") {
        form.append(field, new File(["one"], "first.png", { type: "image/png" }));
        form.append(field, new File(["two"], "second.png", { type: "image/png" }));
      } else {
        if (field === "fundId") form.append(field, "first-fund");
        form.append(field, "second-value");
      }
      const response = await POST(new Request(original.url, { method: "POST", body: form }));
      expect(response.status).toBe(400);
      expect(response.headers.get("cache-control")).toContain("no-store");
      expect((await response.json()).error).toMatch(/duplicate fields/i);
      expect(mocks.safeParse).not.toHaveBeenCalled();
      expect(mocks.findFirst).not.toHaveBeenCalled();
      expect(mocks.donationCreate).not.toHaveBeenCalled();
      expect(mocks.uploadDonationEvidence).not.toHaveBeenCalled();
    },
  );

  it.each(["cmf1234567890123456789013", ""])("rejects a submitted fund destination %j with the real schema before persistence or storage", async fundId => {
    const actual = await vi.importActual<typeof import("@/lib/donations")>("@/lib/donations");
    mocks.safeParse.mockImplementation(actual.directTransferSchema.safeParse.bind(actual.directTransferSchema));
    const original = requestWith();
    const form = await original.formData();
    form.set("fundId", fundId);
    const response = await POST(new Request(original.url, { method: "POST", body: form }));
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.donationCreate).not.toHaveBeenCalled();
    expect(mocks.uploadDonationEvidence).not.toHaveBeenCalled();
  });
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

  it.each([
    { mime: "text/plain", content: "not an image", name: "notes.txt" },
    { mime: "image/png", content: "not a PNG", name: "false.png" },
    { mime: "application/pdf", content: "not a PDF", name: "false.pdf" },
  ])("rejects unsupported or disguised evidence ($mime) before recording a bank transfer", async ({ mime, content, name }) => {
    const response = await POST(requestWith(new File([content], name, { type: mime })));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(expect.objectContaining({
      fieldErrors: { evidence: [expect.stringMatching(/valid PDF|JPEG|PNG|WebP/i)] },
    }));
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.donationCreate).not.toHaveBeenCalled();
    expect(mocks.uploadDonationEvidence).not.toHaveBeenCalled();
    expect(mocks.donationDeleteMany).not.toHaveBeenCalled();
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

  it.each([
    { raised: 100.001, goal: 1_000, reason: "sub-paise raised balance" },
    { raised: 100, goal: 1_000.001, reason: "sub-paise fundraising target" },
    { raised: 999.50, goal: 1_000, reason: "unpayable remaining balance" },
  ])("rejects a direct transfer when the appeal has a $reason", async ({ raised, goal }) => {
    mocks.findFirst.mockResolvedValueOnce({
      id: "appeal-1", slug: "appeal-1", title: "Appeal 1",
      status: "PUBLISHED", goalAmount: goal, amountRaised: raised, closesAt: null,
      assistanceRequest: { verification: { zakatStatus: "NOT_ELIGIBLE" } },
    });
    const response = await POST(requestWith());
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "This appeal is not accepting donations." });
    expect(mocks.donationCreate).not.toHaveBeenCalled();
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
        designationSnapshot: { version: 1, kind: "APPEAL", appealId: "appeal-1", label: "Appeal 1", givingIntent: "GENERAL" },
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

  it("rejects Zakat intent unless the appeal has explicit eligibility", async () => {
    mocks.safeParse.mockReturnValue({ success: true, data: { ...validData, givingIntent: "ZAKAT" } });

    const response = await POST(requestWith());
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toMatch(/not currently marked as Zakat-eligible/i);
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });

  it("preserves a transfer and its private evidence when the metadata acknowledgement is uncertain", async () => {
    const file = syntheticPng("synthetic transfer evidence");
    mocks.uploadDonationEvidence.mockResolvedValue({
      objectKey: "donations/donation-1/11111111-1111-4111-8111-111111111111.png",
      originalName: "transfer.png",
      mimeType: "image/png",
      sizeBytes: file.size,
    });
    mocks.donationUpdate.mockRejectedValueOnce(new Error("commit acknowledgement lost"));
    const response = await POST(requestWith(file));

    expect(response.status).toBe(500);
    expect((await response.json()).submissionUncertain).toBe(true);
    expect(mocks.donationDeleteMany).not.toHaveBeenCalled();
    expect(mocks.deleteDonationEvidenceObject).not.toHaveBeenCalled();
  });

  it("preserves the pending transfer and evidence when metadata storage fails", async () => {
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
    expect(mocks.donationCreate).toHaveBeenCalledOnce();
    expect(mocks.donationDeleteMany).not.toHaveBeenCalled();
    expect(mocks.deleteDonationEvidenceObject).not.toHaveBeenCalled();
  });

  it("retains a recorded transfer when optional evidence upload fails", async () => {
    const file = syntheticPng("synthetic transfer evidence");
    mocks.uploadDonationEvidence.mockRejectedValueOnce(new Error("private storage unavailable"));
    const response = await POST(requestWith(file));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.submissionUncertain).toBe(true);
    expect(body.receiptToken).toBeUndefined();
    expect(mocks.donationCreate).toHaveBeenCalledOnce();
    expect(mocks.donationUpdate).not.toHaveBeenCalled();
    expect(mocks.donationDeleteMany).not.toHaveBeenCalled();
    expect(mocks.deleteDonationEvidenceObject).not.toHaveBeenCalled();
  });

  it("does not delete a donor transfer claim after evidence metadata persistence fails", async () => {
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
    expect((await response.json()).submissionUncertain).toBe(true);
    expect(mocks.deleteDonationEvidenceObject).not.toHaveBeenCalled();
    expect(mocks.donationDeleteMany).not.toHaveBeenCalled();
  });
});
