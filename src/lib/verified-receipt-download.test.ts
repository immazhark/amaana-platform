import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("@/lib/private-donation-receipt", () => ({
  readVerifiedDonationAcknowledgement: mocks.read,
}));
import { issueVerifiedReceiptDownloadGrant, redeemVerifiedReceiptDownloadGrant } from "./verified-receipt-download";

const reference = "AFD-2026-12345678";
const token = "synthetic-private-token-012345678901234";
const record = {
  found: true,
  presentation: { tone: "captured", heading: "Verified", summary: "Record", statusLabel: "Captured" },
  donation: {
    referenceNumber: reference,
    receiptNumber: "ACK-AFD-2026-12345678", donorName: "Synthetic donor", givingIntent: "GENERAL",
    amount: 123.45, refundedAmount: 0, recordDate: "2026-10-15T00:00:00Z",
    providerPaymentId: "pay_synthetic", designationKind: "APPEAL",
    appeal: { title: "Synthetic appeal", slug: "synthetic-appeal" },
  },
};

beforeEach(() => {
  vi.stubEnv("RECEIPT_DOWNLOAD_ENCRYPTION_KEY", "a1".repeat(32));
  vi.resetAllMocks();
  mocks.read.mockResolvedValue(record);
});
afterEach(() => vi.unstubAllEnvs());

describe("private receipt download authorization", () => {
  it("mints only after proving possession of the existing receipt token", async () => {
    const grant = await issueVerifiedReceiptDownloadGrant({ reference, token });
    expect(grant).toMatch(/^rd1\./);
    expect(mocks.read).toHaveBeenCalledExactlyOnceWith({ reference, token }, { requireOriginalPurpose: true });
    const latest = await redeemVerifiedReceiptDownloadGrant(grant);
    expect(latest).toEqual(record);
    expect(mocks.read).toHaveBeenCalledTimes(2);
  });

  it.each([null, { ...record, presentation: { ...record.presentation, tone: "pending" } },
    { ...record, presentation: { ...record.presentation, tone: "failed" } },
    { ...record, donation: { ...record.donation, receiptNumber: null } }])(
    "never mints a grant for absent/unsettled/unreceipted money", async projection => {
      mocks.read.mockResolvedValue(projection);
      expect(await issueVerifiedReceiptDownloadGrant({ reference, token })).toBeNull();
    },
  );

  it("does not authorize revoked or changed financial records merely because a grant exists", async () => {
    const grant = await issueVerifiedReceiptDownloadGrant({ reference, token });
    mocks.read.mockResolvedValueOnce(null);
    expect(await redeemVerifiedReceiptDownloadGrant(grant)).toBeNull();
    mocks.read.mockResolvedValueOnce({ ...record, presentation: { ...record.presentation, tone: "pending" } });
    expect(await redeemVerifiedReceiptDownloadGrant(grant)).toBeNull();
  });

  it("rejects malformed or expired grants without any private record lookup", async () => {
    expect(await redeemVerifiedReceiptDownloadGrant("invalid")).toBeNull();
    expect(await redeemVerifiedReceiptDownloadGrant(null)).toBeNull();
    expect(mocks.read).not.toHaveBeenCalled();
  });

  it("rejects a previous grant after encryption-key rotation without reading private data", async () => {
    const grant = await issueVerifiedReceiptDownloadGrant({ reference, token });
    mocks.read.mockClear();
    vi.stubEnv("RECEIPT_DOWNLOAD_ENCRYPTION_KEY", "b2".repeat(32));
    expect(await redeemVerifiedReceiptDownloadGrant(grant)).toBeNull();
    expect(mocks.read).not.toHaveBeenCalled();
  });
});
