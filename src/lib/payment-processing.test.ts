import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rootFindUnique: vi.fn(),
  fetchRazorpayPayment: vi.fn(),
  transaction: vi.fn(),
  txDonationFindUnique: vi.fn(),
  txDonationUpdateMany: vi.fn(),
  txAppealUpdate: vi.fn(),
  txAppealUpdateMany: vi.fn(),
  txNotificationCreate: vi.fn(),
}));

vi.mock("@/lib/razorpay", () => ({
  fetchRazorpayPayment: mocks.fetchRazorpayPayment,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    donation: {
      findUnique: mocks.rootFindUnique,
    },
  },
}));
vi.mock("@/lib/prisma-transaction", () => ({
  withSerializableTransactionRetry: mocks.transaction,
}));

import { captureDonation, ensureCapturedDonationForRefund } from "./payment-processing";

const decimal = (value: number) => ({
  mul: (factor: number) => ({ toNumber: () => value * factor }),
  toNumber: () => value,
});

describe("captureDonation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async callback => callback({
      donation: {
        findUnique: mocks.txDonationFindUnique,
        updateMany: mocks.txDonationUpdateMany,
      },
      appeal: {
        update: mocks.txAppealUpdate,
        updateMany: mocks.txAppealUpdateMany,
      },
      notification: {
        create: mocks.txNotificationCreate,
      },
    }));
  });

  it("fails closed before mutation when a captured amount is not a safe positive integer", async () => {
    mocks.txDonationFindUnique.mockResolvedValue({
      id: "donation_unsafe",
      currency: "INR",
      amount: decimal(500),
      referenceNumber: "AFD-2026-UNSAFE",
      appealId: "appeal_1",
      donorEmail: "donor@example.test",
      givingIntent: "GENERAL",
      receiptTokenHash: "hash",
    });

    await expect(captureDonation("order_unsafe", "pay_unsafe", Number.MAX_SAFE_INTEGER + 1))
      .rejects.toThrow("Payment does not match donation order");

    expect(mocks.txDonationUpdateMany).not.toHaveBeenCalled();
    expect(mocks.txAppealUpdate).not.toHaveBeenCalled();
    expect(mocks.txNotificationCreate).not.toHaveBeenCalled();
  });

  it("fails closed when the stored rupee amount cannot be represented safely in paise", async () => {
    mocks.txDonationFindUnique.mockResolvedValue({
      id: "donation_unsafe",
      currency: "INR",
      amount: decimal(Number.MAX_SAFE_INTEGER),
      referenceNumber: "AFD-2026-UNSAFE",
      appealId: "appeal_1",
      donorEmail: "donor@example.test",
      givingIntent: "GENERAL",
      receiptTokenHash: "hash",
    });

    await expect(captureDonation("order_unsafe", "pay_unsafe", 50_000))
      .rejects.toThrow("Payment does not match donation order");

    expect(mocks.txDonationUpdateMany).not.toHaveBeenCalled();
  });
});

describe("ensureCapturedDonationForRefund", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async callback => callback({
      donation: {
        findUnique: mocks.txDonationFindUnique,
        updateMany: mocks.txDonationUpdateMany,
      },
      appeal: {
        update: mocks.txAppealUpdate,
        updateMany: mocks.txAppealUpdateMany,
      },
      notification: {
        create: mocks.txNotificationCreate,
      },
    }));
    mocks.txDonationUpdateMany.mockResolvedValue({ count: 1 });
    mocks.txAppealUpdate.mockResolvedValue({
      id: "appeal_1",
      status: "PUBLISHED",
      goalAmount: decimal(10_000),
      amountRaised: decimal(1_000),
    });
    mocks.txAppealUpdateMany.mockResolvedValue({ count: 0 });
    mocks.txNotificationCreate.mockResolvedValue({ id: "notification_1" });
  });

  it("does not call Razorpay again when the payment is already captured locally", async () => {
    mocks.rootFindUnique.mockResolvedValueOnce({ id: "donation_1", status: "CAPTURED" });

    await expect(ensureCapturedDonationForRefund("pay_1")).resolves.toEqual({
      donationId: "donation_1",
      matched: true,
      alreadyCaptured: true,
    });

    expect(mocks.fetchRazorpayPayment).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("leaves an unrelated provider payment unmatched without mutating local donation accounting", async () => {
    mocks.rootFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mocks.fetchRazorpayPayment.mockResolvedValue({
      id: "pay_external",
      order_id: "order_external",
      amount: 50_000,
      currency: "INR",
      status: "captured",
      captured: true,
    });

    await expect(ensureCapturedDonationForRefund("pay_external")).resolves.toEqual({
      donationId: null,
      matched: false,
      alreadyCaptured: false,
    });

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("captures a valid Amaana order before refund accounting when the refund arrives first", async () => {
    mocks.rootFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "donation_1", amount: decimal(500) });
    mocks.fetchRazorpayPayment.mockResolvedValue({
      id: "pay_1",
      order_id: "order_1",
      amount: 50_000,
      currency: "INR",
      status: "captured",
      captured: true,
    });
    mocks.txDonationFindUnique.mockResolvedValueOnce({
      id: "donation_1",
      currency: "INR",
      amount: decimal(500),
      referenceNumber: "AFD-2026-12345678",
      appealId: "appeal_1",
      donorEmail: "donor@example.test",
      receiptTokenHash: "hash",
    });

    await expect(ensureCapturedDonationForRefund("pay_1")).resolves.toEqual({
      donationId: "donation_1",
      matched: true,
      alreadyCaptured: false,
    });

    expect(mocks.txDonationUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: "donation_1",
        status: { in: ["CREATED", "AUTHORIZED", "FAILED"] },
      },
      data: expect.objectContaining({
        status: "CAPTURED",
        providerPaymentId: "pay_1",
      }),
    }));
    expect(mocks.txAppealUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "appeal_1" },
      data: { amountRaised: { increment: expect.anything() } },
    }));
    expect(mocks.txNotificationCreate).toHaveBeenCalledTimes(1);
  });

  it("fails closed when Razorpay returns an amount different from the Amaana order", async () => {
    mocks.rootFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "donation_1", amount: decimal(500) });
    mocks.fetchRazorpayPayment.mockResolvedValue({
      id: "pay_1",
      order_id: "order_1",
      amount: 49_900,
      currency: "INR",
      status: "captured",
      captured: true,
    });

    await expect(ensureCapturedDonationForRefund("pay_1")).rejects.toThrow(/amount does not match/i);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
