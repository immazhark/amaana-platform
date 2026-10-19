import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  permission: vi.fn(),
  donations: vi.fn(),
  audit: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requirePermission: mocks.permission }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    donation: { findMany: mocks.donations },
    auditEvent: { create: mocks.audit },
  },
}));

import { GET } from "./route";

const url = "https://amaanafoundation.org/admin/donations/finance-export?month=2026-10";
const row = {
  referenceNumber: "AF-001",
  receiptNumber: "ACK-001",
  givingIntent: "GENERAL",
  paymentMethod: "RAZORPAY",
  status: "CAPTURED",
  currency: "INR",
  amount: new Prisma.Decimal("125.00"),
  refundedAmount: new Prisma.Decimal("0.00"),
  capturedAt: new Date("2026-10-10T12:00:00.000Z"),
  refundedAt: null,
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.permission.mockResolvedValue({ id: "finance-staff" });
  mocks.donations.mockResolvedValue([row]);
  mocks.audit.mockResolvedValue({ id: "audit-record" });
});

describe("private finance monthly download", () => {
  it("checks reconciliation permission before any donation query", async () => {
    mocks.permission.mockRejectedValue(new Error("UNAUTHORIZED"));
    await expect(GET(new Request(url))).rejects.toThrow("UNAUTHORIZED");
    expect(mocks.permission).toHaveBeenCalledWith("donation.reconcile");
    expect(mocks.donations).not.toHaveBeenCalled();
  });

  it("denies malformed and repeated month selectors", async () => {
    for (const requestUrl of [url + "&month=2026-11", url.replace("2026-10", "2026-13"), url.split("?")[0]]) {
      const response = await GET(new Request(requestUrl));
      expect(response.status).toBe(400);
    }
    expect(mocks.donations).not.toHaveBeenCalled();
  });

  it("exports only financial fields after audit with no-store, and strict local-month query", async () => {
    const response = await GET(new Request(url));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(response.headers.get("content-disposition")).toContain("attachment");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    const csv = await response.text();
    expect(csv).toContain("AF-001");
    expect(csv).toContain("125.00,0.00,125.00");
    expect(csv).not.toContain("donor_email");
    expect(mocks.donations).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: { in: ["CAPTURED", "REFUNDED"] }, capturedAt: {
        gte: new Date("2026-09-30T18:30:00.000Z"),
        lt: new Date("2026-10-31T18:30:00.000Z"),
      } },
      take: 5001,
      select: expect.not.objectContaining({ donorEmail: true, donorName: true }),
    }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ actorId: "finance-staff", action: "donation.finance_export" }),
    }));
  });

  it("refuses oversize exports rather than silently truncating", async () => {
    mocks.donations.mockResolvedValue(Array(5001).fill(row));
    const response = await GET(new Request(url));
    expect(response.status).toBe(413);
    expect(mocks.audit).not.toHaveBeenCalled();
  });

  it("fails closed when an audit record cannot be written", async () => {
    mocks.audit.mockRejectedValue(new Error("database unavailable"));
    const response = await GET(new Request(url));
    expect(response.status).toBe(503);
    expect((await response.text())).not.toContain("database unavailable");
  });
});
