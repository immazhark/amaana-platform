import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enforceDonationRateLimit: vi.fn(),
  safeParse: vi.fn(),
  findFirst: vi.fn(),
  donationCreate: vi.fn(),
  donationUpdate: vi.fn(),
  donationDelete: vi.fn(),
  uploadDonationEvidence: vi.fn(),
  deleteDonationEvidenceObject: vi.fn(),
  isDonationAmountAllowedForRemaining: vi.fn(),
}));

vi.mock("@/lib/bounded-request-body", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/bounded-request-body")>();
  return actual;
});

vi.mock("@/lib/appeals", () => ({
  getRemainingAppealAmount: () => 900,
  isAppealOpenForDonations: () => true,
}));

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
      update: mocks.donationUpdate,
      delete: mocks.donationDelete,
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

function requestWith(file?: File) {
  const form = new FormData();
  form.set("appealId", validData.appealId);
  form.set("donorName", validData.donorName);
  form.set("donorEmail", validData.donorEmail);
  form.set("amount", String(validData.amount));
  form.set("givingIntent", validData.givingIntent);
  form.set("paymentMethod", validData.paymentMethod);
  form.set("transferReference", validData.transferReference);
  form.set("transferredAt", "2026-09-30T10:30");
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
  mocks.donationUpdate.mockResolvedValue({});
  mocks.donationDelete.mockResolvedValue({});
  mocks.deleteDonationEvidenceObject.mockResolvedValue(undefined);
});

describe("direct donation transfer submission", () => {
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

  it("rejects Zakat intent unless the appeal has explicit eligibility", async () => {
    mocks.safeParse.mockReturnValue({ success: true, data: { ...validData, givingIntent: "ZAKAT" } });

    const response = await POST(requestWith());
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toMatch(/not currently marked as Zakat-eligible/i);
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });

  it("removes uploaded evidence and the draft claim if evidence metadata persistence fails", async () => {
    const file = new File(["synthetic transfer evidence"], "transfer.png", { type: "image/png" });
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
    expect(mocks.donationDelete).toHaveBeenCalledWith({ where: { id: "donation-1" } });
  });
});
