import { syntheticFundDesignation } from "@/test/fund-designation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DonationPaymentMethod, DonationStatus } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  donationFind: vi.fn(),
  duplicateCreditFind: vi.fn(),
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
const request = { donationId: "donation_test", actorId: "reviewer_test", decision: "VERIFY" as const, notes: "Bank entry matched", statementReference: "UTR-TEST-12345", statementAmount: "500.00", statementConfirmed: true };

describe("manual transfer money-state boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.transaction.mockImplementation(async callback => callback({
      donation: { findUnique: mocks.donationFind, findFirst: mocks.duplicateCreditFind, updateMany: mocks.donationUpdate },
      appeal: { findUnique: mocks.appealFind, update: mocks.appealUpdate, updateMany: mocks.appealUpdateMany },
      notification: { create: mocks.notificationCreate },
      auditEvent: { create: mocks.auditCreate },
    }));
    mocks.donationFind.mockResolvedValue({
      id: "donation_test", referenceNumber: "AFD-TEST", appealId: "appeal_test",
      donorEmail: "donor@example.test", givingIntent: "GENERAL",
      currency: "INR", amount: money(500), status: DonationStatus.PENDING_VERIFICATION,
      paymentMethod: DonationPaymentMethod.DIRECT_UPI,
      transferReference: "UTR-TEST-12345",
    });
    mocks.appealFind.mockResolvedValue({
      goalAmount: money(1000), amountRaised: money(100), status: "PUBLISHED",
    });
    mocks.duplicateCreditFind.mockResolvedValue(null);
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
    mocks.donationFind.mockResolvedValueOnce({ ...original, ...destination, designationSnapshot: destination.fundId ? syntheticFundDesignation(destination.fundId) : null, currency: "USD" });
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

  it("requires an explicit bank-statement match before recording money received", async () => {
    await expect(reconcileDirectDonation({ ...request, statementConfirmed: false }))
      .rejects.toThrow(/bank-statement match confirmation/);
    expect(mocks.donationUpdate).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });

  it.each(["UTR-WRONG-12345", "<untrusted>", ""])(
    "rejects an unmatched or malformed bank statement reference %s", async reference => {
      await expect(reconcileDirectDonation({ ...request, statementReference: reference }))
        .rejects.toThrow(/statement reference/);
      expect(mocks.donationUpdate).not.toHaveBeenCalled();
    },
  );

  it.each(["499.99", "500.01", "500.001", "5e2", "-500", "", "900719925474099"])(
    "rejects an inconsistent statement credit amount %s", async amount => {
      await expect(reconcileDirectDonation({ ...request, statementAmount: amount }))
        .rejects.toThrow(/statement amount/);
      expect(mocks.donationUpdate).not.toHaveBeenCalled();
      expect(mocks.auditCreate).not.toHaveBeenCalled();
    },
  );

  it("does not demand bank credit evidence for a rejection, and cannot queue a receipt", async () => {
    await expect(reconcileDirectDonation({ ...request, decision: "REJECT", statementConfirmed: false,
      statementReference: undefined, statementAmount: undefined }))
      .resolves.toMatchObject({ status: DonationStatus.REJECTED });
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });

  it.each(["500", "500.0", "500.00"])(
    "accepts canonical exact INR value %s without losing paise", async amount => {
      await expect(reconcileDirectDonation({ ...request, statementAmount: amount }))
        .resolves.toMatchObject({ status: DonationStatus.CAPTURED });
      expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
        metadata: expect.objectContaining({ statementAmountPaise: 50000 }),
      }) }));
    },
  );

  it("normalizes case of verified UTR while preserving the exact reference check", async () => {
    await expect(reconcileDirectDonation({ ...request, statementReference: "utr-test-12345" }))
      .resolves.toMatchObject({ status: DonationStatus.CAPTURED });
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      metadata: expect.objectContaining({ statementReference: "UTR-TEST-12345" }),
    }) }));
  });

  it("records the bank entry reference and exact verified paise in the immutable audit event", async () => {
    await reconcileDirectDonation(request);
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      action: "donation.transfer.verify",
      metadata: expect.objectContaining({ bankStatementMatched: true, statementReference: "UTR-TEST-12345", statementAmountPaise: 50000 }),
    }) }));
  });

  it("blocks double capture of a previously reconciled case-insensitive bank reference", async () => {
    mocks.duplicateCreditFind.mockResolvedValue({ id: "other_captured_donation" });
    await expect(reconcileDirectDonation(request)).rejects.toThrow(/already reconciled/);
    expect(mocks.duplicateCreditFind).toHaveBeenCalledWith({
      where: {
        id: { not: "donation_test" },
        paymentMethod: { in: [DonationPaymentMethod.DIRECT_UPI, DonationPaymentMethod.BANK_TRANSFER] },
        status: { in: [DonationStatus.CAPTURED, DonationStatus.REFUNDED] },
        transferReference: { equals: "UTR-TEST-12345", mode: "insensitive" },
      },
      select: { id: true },
    });
    expect(mocks.donationUpdate).not.toHaveBeenCalled();
    expect(mocks.appealUpdate).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("never queries old bank credits when staff rejects an unreceived claim", async () => {
    await reconcileDirectDonation({ ...request, decision: "REJECT", statementConfirmed: false });
    expect(mocks.duplicateCreditFind).not.toHaveBeenCalled();
  });

  it.each([{ statementConfirmed: false }, { statementAmount: "499.99" },
    { statementReference: "WRONG-UTR" }])(
    "does not query bank duplicate credits before attestation and amount checks %o", async patch => {
      await expect(reconcileDirectDonation({ ...request, ...patch })).rejects.toThrow();
      expect(mocks.duplicateCreditFind).not.toHaveBeenCalled();
      expect(mocks.donationUpdate).not.toHaveBeenCalled();
    },
  );

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
      fundId: "approved_fund", designationSnapshot: syntheticFundDesignation("approved_fund", "SADAQAH"), donorEmail: "donor@example.test",
      givingIntent: "SADAQAH", currency: "INR", amount: money(500),
      status: DonationStatus.PENDING_VERIFICATION,
      paymentMethod: DonationPaymentMethod.BANK_TRANSFER,
      transferReference: "UTR-TEST-12345",
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

  it("refuses verification of a fund claim without its approved original purpose", async () => {
    const original = await mocks.donationFind();
    mocks.donationFind.mockResolvedValueOnce({ ...original, appealId: null, fundId: "fund", designationSnapshot: null });
    await expect(reconcileDirectDonation(request)).rejects.toThrow(/requires reconciliation/);
    expect(mocks.donationUpdate).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });
  it("still allows rejection of a fund claim whose purpose requires reconciliation", async () => {
    const original = await mocks.donationFind();
    mocks.donationFind.mockResolvedValueOnce({ ...original, appealId: null, fundId: "fund", designationSnapshot: null });
    await expect(reconcileDirectDonation({ ...request, decision: "REJECT" })).resolves.toMatchObject({ status: DonationStatus.REJECTED });
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
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
