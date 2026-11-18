import { Prisma } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enforceDonationRateLimit: vi.fn(), fundFindFirst: vi.fn(), appealFindFirst: vi.fn(),
  donationCreate: vi.fn(), donationFindUnique: vi.fn(), donationUpdate: vi.fn(), donationDeleteMany: vi.fn(),
}));

vi.mock("@/lib/request-security", () => ({ isSameOrigin: () => true, enforceDonationRateLimit: mocks.enforceDonationRateLimit }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    fund: { findFirst: mocks.fundFindFirst },
    appeal: { findFirst: mocks.appealFindFirst },
    donation: { create: mocks.donationCreate, findUnique: mocks.donationFindUnique, update: mocks.donationUpdate, deleteMany: mocks.donationDeleteMany },
  },
}));
vi.mock("@/lib/storage", () => ({ MAX_FILE_BYTES: 5 * 1024 * 1024, uploadDonationEvidence: vi.fn(), deleteDonationEvidenceObject: vi.fn() }));
vi.mock("@/lib/env", () => ({ validateProductionEnvironment: () => undefined }));

import { POST } from "./route";

beforeAll(() => { vi.stubEnv("FUND_GIVING_ENABLED", "true"); });
afterAll(() => { vi.unstubAllEnvs(); });

const general = { id: "fund_general", slug: "general", name: "General Fund", zakatPolicy: "ACCEPTED", isGeneral: true };
const dates = { id: "fund_dates", slug: "dates", name: "Dates Fund", zakatPolicy: "NOT_ACCEPTED", isGeneral: false };

function request(fields: Record<string, string | string[]> = {}) {
  const base: Record<string, string | string[]> = {
    fundSlug: "general", donorName: "Test Donor", donorEmail: "donor@example.com", amount: "5000", givingIntent: "SADAQAH",
    paymentMethod: "BANK_TRANSFER", transferReference: "UTR123456789", transferredAt: "2026-11-18T05:00:00.000Z", domesticConfirmed: "true",
    ...fields,
  };
  const form = new FormData();
  for (const [key, value] of Object.entries(base)) for (const item of [value].flat()) form.append(key, item);
  return new Request("https://amaana.example/api/donations/direct-transfer", { method: "POST", body: form });
}

describe("fund bank/UPI transfer claims", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.enforceDonationRateLimit.mockResolvedValue(true);
    mocks.fundFindFirst.mockResolvedValue(general);
    mocks.donationCreate.mockResolvedValue({ id: "donation-fund", referenceNumber: "AFD-2026-12345678" });
  });

  it("is closed unless the owner has switched fund giving on", async () => {
    vi.stubEnv("FUND_GIVING_ENABLED", "false");
    try {
      const response = await POST(request());
      expect(response.status).toBe(409);
      expect(mocks.fundFindFirst).not.toHaveBeenCalled();
      expect(mocks.donationCreate).not.toHaveBeenCalled();
    } finally { vi.stubEnv("FUND_GIVING_ENABLED", "true"); }
  });

  it("records a pending-verification claim against the fund, never marking it received", async () => {
    const response = await POST(request({ givingIntent: "ZAKAT", donorDirective: " winter clothes for orphans " }));
    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({ status: "PENDING_VERIFICATION", referenceNumber: "AFD-2026-12345678" });
    const data = mocks.donationCreate.mock.calls[0]?.[0].data;
    expect(data).toMatchObject({ fundId: "fund_general", donorDirective: "winter clothes for orphans", status: "PENDING_VERIFICATION", givingIntent: "ZAKAT", transferReference: "UTR123456789" });
    expect(data).not.toHaveProperty("appealId");
    expect(data).not.toHaveProperty("capturedAt");
    expect(mocks.appealFindFirst).not.toHaveBeenCalled();
  });

  it("refuses Zakat on a fund that does not accept it before recording anything", async () => {
    mocks.fundFindFirst.mockResolvedValue(dates);
    const response = await POST(request({ fundSlug: "dates", givingIntent: "ZAKAT" }));
    expect(response.status).toBe(409);
    expect((await response.json()).error).toMatch(/Zakat is not accepted for this fund/);
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });

  it("rejects a submission naming both an appeal and a fund", async () => {
    const response = await POST(request({ appealId: "cmf1234567890123456789012" }));
    expect(response.status).toBe(400);
    expect(mocks.fundFindFirst).not.toHaveBeenCalled();
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });

  it.each([
    ["a duplicated fund field", { fundSlug: ["general", "dates"] }],
    ["a duplicated directive", { donorDirective: ["a", "b"] }],
    ["an invalid slug", { fundSlug: "Bad Slug" }],
    ["an amount below the minimum", { amount: "9" }],
    ["a missing transfer reference", { transferReference: "" }],
  ])("rejects %s without a donation record", async (_name, fields) => {
    const response = await POST(request(fields));
    expect(response.status).toBe(400);
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });

  it("will not accept a custom request on a specific fund", async () => {
    mocks.fundFindFirst.mockResolvedValue({ ...general, slug: "orphan", isGeneral: false });
    const response = await POST(request({ fundSlug: "orphan", donorDirective: "somewhere else" }));
    expect(response.status).toBe(400);
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });

  it("reports a reused transfer reference without creating another claim", async () => {
    mocks.donationCreate.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "6", meta: { target: ["transferReference"] } }));
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect((await response.json()).error).toMatch(/already been submitted/);
  });
});
