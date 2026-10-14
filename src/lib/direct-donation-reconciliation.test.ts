import { beforeEach, describe, expect, it, vi } from "vitest";
import { DonationPaymentMethod, DonationStatus } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  donationFind: vi.fn(),
  donationUpdate: vi.fn(),
  appealFind: vi.fn(),
  appealUpdate: vi.fn(),
  appealUpdateMany: vi.fn(),
  notificationCreate: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock("@/lib/prisma-transaction", () => ({
  withSerializableTransactionRetry: mocks.transaction,
}));

import { reconcileDirectDonation } from "./direct-donation-reconciliation";

const money = (rupees: number) => ({
  toNumber: () => rupees,
  mul: (scale: number) => ({ toNumber: () => rupees * scale }),
});
const request = { donationId: "donation_test", actorId: "reviewer_test", decision: "VERIFY" as const, notes: "Bank entry matched" };

describe("manual transfer money-state boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.transaction.mockImplementation(async callback => callback({
      donation: { findUnique: mocks.donationFind, updateMany: mocks.donationUpdate },
      appeal: { findUnique: mocks.appealFind, update: mocks.appealUpdate, updateMany: mocks.appealUpdateMany },
      notification: { create: mocks.notificationCreate },
      auditEvent: { create: mocks.auditCreate },
    }));
    mocks.donationFind.mockResolvedValue({
      id: "donation_test", referenceNumber: "AFD-TEST", appealId: "appeal_test",
      donorEmail: "donor@example.test", givingIntent: "GENERAL",
      currency: "INR", amount: money(500), status: DonationStatus.PENDING_VERIFICATION,
      paymentMethod: DonationPaymentMethod.DIRECT_UPI,
    });
    mocks.appealFind.mockResolvedValue({
      goalAmount: money(1000), amountRaised: money(100), status: "PUBLISHED",
    });
    mocks.donationUpdate.mockResolvedValue({ count: 1 });
    mocks.appealUpdate.mockResolvedValue({
      id: "appeal_test", goalAmount: money(1000), amountRaised: money(600), status: "PUBLISHED",
    });
  });

  it("rejects unsupported runtime decisions without opening a financial transaction", async () => {
    await expect(reconcileDirectDonation({ ...request, decision: "OTHER" as "VERIFY" }))
      .rejects.toThrow("Invalid reconciliation decision");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it.each([0, -1, 0.001, Number.MAX_SAFE_INTEGER])(
    "rejects unsafe stored donation amount %s without changing records", async amount => {
      mocks.donationFind.mockResolvedValueOnce({
        id: "donation_test", currency: "INR", amount: money(amount), status: DonationStatus.PENDING_VERIFICATION,
        paymentMethod: DonationPaymentMethod.DIRECT_UPI, appealId: "appeal_test",
      });
      await expect(reconcileDirectDonation(request)).rejects.toThrow("Invalid financial amounts");
      expect(mocks.donationUpdate).not.toHaveBeenCalled();
      expect(mocks.appealUpdate).not.toHaveBeenCalled();
      expect(mocks.notificationCreate).not.toHaveBeenCalled();
    },
  );

  it.each([
    [0, 100],
    [-50, 100],
    [1000, -1],
    [Number.MAX_SAFE_INTEGER, 100],
  ])("rejects invalid goal %s or raised amount %s", async (goal, raised) => {
    mocks.appealFind.mockResolvedValueOnce({
      goalAmount: money(goal), amountRaised: money(raised), status: "PUBLISHED",
    });
    await expect(reconcileDirectDonation(request)).rejects.toThrow("Invalid financial amounts");
    expect(mocks.donationUpdate).not.toHaveBeenCalled();
  });

  it.each([
    { appealId: "appeal_test", fundId: null },
    { appealId: null, fundId: "approved_fund" },
  ])("does not verify foreign currency for destination %o", async destination => {
    const original = await mocks.donationFind();
    mocks.donationFind.mockResolvedValueOnce({ ...original, ...destination, currency: "USD" });
    await expect(reconcileDirectDonation(request)).rejects.toThrow("Invalid financial amounts");
    expect(mocks.donationUpdate).not.toHaveBeenCalled();
    expect(mocks.appealFind).not.toHaveBeenCalled();
    expect(mocks.appealUpdate).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("allows a reviewer to reject an invalid foreign-currency claim", async () => {
    const original = await mocks.donationFind();
    mocks.donationFind.mockResolvedValueOnce({ ...original, currency: "USD" });
    await expect(reconcileDirectDonation({ ...request, decision: "REJECT" })).resolves.toMatchObject({ status: DonationStatus.REJECTED });
    expect(mocks.appealUpdate).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
    expect(mocks.auditCreate).toHaveBeenCalledOnce();
  });

  it("keeps an otherwise valid direct transfer eligible for reconciliation", async () => {
    await expect(reconcileDirectDonation(request)).resolves.toEqual({
      status: DonationStatus.CAPTURED, referenceNumber: "AFD-TEST",
    });
    expect(mocks.donationUpdate).toHaveBeenCalledOnce();
    expect(mocks.appealUpdate).toHaveBeenCalledOnce();
    expect(mocks.notificationCreate).toHaveBeenCalledOnce();
    expect(mocks.auditCreate).toHaveBeenCalledOnce();
  });
  it("verifies a fund transfer without reading or incrementing appeal totals", async () => {
    mocks.donationFind.mockResolvedValueOnce({
      id: "donation_fund", referenceNumber: "AFD-FUND", appealId: null,
      fundId: "approved_fund", donorEmail: "donor@example.test",
      givingIntent: "SADAQAH", currency: "INR", amount: money(500),
      status: DonationStatus.PENDING_VERIFICATION,
      paymentMethod: DonationPaymentMethod.BANK_TRANSFER,
    });
    const result = await reconcileDirectDonation(request);
    expect(result.status).toBe(DonationStatus.CAPTURED);
    expect(mocks.appealFind).not.toHaveBeenCalled();
    expect(mocks.appealUpdate).not.toHaveBeenCalled();
    expect(mocks.donationUpdate).toHaveBeenCalledOnce();
    expect(mocks.notificationCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ payload: expect.objectContaining({ designationKind: "FUND" }) }),
    }));
  });

  it("refuses a transfer with two monetary destinations", async () => {
    mocks.donationFind.mockResolvedValueOnce({
      id: "donation_mixed", referenceNumber: "AFD-MIXED",
      appealId: "appeal_test", fundId: "fund_test",
      status: DonationStatus.PENDING_VERIFICATION,
      paymentMethod: DonationPaymentMethod.DIRECT_UPI,
    });
    await expect(reconcileDirectDonation(request)).rejects.toThrow(/exactly one/);
    expect(mocks.donationUpdate).not.toHaveBeenCalled();
    expect(mocks.appealUpdate).not.toHaveBeenCalled();
  });

});
