import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

const taleem = { id: "fund_taleem", slug: "taleem", name: "Taleem Fund", zakatPolicy: "ACCEPTED", isGeneral: false };

function request(fields: Record<string, string | string[]> = {}) {
  const base: Record<string, string | string[]> = {
    fundSlug: "taleem", donorName: "Test Donor", donorEmail: "donor@example.com", amount: "3000", givingIntent: "SADAQAH",
    paymentMethod: "BANK_TRANSFER", transferReference: "UTR123456789", transferredAt: "2026-11-18T05:00:00.000Z", domesticConfirmed: "true",
    sponsorshipProgramme: "qaida", sponsorshipUnits: "1", sponsorshipMonths: "3",
    ...fields,
  };
  const form = new FormData();
  for (const [key, value] of Object.entries(base)) for (const item of [value].flat()) form.append(key, item);
  return new Request("https://amaana.example/api/donations/direct-transfer", { method: "POST", body: form });
}

describe("Taleem sponsorship through a bank/UPI transfer claim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("FUND_GIVING_ENABLED", "true");
    vi.stubEnv("TALEEM_SPONSORSHIP_ENABLED", "true");
    mocks.enforceDonationRateLimit.mockResolvedValue(true);
    mocks.fundFindFirst.mockResolvedValue(taleem);
    mocks.donationCreate.mockResolvedValue({ id: "donation-taleem", referenceNumber: "AFD-2026-12345678" });
  });
  afterEach(() => { vi.unstubAllEnvs(); });

  it("records a pending claim with the sponsorship columns, never marking it received", async () => {
    const response = await POST(request());
    expect(response.status).toBe(202);
    const data = mocks.donationCreate.mock.calls[0]?.[0].data;
    expect(data).toMatchObject({
      fundId: "fund_taleem", amount: 3000, status: "PENDING_VERIFICATION",
      sponsorshipProgramme: "qaida", sponsorshipUnits: 1, sponsorshipMonths: 3, sponsorshipMonthlyRate: 1000, sponsorshipRateVersion: "approved-2026-11",
    });
    expect(data).not.toHaveProperty("capturedAt");
  });

  it("is closed until its own switch is on", async () => {
    vi.stubEnv("TALEEM_SPONSORSHIP_ENABLED", "false");
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });

  it("refuses an amount that differs from the server's price", async () => {
    const response = await POST(request({ amount: "100" }));
    expect(response.status).toBe(409);
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });

  it("refuses a duplicated sponsorship field instead of trusting the first value", async () => {
    const response = await POST(request({ sponsorshipMonths: ["3", "12"] }));
    expect(response.status).toBe(400);
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });

  it("refuses an incomplete sponsorship", async () => {
    const response = await POST(request({ sponsorshipMonths: "" }));
    expect(response.status).toBe(400);
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });
});
